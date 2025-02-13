// Express router
const express = require("express");
const router = express.Router();
// jwt (si besoin d'authentification)
const { authenticateToken } = require("../utilities");
//controllers
const { allUsers, userByID } = require("../controllers/user.controller");

// Route pour récupérer toutes les informations des utilisateurs
router.get("/all/", authenticateToken, allUsers);

// Route pour récupérer les informations d'un utilisateur par son ID
router.get("/:id", authenticateToken, userByID);


module.exports = router;
