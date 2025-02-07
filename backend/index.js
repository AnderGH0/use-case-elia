require("dotenv").config();

//MongoDB connection
const mongoose = require("mongoose");  
mongoose.connect(process.env.MONGO_ATLAS_STRING);

//Models
const User = require("./models/user.model");
const Shift = require("./models/week.model");
const RequestLog = require("./models/requestLog.model");
const ServiceCenter = require("./models/serviceCenter.model");
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
    if(!firstName || !lastName || !phone || !zone || !password){
        return res.status(400).json({message: "User information is missing"});
    }
    try {
        // Check if already registered
        const isUser = await User.findOne({phone});
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
        // give an abbreviation
        user.abreveation = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase() + lastName.charAt(1).toUpperCase();
        //give token
        const accessToken = jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "10h"});
        user.token = accessToken;
        await user.save();

        return res.status(201).json({error:false, message: "User created successfully", user});
    } catch (error) {
        return res.status(400).json({error: true, message: "Error creating user", error});
    }

});

//Login ---- modifier
app.post("/login", async (req, res) => {
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
            return res.status(400).json({message: "User not found"});
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

// // --------------------------------- USER ROUTES ---------------------------------

// //Get User Info : Profile --- modifier
// app.get("/self-info", authenticateToken, async (req, res) => {
//     const {user} = req.user;



//     const isUser = await User.findOne({phone: user.phone});
//     if(!isUser){
//         return res.status(400).json({message: "User not found"});
//     }
//     return res.json({error: false, user: isUser, "_id":isUser._id ,message: "User found"});
// })


// //--------------------------------- REQUEST ROUTES ----------------------------------------

// create request  ---  modifier
app.post("/create-request", authenticateToken, async (req, res) => {
    const {zone, targetUserPhone, isUrgent, startDate, endDate, userPhone} = req.body;
    if(!zone || !startDate || !endDate || !userPhone){
        return res.status(400).json({message: "Request information is missing"});
    }
    try {

    } catch (error) {
        return res.status(400).json({error: true, message: "Error creating request", error});
    } 
});

// accept request --- modifier
// app.put("/accept-request/:requestId", authenticateToken, async (req, res) => {

// });

//POST      /register                                |   Créer un compte ---
//POST      /login                                   |   Se connecter ---
//GET       /self-info                               |   Avoir ses infos à soi --
//POST      /request                                 |   Créer une requête de switch 
//PUT       /request/:requestID                      |   Accepter une requête de switch
//PUT       /decline-request                         |   Envoyer une notification à l'user si la requête est refusé, efface la requete des notifications du target
//DELETE    /delete-request                          |   Efface la requete par l'user ou accepté/refusé par l'admin
//GET       /user/:id                                |   Avoir les info sur le user avec l'id, envoyer les requêtes --
//GET       /request/:requestID                      |   Avoir les info sur la requete (notifications/page admin) --
//GET       /requests-by-user/:userID                |   Avoir les requêtes par user (multiple notifications) -- 
//GET       /schedule-user/:userId                   |   Avoir les semaines de travail par user --
//GET       /schedule-zone/:zoneID                   |   Recevoir l'horaire de la zone (par semaines) --
//PUT       /switch-shifts                           |   Change dans les weeks la personne qui va travailler un/des jour(s)
//GET       /admin/get-all-requests            admin |   Recevoir l'historique des requêtes -- 
//POST      /admin/create-calendar             admin |   Créer calendrier avec X users aléatoires
//GET       /admin/get-all-users               admin |   Admin page; liste des users avec des info/statistiques (à voir) -- 

app.listen(8000, () => {
    console.log("Server is running on port 8000");
});
