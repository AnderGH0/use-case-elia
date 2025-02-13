// Modèles
const User = require("../models/user.model");

const allUsers = async (req, res) => {
    try {
      const {user} = req.user
      // On vérifie que l'utilisateur authentifié est bien administrateur.
      // On suppose ici que le middleware 'authenticateToken' ajoute un objet 'user'
      // dans la requête avec une propriété 'isAdmin'.
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
  }

const userByID = async (req, res) => {
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
  }
module.exports = {
    allUsers,
    userByID
};