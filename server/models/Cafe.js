const mongoose = require("mongoose");

const cafeSchema = new mongoose.Schema({
  osmId: { type: Number, unique: true },

  name: String,
  address: String,
  rating: Number,
  totalReviews: Number,
  placeId: String,

  photos: [String],

  location: {
    type: {
      type: String,
      default: "Point"
    },
    coordinates: [Number] // [lon, lat]
  }
});

cafeSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Cafe", cafeSchema);