const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const planningSchema = new Schema({
    serviceCenter : {type: String, required: true},
    startDate: Date,
    endDate: Date,
    weeks : {type : [{type: mongoose.SchemaTypes.ObjectId, ref: "Week"}], default: []},
})

module.exports = mongoose.model("Planning", planningSchema);