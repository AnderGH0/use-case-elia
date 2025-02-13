// models/RequestLog.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestLogSchema = new Schema({
  id: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },
  absentee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  replacement: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ObjectId ou null
  days: { type: [Date], required: true },
  isUrgent: { type: Boolean, default: false },
  pending: { type: Boolean, default: true },
  declined: { type: Boolean, default: false }
});

module.exports = mongoose.model("RequestLog", requestLogSchema);
