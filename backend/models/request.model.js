const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestSchema = new Schema({
    serviceCenter: { type: String, required : true},
    userPhone : { type: Number, required: true },
    targetPhone : Number,
    days: { type: [Date], required: true },
    pending: { type: Boolean, default:true },   // montrer dans les notifications/requestUser
    picked: { type: Boolean, default:false },   // quelqu'un a accepté
    isGlobal: { type: Boolean, default:false },
    isUrgent: { type: Boolean, default:false },
    //reason: {type: String, required: true}
});

module.exports = mongoose.model("Request", requestSchema);