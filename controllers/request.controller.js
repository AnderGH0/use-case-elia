
const User = require("../models/user.model");
const RequestLog = require("../models/requestLog.model");
const Request = require("../models/request.model");
const { request } = require("express");

const createRequest = async (req, res) => {
    const {serviceCenter, userPhone, targetPhone, days, isUrgent, reason} = req.body;

    try {
        next();

        const isUser = await User.findOne({phone:userPhone})
        
        //create the request
        const request = new Request({
                serviceCenter,
                userPhone,
                days,
                isUrgent,
                targetPhone : targetPhone ? targetPhone : null,
                isGlobal : targetPhone ? false : true,
                reason
            })
        await request.save();    

        //saves the request for the user
        isUser.requests.push(request);
        await isUser.save();

        // saves the request in the logs
        const log = new RequestLog({
            id: request._id,
            absentee: isUser,
            days,
            isUrgent,
            pending: true,
            declined: false,
            reason
        });
        await log.save();

        if(targetPhone){ // if the request isn't global
            const isTarget = await User.findOne({phone: targetPhone});
            //saves the request for the target user
            isTarget.requests.push(request);
            await isTarget.save();
            //saves the request for the user
            isUser.requests.push(request);
            await isUser.save();

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
        return res.status(400).json({error: true, message: error.message});
    } 
};

const deleteRequest = async (req, res) => {
    const requestID = req.params.id
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
        return res.status(400).json({error: true, message:error.message})
    }
}

const getAllRequests = async (req, res) => {
    try {
        //gets all the requests
        const requests = await RequestLog.find();
        return res.json({error:false, message: "Here all are the requests in the logs", requests})
    } catch (error) {
        return res.status(400).json({error: true, message: error.message})
    }
}

const requestByUser = async (req, res) => {
    const {userID} = req.params;
    try {
        const isUser = await User.findById(userID);
        //verify if user exists
        if(!isUser) return res.status(404).json({error:true, message:"User not found"});
        //gets all the requests for the user
        const requests = await Request.find({userPhone: isUser.phone})
        return res.json({error:false, message:"Here are the requests", requests})
    } catch (error) {
        return res.status(400).json({error: true, message:error.message})
    }
}

const requestByID = async (req, res) => {
    const {requestID} = req.params;
    try {
        const request = await Request.findById(requestID);
        //verify if request exists
        if(!request) return res.status(404).json({error: true, message:"Request not found"});
        return res.json({error:false, message:"Here's the request", request})
    } catch (error) {
        return res.status(400).json({error: true, message: error.message})
    }
}

module.exports = {
    createRequest,
    deleteRequest,
    getAllRequests,
    requestByUser,
    requestByID
};