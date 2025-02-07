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

router.post("/", authenticateToken, async (req, res) => {
    const {serviceCenter, userPhone, targetPhone, days, isUrgent} = req.body;
    console.log(req.user)
    if(!serviceCenter || !userPhone || !days){
        return res.status(400).json({message: "Request information is missing"});
    }
    try {
        //verify if user exists
        const isUser = await User.findOne({phone:userPhone})
        if(!isUser) return res.status(404).json({error:true, message:"User not found"})
        if(targetPhone){ // if the request isn't global
            // search target user
            const isTarget = await User.findOne({phone: targetPhone});
            if(!isTarget) return res.status(404).json({error: true, message:"Target not found"});
            // create request
            const request = new Request({
                serviceCenter,
                userPhone,
                targetPhone,
                days,
                isUrgent
            })
            //saves the request 
            await request.save();
            isTarget.requests.push(request)
            await isTarget.save();
            isUser.requests.push(request)
            await isUser.save();
            
            return res.json({error:false, 
                message:`Request created successfully and send to ${isTarget.firstName} ${isTarget.lastName}`, 
                request})
        }
        //request is global
        else {
            const request = new Request({
                serviceCenter,
                userPhone,
                days,
                isUrgent,
                isGlobal: true
            })
            isUser.requests.push(request);
            await isUser.save();
            //global: send request to every user in the service center
            const scUsers = await User.find({serviceCenter});
            scUsers.forEach(async (user) =>  {
                user.requests.push(request);
                await user.save();
            })
            await request.save();
            return res.json({error:false, message:"Request send to every user in your Service Center", request})
        }
    } catch (error) {
        return res.status(400).json({error: true, message: "Error creating request", error});
    } 
});

// req.body => "days" : ["2025-01-01"]
// Date.toLocaleString()  => "20/12/2012, 03:00:00"

router.get("/bla", authenticateToken, async (req, res) => {
    //const {requestID} = req.params.id
    try {
        
        /* const isRequest = await Request.findById(requestID);
        if(!isRequest) return res.status(404).json({error: true, message:"Request not found"});
        await isRequest.deleteOne(_id:) */
    } catch (error) {
        return res.status(400).json({error: true, message:"Error retrieving the request information", error})
    }
})

module.exports = router;

// + POST      /                          Créer une requête de switch 
// PUT       /:requestID                Accepter /Refuser une requête de switch
// DELETE    /:requestId                Efface la requete
// GET       /:requestID                Avoir les info sur la requete (notifications/page admin) --
// GET       /by-user/:userID           Avoir les requêtes par user (multiple notifications) --
// GET       /all               admin   Recevoir l'historique des requêtes -- 