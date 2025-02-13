const mongoose = require('mongoose');
const Planning = require("../models/planning.model"); 
const Week = require("../models/week.model");

async function switchShift({ planningId, weekId, day, userFrom, userTo }) {
  // Démarrer une session et une transaction pour assurer l’atomicité
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Récupérer le planning
    const planning = await Planning.findById(planningId).session(session);
    if (!planning) {
      throw new Error("Planning not found");
    }

    // Récupérer la semaine concernée
    const week = await Week.findById(weekId).session(session);
    if (!week) {
      throw new Error("Week not found");
    }
    
    // Vérifier que le shift du jour demandé existe dans la semaine
    // et que l'utilisateur actuellement assigné correspond bien à l'utilisateur qui cède (userFrom)
    if (!week[day] || week[day].user.toString() !== userFrom.toString()) {
      throw new Error("Shift not available for switch");
    }
    
    // Effectuer le switch : assigner l'utilisateur qui accepte (userTo) à ce shift
    week[day].user = userTo;
    
    // Sauvegarder les modifications de la semaine dans le cadre de la session
    await week.save({ session });
    
    // (Optionnel) Vous pouvez mettre à jour d'autres informations dans le planning si nécessaire...
    
    // Valider la transaction et fermer la session
    await session.commitTransaction();
    session.endSession();
    
    // Retourner la semaine modifiée (ou toute autre information pertinente)
    return week;
  } catch (error) {
    // En cas d'erreur, annuler la transaction et fermer la session
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

module.exports = { switchShift };
