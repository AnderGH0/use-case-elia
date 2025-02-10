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

// Create a Request
router.post("/", authenticateToken, async (req, res) => {
    const {serviceCenter, userPhone, targetPhone, days, isUrgent} = req.body;
    if(!serviceCenter || !userPhone || !days){
        return res.status(400).json({message: "Request information is missing"});
    }
    try {
        //verify if user exists
        const isUser = await User.findOne({phone:userPhone})
        if(!isUser) return res.status(404).json({error:true, message:"User not found"})
        
        //create the request
        const request = new Request({
                serviceCenter,
                userPhone,
                days,
                isUrgent,
                targetPhone : targetPhone ? targetPhone : null,
                isGlobal : targetPhone ? false : true
            })
        await request.save();    
        //saves the request for the user
        isUser.requests.push(request);
        await isUser.save();
        // saves the request in the logs
        const log = new RequestLog({
            id: request._id,
            absentee: isUser._id,
            replacement: targetPhone ? targetPhone : null,
            days,
            isUrgent,
            pending: true,
            declined: false
        })
        if(targetPhone){ // if the request isn't global
            // search target user
            const isTarget = await User.findOne({phone: targetPhone});
            if(!isTarget) return res.status(404).json({error: true, message:"Target not found"});
            //saves the request for the target user
            isTarget.requests.push(request);
            await isTarget.save();
            isUser.requests.push(request);await isUser.save();
            return res.json({error:false, 
                message:`Request created successfully and send to ${isTarget.firstName} ${isTarget.lastName}`, 
                request})
        }
        else { //global: send request to every user in the service center
            
            const scUsers = await User.find({serviceCenter});
            scUsers.forEach(async (user) =>  {
                user.requests.push(request);
                await user.save();
            })
            return res.json({error:false, message:"Request send to every user in your Service Center", request})
        }
    } catch (error) {
        return res.status(400).json({error: true, message: "Error creating request", error});
    } 
});

// Get info about a Request
router.delete("/:id", authenticateToken, async (req, res) => {
    const {requestID} = req.params.id
    try {
        const isRequest = await Request.findById(requestID);
        if(!isRequest) return res.status(404).json({error: true, message:"Request not found"});
        // Remove the request from the users' requests array
        await User.updateMany(
            { requests: requestID },
            { $pull: { requests: requestID } }
        );
        await Request.deleteOne({_id: requestID});
        return res.json({error:false, message:"Request deleted successfully"})
    } catch (error) {
        return res.status(400).json({error: true, message:"Error deleting request", error})
    }
});

//--------- TESTER ces routes ------------
// Accepter / refuser une requête
router.put("/:id", authenticateToken, async (req, res) => {
    const {requestID} = req.params.id
    const {accepted} = req.body; // status = "accepted" or "refused" send notification to user, "ignored" (for global requests)
    try {
        const isRequest = await Request.findById(requestID);
        //verify if request exists
        if(!isRequest) return res.status(404).json({error: true, message:"Request not found"});
        //verify if request is pending
        if(isRequest.pending !== false) return res.status(400).json({error: true, message:"Request already accepted or refused"});
        isRequest.pending = accepted;
        await isRequest.save();

        //send notification to user, update calendar, update logs

        return res.json({error:false, message:"Request updated successfully", isRequest})
    } catch (error) {
        return res.status(400).json({error: true, message:"Error updating request status", error})
    }
});

// Get all requests admin
router.get("/all", authenticateToken, async (req, res) => {
    try {
        //gets all the requests
        const requests = await RequestLog.find();
        return res.json({error:false, message: "Here all are the requests in the logs", requests})
    } catch (error) {
        return res.status(400).json({error: true, message:"Error getting requests", error})
    }
});

// Get requests by user
router.get("/by-user/:userID", authenticateToken, async (req, res) => {
    const {userID} = req.params;
    try {
        const user = await User.findById(userID);
        //verify if user exists
        if(!user) return res.status(404).json({error:true, message:"User not found"});
        //gets all the requests for the user
        const requests = await Request.find({userPhone: user.phone});
        return res.json({error:false, message:"Here are the requests", requests})
    } catch (error) {
        return res.status(400).json({error: true, message:"Error getting requests", error})
    }
});

// Get request by ID
router.get("/:requestID", authenticateToken, async (req, res) => {
    const {requestID} = req.params;
    try {
        const request = await RequestLog.findById(requestID);
        //verify if request exists
        if(!request) return res.status(404).json({error:true, message:"Request not found"});
        return res.json({error:false, message:"Here's the request", request})
    } catch (error) {
        return res.status(400).json({error: true, message:"Error getting request", error})
    }
});


module.exports = router;


// req.body => "days" : ["2025-01-01"]
// Date.toLocaleString()  => "20/12/2012, 03:00:00"

// + POST       /                          Créer une requête de switch 
// +- PUT       /:requestID                Accepter /Refuser une requête de switch
// + DELETE     /:requestId                Efface la requete
// + GET        /:requestID                Avoir les info sur la requete (notifications/page admin) --
// + GET        /by-user/:userID           Avoir les requêtes par user (multiple notifications) --
// + GET        /all               admin   Recevoir l'historique des requêtes --