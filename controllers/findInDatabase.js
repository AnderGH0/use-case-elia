const {addDays} = require("./planning.controller");

const User = require("../models/user.model");
const ServiceCenter = require("../models/serviceCenter.model");
const Planning = require("../models/planning.model");
const Request = require("../models/request.model");

const findRegisterDocuments = async (req, res) => {
    const {phone, serviceCenter} = req.body;

    const isUser = await User.findOne({phone});
    if(isUser)  return res.status(400).json({message: "User already exists"});

    const sc = await ServiceCenter.findOne({name: serviceCenter});
    if(!sc) return res.status(404).json({message: "Service Center does not exist"});
};

const findLoginDocuments = async (req, res) => {
    const userInfo = await User.findOne({phone});
    if(!userInfo){ //user not found
        return res.status(404).json({message: "User not found"});
    }
    if(userInfo.password !== password){ //wrong password
        return res.status(400).json({message: "Wrong password"});
    } 
    if(userInfo.phone !== phone){ //wrong phone
        return res.status(400).json({message: "Wrong phone"});
    }
};

const findPlanningCreationDocuments = async (req, res) => {
    const {startDate, numUsers,  serviceCenter} = req.body; // Start weeks must be a multiple of users
    const sc = await ServiceCenter.findOne({name: serviceCenter});
    if(!sc) return res.status(404).json({error: true, message: "Service center not found"});

    // verify if the new planning overlaps with another planning
    const existingPlanning = await Planning.findOne({serviceCenter});
    const isOverlapping = existingPlanning && (
        (startDate >= existingPlanning.startDate && startDate <= existingPlanning.endDate) 
        || (addDays(changing, weeks*7) >= existingPlanning.startDate && addDays(changing, weeks*7) <= existingPlanning.endDate));
    if(isOverlapping) return res.status(400).json({error: true, message: "Planning overlaps with another planning"});

    //FIX ME verify users are no tpicked if the latest date in the shift is greater than the start date
    const pickedUsers = await User.find({$and:[{serviceCenter}, {isAdmin : false}, {shifts: []}]}).sort({workedDays:"asc"}).limit(numUsers); 
    if(pickedUsers.length < numUsers) return res.status(400).json({error: true, message: "Not enough users in the service center"});
};

const planningDeletionDocuments = async (req, res) => {
    const {id} = req.params;

    const planning = await Planning.findById(id).populate("weeks");
    if(!planning) return res.status(404).json({error: true, message:"Planning not found"});

    const users = await User.find({serviceCenter: planning.serviceCenter});
    if(!users) return res.status(404).json({error: true, message:"Users not found"});

    const sc = await ServiceCenter.findOne({name: planning.serviceCenter});
    if(!sc) return res.status(404).json({error: true, message:"Service center not found"});

};

const findSwitchDocuments = async (req, res) => {
    const {requestID} = req.params;  

    const isRequest = await Request.findById(requestID);
    //verify if request exists
    if(!isRequest) return res.status(404).json({error: true, message:"Request not found"});
    //verify if request is pending
    if(isRequest.pending === false) return res.status(400).json({error: true, message:"Request already accepted or refused"});

    const absentee = await User.findOne({phone: isRequest.userPhone});
    if(!absentee) return res.status(404).json({error: true, message:"Absentee user not found"});

    const target = await User.findOne({phone: isRequest.targetPhone});
    if(!target) return res.status(404).json({error: true, message:"Target user not found"});
};

const findRequestCreationDocuments = async (req, res) => {
    const {serviceCenter, userPhone, targetPhone, days, isUrgent, reason} = req.body;

    const isUser = await User.findOne({phone:userPhone});
    if(!isUser) return res.status(404).json({error:true, message:"User not found"});

    if(targetPhone){
        const isTarget = await User.findOne({phone: targetPhone});
        if(!isTarget) return res.status(404).json({error: true, message:"Target not found"});
    }

};

module.exports = {
    findRegisterDocuments,
    findLoginDocuments,
    findPlanningCreationDocuments,
    planningDeletionDocuments,
    findSwitchDocuments,
    findRequestCreationDocuments
};