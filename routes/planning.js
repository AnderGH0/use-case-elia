//express rotuer
const express = require("express");
const router = express.Router();
//jwt
const {authenticateToken} = require("../utilities");
//controllers
const { planningCreation, daysByUser, planningByServiceCenter, deletePlanning, switchShifts } = require("../controllers/planning.controller");
const { planningCreationValidator } = require("../controllers/verification");


//create a planning, with X number users and Y number of weeks.
router.post('/', authenticateToken, planningCreationValidator, planningCreation);

// get weeks by user
router.get("/user/:userID", authenticateToken, daysByUser);

//get planning by serviceCenter, case sensitive
router.get("/sc/:name", authenticateToken, planningByServiceCenter);

//delete planning, delete shift from users, delete weeks from collection
router.delete("/:id", authenticateToken, deletePlanning);

//Switches shifts between two users
router.put("/switch-shifts/:requestID", authenticateToken, switchShifts);



module.exports = router;

// req.body => "days" : ["2025-01-01"]