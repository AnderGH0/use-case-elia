//express rotuer
const express = require("express");
const router = express.Router();
//jwt
const {authenticateToken} = require("../utilities");
//Models
const User = require("../models/user.model");
const Week = require("../models/week.model");
const ServiceCenter = require("../models/serviceCenter.model");
const Planning = require("../models/planning.model");
const Request = require("../models/request.model");

function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate; //newDate.toLocaleString()
}

//create a planning, with X number users and Y number of weeks. Make it so you cant create a planning overlapping another planning
router.post('/', authenticateToken, async (req, res) => {
    
    const {startDate, numUsers, weeks, serviceCenter} = req.body; // Start weeks must be a multiple of users
    if(!startDate || !numUsers || !weeks) return res.status(400).json({message: "Planning information is missing"});
    if(weeks % numUsers !== 0) return res.status(400).json({message: "Weeks must be a multiple of users"});

    try {
        const sc = await ServiceCenter.findOne({name: serviceCenter});
        if(!sc) return res.status(404).json({error: true, message: "Service center not found"});
        
        let changing = new Date(startDate); 
        //create planning
        const planning = new Planning({
            serviceCenter,
            startDate,
            endDate: addDays(changing, weeks*7),
        });

        // verify if the new planning overlaps with another planning
        const existingPlanning = await Planning.findOne({serviceCenter})
        console.log(existingPlanning);
        const isOverlapping = existingPlanning && ((planning.startDate >= existingPlanning.startDate && planning.startDate <= existingPlanning.endDate) || (planning.endDate >= existingPlanning.startDate && planning.endDate <= existingPlanning.endDate));
        if(isOverlapping) return res.status(400).json({error: true, message: "Planning overlaps with another planning"});

        //array with picked users by worked days depending on service center. Excludes Admins
        const pickedUsers = await User.find({$and:[{serviceCenter}, {isAdmin : false}]}).sort({workedDays:"asc"}).limit(numUsers); 

        let cycles = 0;        

        //creates looping calendar 
        while (cycles < weeks/numUsers){
            for (const user of pickedUsers) {
                const newWeek = new Week({
                    thursday : {date: changing, user: user._id},
                    friday : {date: addDays(changing, 1), user: user._id},
                    saturday : {date: addDays(changing, 2), user: user._id},
                    sunday : {date: addDays(changing, 3), user: user._id},
                    monday : { date:  addDays(changing, 4), user: user._id},
                    tuesday : {date: addDays(changing, 5), user: user._id},
                    wednesday : {date: addDays(changing, 6), user: user._id},
                });
                planning.weeks.push(newWeek);
                await planning.save();
                
                //push the shift days in the user 
                const currentUser = await User.findById(user._id);
                const newWeekObj = newWeek.toObject();
                for (const day of Object.keys(newWeekObj)) {
                    if (newWeekObj[day].date) {
                        currentUser.shifts.push(newWeekObj[day].date);
                    }
                }
                await currentUser.save();
                newWeek.serviceCenter = serviceCenter;
                await newWeek.save();

                changing = addDays(changing, 7);
            }
            
            cycles++;
        }
        //save planning in the service center
        sc.planning = planning;
        await sc.save();

        return res.json({error: false, message: "Planning created successfully", planning});
    } catch (error) {
        return res.status(500).json({error: true, message: error.message});
    }
});

// get weeks by user
router.get("/user/:userID", authenticateToken, async (req, res) => {
    const {userID} = req.params;
    if(!userID) return res.status(400).json({message: "User ID is missing"});
    try {
        const user = await User.findById(userID);
        if(!user) return res.status(404).json({error: true, message: "User not found"});
        return res.json({error: false, message: "These are the days the user is on duty", days: user.shifts});
    } catch (error) {
        return res.status(500).json({error: true, message: error.message});
    }
});

//get planning by serviceCenter, case sensitive
router.get("/sc/:name", authenticateToken, async (req, res) => {
    const {name} = req.params;
    if(!name) return res.status(400).json({message: "Service center name is missing"});
    try {
        //find service center
        const sc = await ServiceCenter.findOne({name});
        if(!sc) return res.status(404).json({error: true, message: "Service center not found"});
        //find and populate planning
        const planning = await Planning.findById(sc.planning).populate("weeks");
        return res.json({error: false, message: "Planning for service center", planning});
    } catch (error) {
        return res.status(500).json({error: true, message: error.message});
    }
});


router.put("/switch-shifts/:requestID", authenticateToken, async(req, res) => {
    const {requestID} = req.params  
    const {accepted} = req.body; // "accepted", "ignored"
    try {
        const isRequest = await Request.findById(requestID);
        //verify if request exists
        if(!isRequest) return res.status(404).json({error: true, message:"Request not found"});
        //verify if request is pending
        if(isRequest.pending === false) return res.status(400).json({error: true, message:"Request already accepted or refused"});
        
        //modify the days in the database
        if(accepted === "accepted"){
            isRequest.pending = false;
            isRequest.picked = true;
            await isRequest.save();

            //modify the days in the absentee's shifts
            const absentee = await User.findOne({phone: isRequest.userPhone});
            if(!absentee) return res.status(404).json({error: true, message:"Absentee user not found"});
            isRequest.days.forEach(async (day) => {
                const thisDay = new Date(day); 
                const index = absentee.shifts.indexOf(thisDay.toString());
            
                if(index === 0) return res.status(400).json({error: true, message:"Day not found in absentee's shifts"});

                absentee.shifts.splice(index, 1);
            })
            await absentee.save();

            //modify the days in the target's shifts
            const target = await User.findOne({phone: isRequest.targetPhone});
            if(!target) return res.status(404).json({error: true, message:"Target user not found"});
            for (const day of isRequest.days) {
                target.shifts.push(day);
            }
            await target.save();
            //replace the absentee with the target in the week collection 

            for (let day of isRequest.days){
                const thisDay = new Date(day);
                const dayName = thisDay.toLocaleDateString("en-US", {weekday: "long"}).toLowerCase(); //get the name of the day
                // look for the exact week in the collection using the date
                const week = await Week.findOne({[`${dayName}.date`]: [thisDay.toISOString()]});
                if (week) {
                    week[dayName].user = target._id;
                    await week.save();
                }
            }
            return res.json({error:false, message:"Request accepted successfully", isRequest})
        }
        return res.json({error:false, message:"Request was not accepted, nothing changed", isRequest})
    } catch (error) {
        return res.status(400).json({error: true , message: error.message});
    }
});

//delee planning, delete shift from users, delete weeks from collection
router.delete("/:id", authenticateToken, async(req, res) =>{
    const {id} = req.params;
    //delete all weeks
    try {
        //delete weeks from this planning from the weeks collection
        const planning = await Planning.findById(id).populate("weeks");
        for (const week of planning.weeks) {
            await Week.findByIdAndDelete(week._id);
        }
        //delete shift days from this planning from the users collection
        const users = await User.find({serviceCenter: planning.serviceCenter});
        for (const user of users) {
            user.shifts = [];
            await user.save();
        }
        //delete planning from the service center
        const sc = await ServiceCenter.findOne({name: planning.serviceCenter});
        sc.planning = null;
        await sc.save();
        //delete planning
        await Planning.findByIdAndDelete(id);
        return res.json({error:false, message:"Planning deleted successfully"});       
    } catch (error) {
        return res.status(500).json({error: true, message: error.message});
    }
})

module.exports = router;


// req.body => "days" : ["2025-01-01"]
// Date.toLocaleString()  =>  "20/12/2012, 03:00:00"

// + GET    /user/:userId                          Avoir les semaines de travail par user --
// + GET    /zone/:name                            Recevoir l'horaire de la zone (par semaines) --
// PUT       /switch-shifts                         Change dans les weeks la personne qui va travailler un/des date(s)
// + POST   /                     admin     Créer calendrier avec X users aléatoires