//express rotuer
const express = require("express");
const router = express.Router();
//jwt
const jwt = require("jsonwebtoken");
const {authenticateToken} = require("../utilities");
//Models
const User = require("../models/user.model");
const Week = require("../models/week.model");
const RequestLog = require("../models/requestLog.model");
const ServiceCenter = require("../models/serviceCenter.model");
const Request = require("../models/request.model");
const Planning = require("../models/planning.model");
// router.get/post

function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate; //newDate.toLocaleString()
}

router.post('/', authenticateToken, async (req, res) => {
    // 2025-01-02
    const {startDate, numUsers, weeks, serviceCenter} = req.body; // Start weeks must be a multiple of users
    if(!startDate || !numUsers || !weeks) return res.status(400).json({message: "Planning information is missing"});
    if(weeks % numUsers !== 0) return res.status(400).json({message: "Weeks must be a multiple of users"});
    try {
        let changing = new Date(startDate);
        //create planning
        const planning = new Planning({
            serviceCenter,
            startDate,
            endDate: addDays(changing, weeks*7),
        });
        //array with picked users by worked days depending on service center. Excludes Admins
        const pickedUsers = await User.find({$and:[{serviceCenter}, {isAdmin : false}]}).sort({workedDays:"asc"}).limit(numUsers); 

        let cycles = 0;        

        //creates looping calendar 
        while (cycles < weeks/numUsers){
            for (const user of pickedUsers) {
                const newWeek = new Week({
                    thursday : {date: changing, user},
                    friday : {date: addDays(changing, 1), user},
                    saturday : {date: addDays(changing, 2), user},
                    sunday : {date: addDays(changing, 3), user},
                    monday : { date:  addDays(changing, 4), user},
                    tuesday : {date: addDays(changing, 5), user},
                    wednesday : {date: addDays(changing, 6), user},
                });
                await newWeek.save();
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
                
                changing = addDays(changing, 7);
            }
            
            cycles++;
        }
        //save planning in the service center
        const sc = await ServiceCenter.findOne({name: serviceCenter});
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

//change shifts
router.put("/switch-shifts", authenticateToken, async(req, res) => {
    const {days, absentee, replacement} = req.body;

    if(!days || !absentee || !replacement) return res.status(400).json({error: true, message:"Missing information"}) 
    
});

module.exports = router;


// req.body => "days" : ["2025-01-01"]
// Date.toLocaleString()  =>  "20/12/2012, 03:00:00"

// + GET    /user/:userId                          Avoir les semaines de travail par user --
// + GET    /zone/:name                            Recevoir l'horaire de la zone (par semaines) --
// PUT       /switch-shifts                         Change dans les weeks la personne qui va travailler un/des date(s)
// + POST   /                     admin     Créer calendrier avec X users aléatoires