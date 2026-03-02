require("dotenv").config();
const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

/* ==============================
   MongoDB Atlas Connection
============================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err);
  });

/* ==============================
   Cafe Schema
============================== */
const cafeSchema = new mongoose.Schema({
  osmId: { type: Number, unique: true },
  name: String,
  location: {
    type: {
      type: String,
      default: "Point"
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  }
});

cafeSchema.index({ location: "2dsphere" });

const Cafe = mongoose.model("Cafe", cafeSchema);

// Ensure indexes are synced
mongoose.connection.once("open", async () => {
  await Cafe.syncIndexes();
  console.log("📍 Geo Index Synced");
});

/* ==============================
   Geocode Location (Nominatim)
============================== */
async function geocodeLocation(location) {
  const response = await axios.get(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
    {
      headers: { "User-Agent": "cafe-finder-app" }
    }
  );

  if (!response.data.length) {
    throw new Error("Location not found");
  }

  return {
    lat: parseFloat(response.data[0].lat),
    lon: parseFloat(response.data[0].lon)
  };
}

/* ==============================
   Fetch Cafes from Overpass API
============================== */
async function fetchCafesFromOSM(lat, lon) {
  const delta = 0.03; // ~3km bounding box

  const south = lat - delta;
  const north = lat + delta;
  const west = lon - delta;
  const east = lon + delta;

  const query = `
    [out:json][timeout:25];
    node["amenity"="cafe"](${south},${west},${north},${east});
    out 200;
  `;

  const response = await axios.post(
    "https://overpass-api.de/api/interpreter",
    query,
    { headers: { "Content-Type": "text/plain" } }
  );

  return response.data.elements;
}

/* ==============================
   Main Route
============================== */
app.get("/api/cafes", async (req, res) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({ error: "Location query required" });
    }

    // 1️⃣ Convert location to coordinates
    const { lat, lon } = await geocodeLocation(location);

    const radiusInMeters = 3000;

    // 2️⃣ Check DB first
    const existingCafes = await Cafe.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat]
          },
          $maxDistance: radiusInMeters
        }
      }
    });

    // If enough cafes already stored, return
    if (existingCafes.length >= 50) {
      console.log("📦 Returning cafes from DB");
      return res.json(existingCafes);
    }

    console.log("🌍 Fetching from OSM...");

    // 3️⃣ Fetch from OSM
    const osmCafes = await fetchCafesFromOSM(lat, lon);

    const formatted = osmCafes.map(cafe => ({
      osmId: cafe.id,
      name: cafe.tags?.name || "Cafe (No Name)",
      location: {
        type: "Point",
        coordinates: [cafe.lon, cafe.lat]
      }
    }));

    // 4️⃣ Upsert safely (no duplicate errors)
    if (formatted.length > 0) {
      await Cafe.bulkWrite(
        formatted.map(cafe => ({
          updateOne: {
            filter: { osmId: cafe.osmId },
            update: { $setOnInsert: cafe },
            upsert: true
          }
        }))
      );
    }

    // 5️⃣ Return updated results
    const updatedCafes = await Cafe.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat]
          },
          $maxDistance: radiusInMeters
        }
      }
    });

    res.json(updatedCafes);

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ==============================
   Start Server
============================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});