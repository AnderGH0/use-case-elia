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

/// REASONS TO SWITCH, if REFUSED => Global

// Create a Request
router.post("/", authenticateToken, async (req, res) => {
  const { serviceCenter, userPhone, targetPhone, days, isUrgent } = req.body;
  if (!serviceCenter || !userPhone || !days) {
    return res.status(400).json({ message: "Request information is missing" });
  }
  try {
    //verify if user exists
    const isUser = await User.findOne({ phone: userPhone });
    if (!isUser)
      return res.status(4).json({ error: true, message: "User not found" });

    //create the request
    const request = new Request({
      serviceCenter,
      userPhone,
      days,
      isUrgent,
      targetPhone: targetPhone ? targetPhone : null,
      isGlobal: targetPhone ? false : true,
    });
    await request.save();
    //saves the request for the user
    isUser.requests.push(request);
    await isUser.save();
    // saves the request in the logs
    const log = new RequestLog({
      id: request._id,
      absentee: isUser._id,
      replacement: targetPhone ? targetPhone : null,
      days,
      isUrgent,
      pending: true,
      declined: false,
    });
    if (targetPhone) {
      // if the request isn't global
      // search target user
      const isTarget = await User.findOne({ phone: targetPhone });
      if (!isTarget)
        return res
          .status(404)
          .json({ error: true, message: "Target not found" });
      //saves the request for the target user
      isTarget.requests.push(request);
      await isTarget.save();
      isUser.requests.push(request);
      await isUser.save();
      return res.json({
        error: false,
        message: `Request created successfully and send to ${isTarget.firstName} ${isTarget.lastName}`,
        request,
      });
    } else {
      //global: send request to every user in the service center

      const scUsers = await User.find({ serviceCenter });
      scUsers.forEach(async (user) => {
        user.requests.push(request);
        await user.save();
      });
      return res.json({
        error: false,
        message: "Request send to every user in your Service Center",
        request,
      });
    }
  } catch (error) {
    return res
      .status(400)
      .json({ error: true, message: "Error creating request", error });
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

    // Mettre à jour la request pour l'acceptation
    requestDoc.pending = false;
    requestDoc.picked = true;

    await requestDoc.save();

    res.json({ message: "Request acceptée avec succès.", request: requestDoc });
  } catch (error) {
    console.error("Erreur lors de l'acceptation de la request :", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint PATCH pour refuser une request
router.patch("/:requestId/reject", authenticateToken, async (req, res) => {
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

    // Mettre à jour la request pour le refus
    requestDoc.pending = false;
    // Ici, picked reste false
    await requestDoc.save();

    res.json({ message: "Request refusée avec succès.", request: requestDoc });
  } catch (error) {
    console.error("Erreur lors du refus de la request :", error);
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
