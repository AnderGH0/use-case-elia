// models/Request.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestSchema = new Schema({
  serviceCenter: { type: String, required: true },
  userPhone: { type: Number, required: true },
  targetPhone: { type: Number }, 
  days: { type: [Date], required: true },
  pending: { type: Boolean, default: true },
  picked: { type: Boolean, default: false },
  isGlobal: { type: Boolean, default: false },
  isUrgent: { type: Boolean, default: false },
  planningId: { type: mongoose.Schema.Types.ObjectId, ref: "Planning", required: true },
  weekId: { type: mongoose.Schema.Types.ObjectId, ref: "Week", required: true },
  userFrom: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

module.exports = mongoose.model("Request", requestSchema);
