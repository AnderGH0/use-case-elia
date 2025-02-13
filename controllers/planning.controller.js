//Models
const User = require("../models/user.model");
const Week = require("../models/week.model");
const ServiceCenter = require("../models/serviceCenter.model");
const Planning = require("../models/planning.model");
const Request = require("../models/request.model");

const addDays = (date, days) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate; //newDate.toLocaleString()
}

async function createPlanning(weeks, numUsers, planning, pickedUsers){
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
            const newWeekObj = newWeek.toObject();

            planning.weeks.push(newWeek);
            await planning.save();
            
            //push the shift days in the user 
            const currentUser = await User.findById(user._id);

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
}

const planningCreation = async (req, res) => {
    
    const {startDate, numUsers, weeks, serviceCenter} = req.body; // Start weeks must be a multiple of users

    try {
        next();
        const sc = await ServiceCenter.findOne({name: serviceCenter});
        
        let changing = new Date(startDate); 
        //create planning
        const planning = new Planning({
            serviceCenter,
            startDate,
            endDate: addDays(changing, weeks*7),
        });

        //array with picked users by worked days depending on service center. Excludes Admins
        const pickedUsers = await User.find({$and:[{serviceCenter}, {isAdmin : false}]}).sort({workedDays:"asc"}).limit(numUsers); 

        // generate planning
        createPlanning(weeks, numUsers, planning, pickedUsers)

        //save planning in the service center
        sc.planning = planning;
        await sc.save();

        return res.json({error: false, message: "Planning created successfully", planning});
    } catch (error) {
        return res.status(500).json({error: true, message: error.message});
    }
}

const daysByUser = async (req, res) => {
    const {userID} = req.params;
    if(!userID) return res.status(400).json({message: "User ID is missing"});
    try {
        const user = await User.findById(userID);
        if(!user) return res.status(404).json({error: true, message: "User not found"});

        return res.json({error: false, message: "These are the days the user is on duty", days: user.shifts});
    } catch (error) {
        return res.status(500).json({error: true, message: error.message});
    }
}

const planningByServiceCenter = async (req, res) => {
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
}

const deletePlanning = async(req, res) =>{
    const {id} = req.params;

    //delete all weeks
    try {
        next();
        //delete weeks from this planning from the weeks collection
        const planning = await Planning.findById(id).populate("weeks");
        for (const week of planning.weeks) {
            await Week.findByIdAndDelete(week._id);
        }
        //FIX ME verify only using from this planning are getting their shifts deleted
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
}

const switchShifts = async(req, res) => {
    const {requestID} = req.params;  
    const {accepted} = req.body; // "accepted", "ignored"
    if(!accepted) return res.status(400).json({error: true, message:"Accepted field is missing"});
    try {
        next();

        const isRequest = await Request.findById(requestID);
        const absentee = await User.findOne({phone: isRequest.userPhone});
        const target = await User.findOne({phone: isRequest.targetPhone});

        //modify the days in the database
        if(accepted === "accepted"){
            isRequest.pending = false;
            isRequest.picked = true;
            await isRequest.save();

            //modify the days in the absentee's shifts
            isRequest.days.forEach(async (day) => {
                const thisDay = new Date(day); 
                const index = absentee.shifts.indexOf(thisDay.toString());
            
                if(index === 0) return res.status(400).json({error: true, message:"Day not found in absentee's shifts"});

                absentee.shifts.splice(index, 1);
            })
            await absentee.save();

            //modify the days in the target's shifts
            for (const day of isRequest.days) {
                target.shifts.push(day);
                target.shifts.sort(a, b => a - b);
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
        else { //request declined => becomes global: send request to every user in the service center
            const scUsers = await User.find({serviceCenter: absentee.serviceCenter});
            scUsers.forEach(async (user) =>  {
                if(user.phone !== target.phone){
                    user.requests.push(isRequest);
                    await user.save();
                }           
            })
            return res.json({error:false, message:"Request declined and send to every user in your Service Center", isRequest})
        }
    } catch (error) {
        return res.status(400).json({error: true , message: error.message});
    }
}

module.exports = {
    planningCreation,
    addDays,
    daysByUser,
    planningByServiceCenter,
    deletePlanning,
    switchShifts
};