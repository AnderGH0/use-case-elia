//express rotuer
const express = require("express");
const router = express.Router();
//jwt
const jwt = require("jsonwebtoken");
const {authenticateToken} = require("../utilities");
//Models
const User = require("./models/user.model");
const Shift = require("./models/week.model");
const RequestLog = require("./models/requestLog.model");
const ServiceCenter = require("./models/serviceCenter.model");
const Request = require("./models/request.model");
const Month = require("./models/planning.model");

// router.get/post


// //Get User Info : Profile --- modifier
app.get("/self-info", authenticateToken, async (req, res) => {
    const {user} = req.user;



    const isUser = await User.findOne({phone: user.phone});
    if(!isUser){
        return res.status(400).json({message: "User not found"});
    }
    return res.json({error: false, user: isUser, "_id":isUser._id ,message: "User found"});
})


module.exports = router;

// GET       /self-info          Avoir ses infos à soi --
// GET       /:id                Avoir les info sur le user avec l'id, envoyer les requêtes --
// GET       /all       admin    Admin page; liste des users avec des info/statistiques (à voir) --  