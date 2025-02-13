//express rotuer
const express = require("express");
const router = express.Router();

//controllers
const {registerFieldsValidator, loginFieldsValidator} = require("../controllers/verification");
const {registerController, loginController} = require("../controllers/auth.controller");
const { findRegisterDocuments, findLoginDocuments } = require("../controllers/findInDatabase");

// register
router.post("/register", registerFieldsValidator, registerController, findRegisterDocuments);

// login
router.post("/login", loginFieldsValidator, loginController, findLoginDocuments);

module.exports = router;

//POST      /register                                |   Créer un compte ---
//POST      /login                                   |   Se connecter ---