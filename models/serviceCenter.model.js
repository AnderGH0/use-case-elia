const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceCenterSchema = new Schema({
    name: String,
    zone: String,
    users : { type: [{type: mongoose.SchemaTypes.ObjectId, ref:"User"}], default: [] },
    planning : { type: mongoose.SchemaTypes.ObjectId, ref:"Planning" },
});

module.exports = mongoose.model("ServiceCenter", serviceCenterSchema);

/* 
North-West
    Lendelede
    Lochristi
North-East
    Merksem
    Stalen
    Schaarbeek_Noord
South-West
    Gouy
    Schaarbeek_Sud
South-East    
    Bressoux
    Villeroux
    Gembloux
    Namur
*/