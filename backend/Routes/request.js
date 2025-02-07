//express rotuer
const express = require("express");
const router = express.Router();
//jwt
const jwt = require("jsonwebtoken");
const {authenticateToken} = require("../utilities");
//Models
const User = require("../models/user.model");
const Shift = require("../models/week.model");
const RequestLog = require("../models/requestLog.model");
const ServiceCenter = require("../models/serviceCenter.model");
const Request = require("../models/request.model");
const Month = require("../models/planning.model");


// router.get/post
/* 
    app.post("/", authenticateToken, async (req, res) => {
    const {zone, targetUserPhone, isUrgent, startDate, endDate, userPhone} = req.body;
    if(!zone || !startDate || !endDate || !userPhone){
        return res.status(400).json({message: "Request information is missing"});
    }
    try {

    } catch (error) {
        return res.status(400).json({error: true, message: "Error creating request", error});
    } 
});


*/

module.exports = router;

// POST      /                          Créer une requête de switch 
// PUT       /:requestID         Accepter une requête de switch
// DELETE    /:requestId         Efface la requete par l'user ou accepté/refusé par l'admin
// GET       /:requestID                Avoir les info sur la requete (notifications/page admin) --
// GET       /by-user/:userID           Avoir les requêtes par user (multiple notifications) --
// GET       /all               admin   Recevoir l'historique des requêtes -- 