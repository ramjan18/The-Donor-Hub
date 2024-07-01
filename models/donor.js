const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const donorSchema = new Schema({
    name : {
        type : String,
        require : true
    },
    email : {
        type : String,
        require : true
    },
    contact : {
        type : Number,
        require : true
    },
    bloodGroup : {
        type : String,
        require : true
    },
    age : {
        type : Number
    },
    address : {
        type : String,
        require : true
    },
    city : {
        type : String,
        require : true
    },
    lastDate : {
        type : Date,
        
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "users"
    }

})


const donor = mongoose.model("donor",donorSchema);
module.exports = donor;