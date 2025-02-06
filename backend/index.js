require("dotenv").config();

//MongoDB connection
const mongoose = require("mongoose");  
mongoose.connect(process.env.MONGO_ATLAS_STRING);

//Models
const User = require("./models/user.model");
const Shift = require("./models/week.model");
const RequestLog = require("./models/requestLog.model");
const Zone = require("./models/zone.model");
const Request = require("./models/request.model");
const Month = require("./models/planning.model");

//Express 
const express = require("express");
const app = express();

//cors
const cors = require("cors");
app.use(cors({ origin: true, credentials: true }));

//Body parser
app.use(express.json());

//JWT  
const jwt = require("jsonwebtoken");
const {authenticateToken} = require("./utilities");

app.get("/", (req, res) => {
    res.send("Hello World");
});

// --------------------------------- AUTHENTICATION  ROUTES ---------------------------------

// Create Account --- modifier
app.post("/register", async (req, res) => {
    const {firstName, lastName, phone, zone, password} = req.body;
    //Fields validation
    if(!firstName || !lastName || !lastName || !phone || !zone || !password){
        return res.status(400).json({message: "User information is missing"});
    }
    // Check if already registered
    const isUser = await User.findOne({phone: phone});
    if(isUser){
        return res.status(400).json({message: "User already exists"});
    }
    // Create User
    const user = new User({
        firstName,
        lastName,
        phone,
        zone,
        password
    });
    user.abreveation = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase() + lastName.charAt(1).toUpperCase();
    const accessToken = jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "10h"});
    user.token = accessToken;
    await user.save();
    res.status(201).json({error:false, message: "User created successfully", user});
    

});

//Login ---- modifier
app.post("/login", async (req, res) => {
    const {password, firstName} = req.body;
    //handle missing info
    if(!firstName || !password){
        const missingField = !firstName ? "First Name" : "password";
        return res.status(400).json({message: `${missingField} is required`});
    }
    //search the user
    const userInfo = await User.findOne({firstName: firstName});
    if(!userInfo){ //user not found
        return res.status(400).json({message: "User not found"});
    }
    if(userInfo.password !== password){ //wrong passw   ord
        return res.status(400).json({message: "Wrong password"});
    } 
    if(userInfo.firstName !== firstName){ //wrong phone
        return res.status(400).json({message: "Wrong phone"});
    }
    const user = {user: userInfo}; 
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "10h"});
    return res.json({error: false, message: "User logged in successfully", user, accessToken});
});

// --------------------------------- USER ROUTES ---------------------------------

//Get User Info : Profile --- modifier
app.get("/self-info", authenticateToken, async (req, res) => {
    const {user} = req.user;



    const isUser = await User.findOne({phone: user.phone});
    if(!isUser){
        return res.status(400).json({message: "User not found"});
    }
    return res.json({error: false, user: isUser, "_id":isUser._id ,message: "User found"});
})


//--------------------------------- SWITCH REQUEST ROUTES ----------------------------------------

// create request  ---  modifier
app.post("/create-request", authenticateToken, async (req, res) => {
    const {zone, targetUserPhone, isUrgent, startDate, endDate, userPhone} = req.body;
    if(!zone || !startDate || !endDate || !userPhone){
        return res.status(400).json({message: "Request information is missing"});
    }
    try {
        const userInfo = await User.findOne({phone: userPhone});
        if(!userInfo){
            return res.status(400).json({message: "User not found"});
        }
        const targetUserInfo = await User.findOne({phone: targetUserPhone});
        if(!targetUserInfo){
            return res.status(400).json({message: "Target User not found"});
        }
        const request = new Request({
            userPhone,
            zone,
            isUrgent: isUrgent?true:false,
            startDate,
            endDate,
        });
        await request.save();
        return res.json({error: false, message: "Request created successfully", request: { user:userInfo, targetUser: targetUserInfo, zone, startDate, endDate, isUrgent, userShifts: userInfo.shifts}});  
    } catch (error) {
        return res.status(400).json({error: true, message: "Error creating request", error});
    } 
});

// accept request --- modifier
app.put("/accept-request/:requestId", authenticateToken, async (req, res) => {
    /* const {requestId} = req.params;
    const {accept} = req.body;
    if(!requestId){
        return res.status(400).json({message: "Request ID is missing"});
    }
    if(accept === undefined){
        return res.status(400).json({message: "Accept field is missing"});
    }
    try {
        const request = await Request.findOne({_id: requestId});
        if(request.pending === false){
            return res.status(400).json({message: "Request already accepted"});
        }
        if(!request){
            return res.status(400).json({message: "Request not found"});
        }
        if(accept){
            request.pending = false;
            await request.save();
            request.user
            return res.json({error: false, message: "Request declined successfully", request});
        }
        return res.json({error: false, message: "Request accepted successfully", request});
    } catch (error) {
        return res.status(400).json({error: true, message: "Error accepting request", error});
    } */
});

//POST      /register                                |   Créer un compte -- 
//POST      /login                                   |   Se connecter --
//GET       /self-info                               |   Avoir ses infos à soi --
//POST      /request                                 |   Créer une requête de switch 
//PUT       /request/:requestID                      |   Accepter une requête de switch
//PUT       /decline-request                         |   Envoyer une notification à l'user si la requête est refusé, efface la requete des notifications du target
//DELETE    /delete-request                          |   Efface la requete par l'user ou accepté/refusé par l'admin
//GET       /user/:id                                |   Avoir les info sur le user avec l'id, envoyer les requêtes --
//GET       /request/:requestID                      |   Avoir les info sur la requete (notifications/page admin) --
//GET       /requests-by-user/:userID                |   avoir les requêtes par user (multiple notifications)
//GET       /schedule-user/:userId                   |   Avoir les semaines de travail par user   
//GET       /schedule-zone/:zoneID                   |   recevoir l'horaire de la zone (par semaines)
//PUT       /switch-shifts                           |   change dans les weeks la personne qui va travailler un/des jour(s)
//GET       /admin/get-all-requests            admin |   Recevoir l'historique des requêtes
//POST      /admin/create-calendar             admin |   créer calendrier avec X users aléatoires
//GET       /admin/get-all-users               admin |   admin page; liste des users avec des info/statistiques (à voir)

app.listen(8000, () => {
    console.log("Server is running on port 8000");
});
