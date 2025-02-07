//express rotuer
const express = require("express");
const router = express.Router();
//jwt
const jwt = require("jsonwebtoken");
//Models
const User = require("../models/user.model");
const ServiceCenter = require("../models/serviceCenter.model");

// register
router.post("/register", async (req, res) => {
    const {firstName, lastName, phone, serviceCenter, password, isAdmin} = req.body;
    //Fields validation
    if(!firstName || !lastName || !phone || !serviceCenter || !password){
        return res.status(400).json({message: "User information is missing"});
    }
    try {
        // Check if already registered
        const isUser = await User.findOne({phone});
        if(isUser){
            return res.status(400).json({message: "User already exists"});
        }
        const sc = await ServiceCenter.findOne({name: serviceCenter});
        console.log(isUser)
        if(!sc){
            return res.status(404).json({message: "Service Center does not exist"});
        }
        // Create User
        const user = new User({
            firstName,
            lastName,
            phone,
            serviceCenter,
            password
        });
        // give an abbreviation
        user.abreveation = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase() + lastName.charAt(1).toUpperCase();
        //give token
        const accessToken = jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "10h"});
        user.token = accessToken;
        await user.save();
        // add user to service center
        sc.users.push(user);
        await sc.save();
        return res.status(201).json({error:false, message: "User created successfully", user});
    } catch (error) {
        return res.status(400).json({error: true, message: "Error creating user", error});
    }

});
// login
router.post("/login", async (req, res) => {
    const {password, phone} = req.body;
    //handle missing info
    if(!phone || !password){
        const missingField = !phone ? "phone" : "password";
        return res.status(400).json({message: `${missingField} is required`});
    }
    try {
        //search the user
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
        const user = {user: userInfo}; 
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "10h"});
        return res.json({error: false, message: "User logged in successfully", user, accessToken});
    } catch (error) {
        return res.status(400).json({error: true, message: "Error logging in", error});
    }
});

module.exports = router;

//POST      /register                                |   Créer un compte ---
//POST      /login                                   |   Se connecter ---