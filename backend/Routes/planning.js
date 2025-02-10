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
    const {startDate, numUsers, weeks} = req.body; // Start weeks must be a multiple of users
    if(!startDate || !numUsers || !weeks) return res.status(400).json({message: "Planning information is missing"});
    if(weeks % numUsers !== 0) return res.status(400).json({message: "Weeks must be a multiple of users"});
    try {
        //create planning
        const planning = new Planning({
            startDate,
            endDate: addDays(startDate, weeks*7),
        });
        const start = new Date(startDate);
        //array with picked users by worked days
        const pickedUsers = await User.find().sort({workedDays:"asc"}).limit(numUsers); 
        let cycles = 0;
        let changing = start;
        while (cycles <= weeks/numUsers){
            pickedUsers.forEach(async (user) => {
                const newWeek = new Week({
                    startDate: changing,
                    monday : user,
                    tuesday : user,
                    wednesday : user,
                    thursday : user,
                    friday : user,
                    saturday : user,
                    sunday : user,
                });
                await newWeek.save();
                planning.weeks.push(newWeek);
                changing = addDays(changing, 7);
            });
            cycles++;
        }
        await planning.save();
        return res.json({error: false, message: "Planning created successfully", planning});
    } catch (error) {
        return res.status(500).json({error: true, message: error.message});
    }
});

module.exports = router;


// req.body => "days" : ["2025-01-01"]
// Date.toLocaleString()  =>  "20/12/2012, 03:00:00"

// GET       /user/:userId                          Avoir les semaines de travail par user --
// GET       /zone/:name                            Recevoir l'horaire de la zone (par semaines) --
// PUT       /switch-shifts                         Change dans les weeks la personne qui va travailler un/des jour(s)
// POST      /                     admin     Créer calendrier avec X users aléatoires