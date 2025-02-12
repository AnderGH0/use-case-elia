const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestSchema = new Schema({
    serviceCenter: { type: String, required: true },
    userPhone: { type: Number, required: true },
    targetPhone: Number,
    days: { type: [Date], required: true },
    pending: { type: Boolean, default: true },   // montre dans les notifications/requestUser
    picked: { type: Boolean, default: false },     // quelqu'un a accepté
    isGlobal: { type: Boolean, default: false },
    isUrgent: { type: Boolean, default: false },
    // Champs ajoutés pour le switch de shift :
    planningId: { type: mongoose.Schema.Types.ObjectId, ref: "Planning" },
    weekId: { type: mongoose.Schema.Types.ObjectId, ref: "Week" },
    day: { type: String },                         // ex: "monday", "tuesday", etc.
    userFrom: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Request", requestSchema);