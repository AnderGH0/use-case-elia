//express rotuer
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
//jwt
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../utilities");
//Models
const User = require("../models/user.model");
const Week = require("../models/week.model");
const RequestLog = require("../models/requestLog.model");
const ServiceCenter = require("../models/serviceCenter.model");
const Request = require("../models/request.model");
const Planning = require("../models/planning.model");
const planningService = require("../services/planningService");

/// REASONS TO SWITCH, if REFUSED => Global

// Create a Request
router.post("/", authenticateToken, async (req, res) => {
  const { serviceCenter, userPhone, targetPhone, days, planningId, weekId, isUrgent } = req.body;

  // Vérifier si toutes les données obligatoires sont présentes
  if (!serviceCenter || !userPhone || !days || !planningId || !weekId) {
    return res.status(400).json({ error: true, message: "Request information is missing" });
  }

  try {
    // Vérifier si l'utilisateur qui fait la demande existe
    const user = await User.findOne({ phone: userPhone });
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    // Créer la demande (Request) en incluant userPhone
    const newRequest = new Request({
      serviceCenter,
      userPhone,           // Ajouté ici pour satisfaire la validation
      userFrom: user._id,  // On associe l'ID de l'utilisateur trouvé
      targetPhone,
      days,
      planningId,
      weekId,
      isUrgent: isUrgent || false,
    });
    await newRequest.save();

    // Ajouter la demande à la liste des demandes de l'utilisateur initiateur
    user.requests.push(newRequest._id);
    await user.save();

    let targetUser = null;
    if (targetPhone) {
      // Recherche de l'utilisateur cible par son numéro de téléphone
      targetUser = await User.findOne({ phone: targetPhone });
      if (!targetUser) {
        return res.status(404).json({ error: true, message: "Target not found" });
      }
      // Ajouter la demande à la liste des demandes de l'utilisateur cible
      targetUser.requests.push(newRequest._id);
      await targetUser.save();
    } else {
      // Si la demande est globale, l'envoyer à tous les utilisateurs du service center
      const scUsers = await User.find({ serviceCenter });
      await Promise.all(scUsers.map(async (usr) => {
        usr.requests.push(newRequest._id);
        await usr.save();
      }));
    }

    // Créer un log de la demande (RequestLog)
    const log = new RequestLog({
      id: newRequest._id,
      absentee: user._id,
      replacement: targetUser ? targetUser._id : null, // replacement sera un ObjectId ou null
      days,
      isUrgent: newRequest.isUrgent,
      pending: true,
      declined: false,
    });
    await log.save();

    // Réponse en fonction du type de demande
    if (targetUser) {
      return res.json({
        error: false,
        message: `Request created successfully and sent to ${targetUser.firstName} ${targetUser.lastName}`,
        request: newRequest,
      });
    } else {
      return res.json({
        error: false,
        message: "Request sent to every user in your Service Center",
        request: newRequest,
      });
    }
  } catch (error) {
    console.error("Error creating request:", error);
    return res.status(500).json({
      error: true,
      message: "Error creating request",
      details: error.message,
    });
  }
});
// Get all requests admin
router.get("/all", authenticateToken, async (req, res) => {
  try {
    //gets all the requests
    const requests = await RequestLog.find();
    return res.json({
      error: false,
      message: "Here all are the requests in the logs",
      requests,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ error: true, message: "Error getting requests", error });
  }
});

// Get requests by user
router.get("/by-user/:userID", authenticateToken, async (req, res) => {
  const { userID } = req.params;
  try {
    const isUser = await User.findById(userID);
    //verify if user exists
    if (!isUser)
      return res.status(404).json({ error: true, message: "User not found" });
    //gets all the requests for the user
    const requests = await Request.find({ userPhone: isUser.phone });
    return res.json({
      error: false,
      message: "Here are the requests",
      requests,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ error: true, message: "Error getting requests", error });
  }
});

// DELETE /:requestId - Efface la requete
router.delete("/:requestId", authenticateToken, async (req, res) => {
  try {
    const { user } = req.user;
    // Vérifier que l'utilisateur est administrateur
    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ error: "Accès interdit : vous n'êtes pas administrateur." });
    }

    const { requestId } = req.params;

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "L'ID fourni n'est pas valide" });
    }

    // Recherche de la request dans la base de données
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request non trouvée" });
    }

    // Supprimer la request
    await Request.deleteOne({ _id: requestId });
    res.json({ message: "Request supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la request :", error);
    res.status(500).json({ error: error.message });
  }
});

// Get request by ID
router.get("/:requestID", authenticateToken, async (req, res) => {
  const { requestID } = req.params;
  try {
    const request = await Request.findById(requestID);
    //verify if request exists
    if (!request)
      return res
        .status(404)
        .json({ error: true, message: "Request not found" });
    return res.json({ error: false, message: "Here's the request", request });
  } catch (error) {
    return res
      .status(400)
      .json({ error: true, message: "Error getting request", error });
  }
});

// Endpoint PATCH pour accepter une request
router.patch("/:requestId/accept", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    // Vérifier que l'ID fourni est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "L'ID fourni n'est pas valide" });
    }

    // Recherche de la request dans la base de données
    const requestDoc = await Request.findById(requestId);
    if (!requestDoc) {
      return res.status(404).json({ error: "Request non trouvée" });
    }

    // Vérifier que la request est toujours en attente
    if (!requestDoc.pending) {
      return res
        .status(400)
        .json({ error: "Cette request a déjà été répondue." });
    }


    // Appel à la fonction de switch du planning.
    // On suppose que requestDoc contient les propriétés nécessaires :
    // planningId, weekId, day et userFrom
    const switchResult = await planningService.switchShift({
      planningId: requestDoc.planningId,
      weekId: requestDoc.weekId,
      day: requestDoc.days,
      userFrom: requestDoc.userFrom, // L'utilisateur qui cède son shift
      userTo: requestDoc.targetPhone  // L'utilisateur qui accepte la demande
    });

    // Mettre à jour la request pour marquer qu'elle a été acceptée
    requestDoc.pending = false;
    requestDoc.picked = true;
    await requestDoc.save();

    res.json({ 
      message: "Request acceptée et shift switché avec succès.", 
      request: requestDoc,
      switchResult // informations éventuelles renvoyées par la fonction switchShift
    });
  } catch (error) {
    console.error("Erreur lors de l'acceptation de la request :", error);
    res.status(500).json({ error: error.message });
  }
});

// ajouter le fait de changer entre les deux id dans le Planning

// Endpoint PATCH pour refuser une request
router.patch("/:requestId/accept", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Vérifier que l'ID fourni est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "L'ID fourni n'est pas valide" });
    }

    // Recherche de la demande dans la base de données
    const requestDoc = await Request.findById(requestId);
    if (!requestDoc) {
      return res.status(404).json({ error: "Request non trouvée" });
    }

    // Vérifier que la demande est toujours en attente
    if (!requestDoc.pending) {
      return res.status(400).json({ error: "Cette request a déjà été répondue." });
    }

    // Rechercher l'utilisateur cible à partir de targetPhone
    const targetUser = await User.findOne({ phone: requestDoc.targetPhone });
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // Si "days" est un tableau, sélectionner le jour concerné.
    // Ici, on choisit le premier jour du tableau.
    const dayToSwitch = Array.isArray(requestDoc.days) ? requestDoc.days[0] : requestDoc.days;

    // Appel à la fonction de switch du planning.
    // On suppose que la fonction switchShift attend :
    // planningId, weekId, day (un jour précis), userFrom (celui qui cède son shift) et userTo (celui qui accepte)
    const switchResult = await planningService.switchShift({
      planningId: requestDoc.planningId,
      weekId: requestDoc.weekId,
      day: dayToSwitch,
      userFrom: requestDoc.userFrom,
      userTo: targetUser._id
    });

    // Mettre à jour la demande pour marquer qu'elle a été acceptée
    requestDoc.pending = false;
    requestDoc.picked = true;
    await requestDoc.save();

    res.json({
      message: "Request acceptée et shift switché avec succès.",
      request: requestDoc,
      switchResult // Informations renvoyées par la fonction switchShift
    });
  } catch (error) {
    console.error("Erreur lors de l'acceptation de la request :", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// req.body => "days" : ["2025-01-01"]
// Date.toLocaleString()  => "20/12/2012, 03:00:00"

// + POST       /                          Créer une requête de switch
// +- PUT       /:requestID                Accepter /Refuser une requête de switch

// + GET        /:requestID                Avoir les info sur la requete (notifications/page admin) --
// + GET        /by-user/:userID           Avoir les requêtes par user (multiple notifications) --
// + GET        /all               admin   Recevoir l'historique des requêtes --
