const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const campSchema = new Schema({
    camp_Name : {
        type : String,
        require : true
    },
    address : {
        type : String,
        require : true
    },
    city : {
        type : String,
        require : true
    },
    district : {
        type : String,
        require : true
    },
    contact : {
        type : Number,
        require : true
    },
    conducted_By : {
        type : String,
        require : true
    },
    organised_By : {
        type : String,
        require : true
    },
    campDate :{
        type : Date
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
});

const campRegistration=mongoose.model("campRegistration",campSchema);
module.exports=campRegistration;
