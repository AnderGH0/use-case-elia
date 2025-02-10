// MongoDB connection
const mongoose = require("mongoose");  
mongoose.connect(process.env.MONGO_ATLAS_STRING);

// Express router
const express = require("express");
const router = express.Router();

// jwt (si besoin d'authentification)
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../utilities");

// Modèles
const User = require("../models/user.model");
const Shift = require("../models/week.model");
const RequestLog = require("../models/requestLog.model");
const ServiceCenter = require("../models/serviceCenter.model");
const Request = require("../models/request.model");
const Month = require("../models/planning.model");

// Route pour récupérer toutes les informations des utilisateurs
router.get("/all/", authenticateToken, async (req, res) => {

    try {

      const {user} = req.user
      // On vérifie que l'utilisateur authentifié est bien administrateur.
      // On suppose ici que le middleware 'authenticateToken' ajoute un objet 'user'
      // dans la requête avec une propriété 'isAdmin'.
      // console.log(agent.isAdmin)
      if (!user.isAdmin) {
        return res.status(403).json({ error: "Accès interdit : vous n'êtes pas administrateur." });
      }
     
      // Récupérer tous les utilisateurs de la base de données et, si besoin, peupler des champs (exemple: "requests")
      const users = await User.find({});
  
      // pour chaque utilisateur, retirer les informations sensibles (par exemple le mot de passe et le token)
      const sanitizedUsers = users.map(user => {
        const { password, token, ...userData } = user.toObject();
        return userData;
      });
  
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Erreur lors de la récupération des informations des utilisateurs :", error);
      res.status(500).json({ error: error.message });
    }
  });

// Route pour récupérer les informations d'un utilisateur par son ID
router.get("/:id", authenticateToken, async (req, res) => {

  try {
    // Récupérer l'ID de l'utilisateur depuis l'URL
    const userId = req.params.id;

    // Recherche de l'utilisateur dans la base de données en utilisant l'ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Exclure les informations sensibles, par exemple le mot de passe
    const { password, ...userData } = user.toObject();

    res.json(userData);
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de l'utilisateur :", error);
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;


// GET       /:id                Avoir les info sur le user avec l'id, envoyer les requêtes --
// GET       /all       admin    Admin page; liste des users avec des info/statistiques (à voir) --  