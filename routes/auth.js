//express rotuer
const express = require("express");
const router = express.Router();

//controllers
const {registerFieldsValidator, loginFieldsValidator} = require("../controllers/verification");
const {registerController, loginController} = require("../controllers/auth.controller");

// register
router.post("/register", registerFieldsValidator, registerController);

// login
router.post("/login", loginFieldsValidator, loginController);


module.exports = router;
