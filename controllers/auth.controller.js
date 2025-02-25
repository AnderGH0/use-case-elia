//jwt
const jwt = require("jsonwebtoken");
//Models
const User = require("../models/user.model");
const ServiceCenter = require("../models/serviceCenter.model");

const registerController = async (req, res, next) => {
    const {firstName, lastName, phone, serviceCenter, password, isAdmin} = req.body;
    
    try {
        // Check if already registered
        const isUser = await User.findOne({phone});
        if(isUser)  return res.status(400).json({message: "User already exists"});
    
        const sc = await ServiceCenter.findOne({name: serviceCenter});
        if(!sc) return res.status(404).json({message: "Service Center does not exist"});

        // Create User
        const user = new User({
            firstName,
            lastName,
            phone,
            serviceCenter,
            password,
            isAdmin: isAdmin? isAdmin : false
        });

        // give an abbreviation
        user.abreveation = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase() + lastName.charAt(1).toUpperCase();

        //give token
        const accessToken = jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "999h"});
        user.token = accessToken;
        await user.save();

        // add user to service center
        sc.users.push(user);
        await sc.save();

        return res.status(201).json({error:false, message: "User created successfully", user: {firstName, lastName, phone, serviceCenter}, accessToken});
    } catch (error) {
        return res.status(400).json({error: true, message: error.message});
    }

};

const loginController = async (req, res, next) => {
    const {phone, password} = req.body;

    try {
        //user verification
            const userInfo = await User.findOne({phone});
            if(!userInfo){ //user not found
                return res.status(404).json({message: "User not found"});
            }
            if(userInfo.password !== password){ //wrong password
                return res.status(400).json({message: "Wrong password"});
            } 
            if(userInfo.phone.toString() !== phone){ //wrong phone
                return res.status(400).json({message: "Wrong phone"});
            }

        //const userInfo = await User.findOne({phone});

        const user = {user: userInfo}; 

        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "10h"});

        return res.json({error: false, message: "User logged in successfully", user, accessToken});
    } catch (error) {
        return res.status(400).json({error: true, message: error.message});
    }
};

module.exports = {
    registerController,
    loginController
}