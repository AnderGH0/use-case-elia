//express rotuer
const express = require("express");
const router = express.Router();
//jwt
const {authenticateToken} = require("../utilities");
//controllers
const { createRequest, deleteRequest, getAllRequests, requestByUser, requestByID } = require("../controllers/request.controller");
const { requestCreationValidator } = require("../controllers/verification");

// Create a Request
router.post("/", authenticateToken, requestCreationValidator, createRequest);

// Delete request
router.delete("/:id", authenticateToken, deleteRequest);

// Get all requests admin
router.get("/all", authenticateToken, getAllRequests);

// Get requests by user
router.get("/by-user/:userID", authenticateToken, requestByUser);

// Get request by ID
router.get("/:requestID", authenticateToken, requestByID);


module.exports = router;


// req.body => "days" : ["2025-01-01"]
// Date.toLocaleString()  => "20/12/2012, 03:00:00"

// + POST       /                          Créer une requête de switch 
// +- PUT       /:requestID                Accepter /Refuser une requête de switch
// + DELETE     /:requestId                Efface la requete
// + GET        /:requestID                Avoir les info sur la requete (notifications/page admin) --
// + GET        /by-user/:userID           Avoir les requêtes par user (multiple notifications) --
// + GET        /all               admin   Recevoir l'historique des requêtes --