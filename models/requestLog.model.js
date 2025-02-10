const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const requestLogSchema = new Schema({
    id: { type: String, required: true },
    absentee: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
    replacement: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
    days: { type: [Date], required: true },
    isUrgent: {type: Boolean, default:false, required: true},
    pending: {type: Boolean, default:true, required: true},
    declined: {type: Boolean, default:false, required: true},
});

module.exports = mongoose.model("RequestLog", requestLogSchema);