const mongoose = require('mongoose');
const monthModel = require('./planning.model');
const Schema = mongoose.Schema;

const zoneSchema = new Schema({
    name: { type: String, required: true },
    workers : { type: [{type: mongoose.SchemaTypes.ObjectId, ref:"User"}], default: [] },
    planning : { type: mongoose.SchemaTypes.ObjectId, ref:"Planning" ,required: true },
});

module.exports = mongoose.model("Zone", zoneSchema);