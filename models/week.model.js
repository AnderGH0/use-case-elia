const mongoose = require("mongoose");
const Schema = mongoose.Schema

const weekSchema = new Schema({
    serviceCenter: String,
    thursday: {type: {date: Date, user:{type: mongoose.SchemaTypes.ObjectId, ref:"User"}}, required: true},
    friday: {type: {date: Date, user:{type: mongoose.SchemaTypes.ObjectId, ref:"User"}}, required: true},
    saturday: {type: {date: Date, user:{type: mongoose.SchemaTypes.ObjectId, ref:"User"}}, required: true},
    sunday: {type: {date: Date, user:{type: mongoose.SchemaTypes.ObjectId, ref:"User"}}, required: true},
    monday: {type: {date: Date, user:{type: mongoose.SchemaTypes.ObjectId, ref:"User"}}, required: true},
    tuesday: {type: {date: Date, user:{type: mongoose.SchemaTypes.ObjectId, ref:"User"}}, required: true},
    wednesday: {type: {date: Date, user:{type: mongoose.SchemaTypes.ObjectId, ref:"User"}}, required: true},
});


module.exports = mongoose.model("Week", weekSchema);