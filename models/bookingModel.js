const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({


    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    service: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service',
    required: true
    },

    bookingTime: {
      type: Date,
      required: true
    },
    
    status:{
        type: String,
        enum: ["pending","conformed","cancelled"],
        default: "pending"
    }

}
,
{timestamps: true});

const bookingModel = mongoose.model('Booking', bookingSchema);

module.exports = bookingModel;