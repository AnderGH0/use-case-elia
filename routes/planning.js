// Imports et initialisation
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { authenticateToken } = require("../utilities");

// Modèles
const User = require("../models/user.model");
const Week = require("../models/week.model");
const ServiceCenter = require("../models/serviceCenter.model");
const Planning = require("../models/planning.model");

// Fonction utilitaire : ajouter des jours à une date
function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

/**
 * Créer un planning pour un service center, réparti sur X utilisateurs et Y semaines.
 * Vérifie que le planning ne chevauche pas un autre planning déjà existant.
 * Utilise une transaction pour garantir l’atomicité des opérations.
 */
router.post('/', authenticateToken, async (req, res) => {
  const { startDate, numUsers, weeks, serviceCenter } = req.body;
  if (!startDate || !numUsers || !weeks || !serviceCenter) {
    return res.status(400).json({ message: "Planning information is missing" });
  }
  if (weeks % numUsers !== 0) {
    return res.status(400).json({ message: "Weeks must be a multiple of users" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Recherche du Service Center
    const sc = await ServiceCenter.findOne({ name: serviceCenter }).session(session);
    if (!sc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: true, message: "Service center not found" });
    }

    // Création du planning avec calcul de l'endDate (weeks * 7 jours)
    const planning = new Planning({
      serviceCenter,
      startDate,
      endDate: addDays(new Date(startDate), weeks * 7),
      weeks: [] // Initialisation de l'array de semaines
    });

    // Vérification du chevauchement des plannings existants pour ce service center
    const overlappingPlannings = await Planning.find({
      serviceCenter,
      $or: [
        { startDate: { $lte: planning.endDate, $gte: planning.startDate } },
        { endDate: { $lte: planning.endDate, $gte: planning.startDate } },
        { startDate: { $lte: planning.startDate }, endDate: { $gte: planning.endDate } }
      ]
    }).session(session);

    if (overlappingPlannings && overlappingPlannings.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: true, message: "Planning overlaps with another planning" });
    }

    // Récupération des utilisateurs du service center (hors admins), triés par workedDays
    const pickedUsers = await User.find({ serviceCenter, isAdmin: false })
      .sort({ workedDays: 1 })
      .limit(numUsers)
      .session(session);

    if (pickedUsers.length < numUsers) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: true, message: "Not enough users available to create planning" });
    }

    let changing = new Date(startDate);
    const totalCycles = weeks / numUsers;

    // Boucle pour créer les semaines en répartissant les shifts entre les utilisateurs
    for (let cycle = 0; cycle < totalCycles; cycle++) {
      for (const user of pickedUsers) {
        // Création d'une semaine pour l'utilisateur courant
        const newWeek = new Week({
          thursday: { date: changing, user: user._id },
          friday: { date: addDays(changing, 1), user: user._id },
          saturday: { date: addDays(changing, 2), user: user._id },
          sunday: { date: addDays(changing, 3), user: user._id },
          monday: { date: addDays(changing, 4), user: user._id },
          tuesday: { date: addDays(changing, 5), user: user._id },
          wednesday: { date: addDays(changing, 6), user: user._id },
        });
        await newWeek.save({ session });
        // On stocke l'ID de la semaine dans le planning
        planning.weeks.push(newWeek._id);

        // Mise à jour des shifts de l'utilisateur en une seule opération
        user.shifts.push(
          changing,
          addDays(changing, 1),
          addDays(changing, 2),
          addDays(changing, 3),
          addDays(changing, 4),
          addDays(changing, 5),
          addDays(changing, 6)
        );
        // Augmentation du compteur workedDays (facultatif selon votre logique)
        user.workedDays += 7;
        await user.save({ session });

        // Passage à la semaine suivante
        changing = addDays(changing, 7);
      }
    }

    await planning.save({ session });

    // Mise à jour du planning dans le Service Center
    sc.planning = planning._id;
    await sc.save({ session });

    await session.commitTransaction();
    session.endSession();
    return res.json({ error: false, message: "Planning created successfully", planning });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating planning:", error);
    return res.status(500).json({ error: true, message: error.message });
  }
});

/**
 * GET /user/:userID
 * Récupère les jours de garde (shifts) d'un utilisateur donné.
 */
router.get("/user/:userID", authenticateToken, async (req, res) => {
  const { userID } = req.params;
  if (!userID) return res.status(400).json({ message: "User ID is missing" });
  try {
    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ error: true, message: "User not found" });
    return res.json({ error: false, message: "These are the days the user is on duty", days: user.shifts });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

/**
 * GET /sc/:name
 * Récupère le planning associé à un service center (nom sensible à la casse).
 */
router.get("/sc/:name", authenticateToken, async (req, res) => {
  const { name } = req.params;
  if (!name) return res.status(400).json({ message: "Service center name is missing" });
  try {
    const sc = await ServiceCenter.findOne({ name });
    if (!sc) return res.status(404).json({ error: true, message: "Service center not found" });
    const planning = await Planning.findById(sc.planning).populate("weeks");
    return res.json({ error: false, message: "Planning for service center", planning });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

/**
 * DELETE /:id
 * Supprime un planning, ainsi que les semaines associées et efface les shifts des utilisateurs.
 * Utilise une transaction pour garantir l’atomicité des suppressions.
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const planning = await Planning.findById(id).populate("weeks").session(session);
    if (!planning) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: true, message: "Planning not found" });
    }
    // Suppression de chaque semaine liée
    for (const week of planning.weeks) {
      await Week.findByIdAndDelete(week._id, { session });
    }
    // Pour tous les utilisateurs du même service center, on vide leur tableau de shifts
    const users = await User.find({ serviceCenter: planning.serviceCenter }).session(session);
    for (const user of users) {
      user.shifts = [];
      await user.save({ session });
    }
    // Mise à jour du Service Center pour retirer la référence au planning
    const sc = await ServiceCenter.findOne({ name: planning.serviceCenter }).session(session);
    if (sc) {
      sc.planning = null;
      await sc.save({ session });
    }
    // Suppression du planning
    await Planning.findByIdAndDelete(id, { session });
    await session.commitTransaction();
    session.endSession();
    return res.json({ error: false, message: "Planning deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;