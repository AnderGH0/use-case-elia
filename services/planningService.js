async function switchShift({ planningId, weekId, day, userFrom, userTo }) {
    // Démarrer une transaction, par exemple
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Récupérer le planning et la semaine
      const planning = await Planning.findById(planningId).session(session);
      const week = await Week.findById(weekId).session(session);
      
      // Vérifier que la journée et l'affectation correspondent aux attentes
      if (!week[day] || week[day].user.toString() !== userFrom) {
        throw new Error("Shift not available for switch");
      }
      
      // Effectuer le switch en assignant userTo à cette journée
      week[day].user = userTo;
      await week.save({ session });
      
      // Mettre à jour d'autres informations dans le planning ou les utilisateurs
      // ...
  
      await session.commitTransaction();
      session.endSession();
      return week;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  
  module.exports = { switchShift };
  