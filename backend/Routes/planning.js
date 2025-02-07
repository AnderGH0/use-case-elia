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


module.exports = router;


// req.body => "days" : ["2025-01-01"]
// Date.toLocaleString()  =>  "20/12/2012, 03:00:00"

// GET       /user/:userId                          Avoir les semaines de travail par user --
// GET       /zone/:name                            Recevoir l'horaire de la zone (par semaines) --
// PUT       /switch-shifts                         Change dans les weeks la personne qui va travailler un/des jour(s)
// POST      /create                      admin     Créer calendrier avec X users aléatoires