const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName : {type: String, required: true},
    lastName : {type: String, required: true},
    abreveation : {type: String},
    phone : {type: Number, required: true},
    serviceCenter : {type: String, required: true},
    password : {type: String, required: true},
    workedDays : {type: Number, default: 0},
    isAdmin : {type: Boolean, default:false},
    requests : {type:  [{type: mongoose.SchemaTypes.ObjectId, ref: "Request"}],  default: []},
    token : String
})

module.exports = mongoose.model("User", userSchema);
