const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const planningSchema = new Schema({
    startDate: {type: Date, required: true},
    endDate: {type: Date, required: true},
    weeks : {type : [{type: mongoose.SchemaTypes.ObjectId, ref: "Week"}], required: true},
})

module.exports = mongoose.model("Planning", planningSchema);