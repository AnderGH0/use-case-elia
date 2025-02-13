//express rotuer
const express = require("express");
const router = express.Router();
//jwt
const {authenticateToken} = require("../utilities");
//controllers
const { planningCreation, daysByUser, planningByServiceCenter, deletePlanning, switchShifts } = require("../controllers/planning.controller");
const { planningCreationValidator } = require("../controllers/verification");
const { findPlanningCreationDocuments, planningDeletionDocuments, findSwitchDocuments } = require("../controllers/findInDatabase");


//create a planning, with X number users and Y number of weeks.
router.post('/', authenticateToken, planningCreationValidator, planningCreation, findPlanningCreationDocuments);

// get weeks by user
router.get("/user/:userID", authenticateToken, daysByUser);

//get planning by serviceCenter, case sensitive
router.get("/sc/:name", authenticateToken, planningByServiceCenter);

//delete planning, delete shift from users, delete weeks from collection
router.delete("/:id", authenticateToken, deletePlanning, planningDeletionDocuments);

//Switches shifts between two users
router.put("/switch-shifts/:requestID", authenticateToken, switchShifts, findSwitchDocuments);



module.exports = router;


// req.body => "days" : ["2025-01-01"]
// Date.toLocaleString()  =>  "20/12/2012, 03:00:00"

// + GET    /user/:userId                          Avoir les semaines de travail par user --
// + GET    /zone/:name                            Recevoir l'horaire de la zone (par semaines) --
// PUT       /switch-shifts                         Change dans les weeks la personne qui va travailler un/des date(s)
// + POST   /                     admin     Créer calendrier avec X users aléatoires