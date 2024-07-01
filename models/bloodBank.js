const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bloodBankSchema = new Schema({
     bloodBankName : {
        type : String,
        require : true,
     },
     category : {
        type : String,
        require : true,
     },
     phone_number : {
        type : Number,
        require : true,
     },
     email : {
        type : String,
        require : true,
     },
     licence_No : {
        type : String,
        require : true,
     },
     state : {
        type : String,
        require : true,
     },
     district : {
        type : String,
        require : true,
     },
     city : {
        type : String,
        require : true,
     },
     address : {
        type : String,
        require : true,
     },
     pincode : {
        type : Number,
        require : true,
     },
     geometry : {
         type: {
           type: String, // Don't do `{ location: { type: String } }`
           enum: ['Point'], // 'location.type' must be 'Point'
           required: true
         },
         coordinates: {
           type: [Number],
           required: true
         }
       },
     owner : {
      type : Schema.Types.ObjectId,
      ref : "users"
  }



})

const bloodBank = mongoose.model("bloodBank",bloodBankSchema);
module.exports = bloodBank;