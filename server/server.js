require("dotenv").config();
const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas Connected"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err);
  });

/* ==============================
   User Schema
============================== */
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cafe' }],
  visits: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 }
});

const User = mongoose.model("User", userSchema);

/* ==============================
   Enhanced Cafe Schema
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
  },
  address: String,
  phone: String,
  website: String,
  openingHours: String,
  cuisine: String,
  wheelchair: String,
  outdoor: Boolean,
  wifi: Boolean,
  photo: String,
  photos: [String],
  description: String,
  tags: [String],
  lastUpdated: { type: Date, default: Date.now }
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
  // Add "India" if it's a Mumbai suburb
  let searchQuery = location;
  const mumbaiSuburbs = ["bandra", "andheri", "dadar", "juhu", "powai", "worli", "colaba", "lower parel"];
  
  if (mumbaiSuburbs.some(suburb => location.toLowerCase().includes(suburb))) {
    searchQuery = `${location}, Mumbai, India`;
  }

  const response = await axios.get(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
    {
      headers: { "User-Agent": "cafe-finder-app" }
    }
  );

  if (!response.data.length) {
    throw new Error(`Location "${location}" not found. Try adding city/country.`);
  }

  return {
    lat: parseFloat(response.data[0].lat),
    lon: parseFloat(response.data[0].lon),
    displayName: response.data[0].display_name
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
    (
      node["amenity"="cafe"](${south},${west},${north},${east});
      way["amenity"="cafe"](${south},${west},${north},${east});
    );
    out body center;
  `;

  const response = await axios.post(
    "https://overpass-api.de/api/interpreter",
    query,
    { headers: { "Content-Type": "text/plain" } }
  );

  return response.data.elements;
}

/* ==============================
   Format OSM data with enriched info
============================== */
function formatCafeData(osmElement, index) {
  const tags = osmElement.tags || {};
  const lat = osmElement.lat || osmElement.center?.lat;
  const lon = osmElement.lon || osmElement.center?.lon;

  // Extract tags for features
  const amenityTags = [];
  if (tags.wifi === "yes" || tags["internet_access"] === "wlan") amenityTags.push("Wi-Fi");
  if (tags.outdoor_seating === "yes") amenityTags.push("Outdoor Seating");
  if (tags.wheelchair === "yes") amenityTags.push("Accessible");
  if (tags.takeaway === "yes") amenityTags.push("Takeaway");

  // Generate description
  const descriptions = [
    "Cozy neighborhood cafe with artisanal coffee and fresh pastries.",
    "Modern coffee shop known for specialty brews and friendly atmosphere.",
    "Charming cafe perfect for working or catching up with friends.",
    "Local favorite serving excellent coffee and homemade treats.",
    "Stylish coffee bar with a relaxed vibe and quality beans."
  ];

  // Pexels images (more reliable)
  const pexelsImages = [
    "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
    "https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg",
    "https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg",
    "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg",
    "https://images.pexels.com/photos/461064/pexels-photo-461064.jpeg",
    "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg",
    "https://images.pexels.com/photos/757520/pexels-photo-757520.jpeg",
    "https://images.pexels.com/photos/29951/pexels-photo-29951.jpg",
  ];

  return {
    osmId: osmElement.id,
    name: tags.name || "Local Cafe",
    location: {
      type: "Point",
      coordinates: [lon, lat]
    },
    address: tags["addr:street"] 
      ? `${tags["addr:housenumber"] || ""} ${tags["addr:street"]}`.trim()
      : tags["addr:city"] || "Address not available",
    phone: tags.phone || tags["contact:phone"] || "Not available",
    website: tags.website || tags["contact:website"] || "",
    openingHours: tags.opening_hours || "Hours vary",
    cuisine: tags.cuisine || "Coffee & Snacks",
    wheelchair: tags.wheelchair || "unknown",
    outdoor: tags.outdoor_seating === "yes",
    wifi: tags.wifi === "yes" || tags["internet_access"] === "wlan",
    photo: pexelsImages[index % pexelsImages.length],
    photos: [
      pexelsImages[(index * 2) % pexelsImages.length],
      pexelsImages[(index * 3) % pexelsImages.length],
      pexelsImages[(index * 4) % pexelsImages.length],
      pexelsImages[(index * 5) % pexelsImages.length],
    ],
    description: descriptions[index % descriptions.length],
    tags: amenityTags
  };
}

/* ==============================
   Authentication Endpoints
============================== */

// Signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    console.log(`✅ New user registered: ${email}`);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("❌ Signup Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log(`✅ User logged in: ${email}`);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        favorites: user.favorites,
        visits: user.visits,
        reviews: user.reviews,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get("/api/auth/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("❌ Profile Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ==============================
   Get Cafes by Coordinates (NEW)
============================== */
app.get("/api/cafes/coordinates", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude required" });
    }

    const radiusInMeters = 5000; // 5km
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    console.log(`📍 Searching for cafes near coordinates: ${latitude}, ${longitude}`);

    // Check DB first
    const existingCafes = await Cafe.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusInMeters
        }
      }
    }).limit(100);

    // If we have cafes, return them
    if (existingCafes.length >= 5) {
      console.log(`📦 Returning ${existingCafes.length} cafes from DB for coordinates`);
      return res.json({
        location: "Your Location",
        coordinates: { lat: latitude, lon: longitude },
        cafes: existingCafes
      });
    }

    console.log("🌍 Fetching from OSM for coordinates...");

    // Fetch from OSM
    const osmCafes = await fetchCafesFromOSM(latitude, longitude);
    console.log(`🌍 Found ${osmCafes.length} cafes from OSM`);

    const formatted = osmCafes
      .filter(cafe => cafe.lat || cafe.center?.lat)
      .map((cafe, index) => formatCafeData(cafe, index));

    // Save to DB
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
      console.log(`💾 Saved ${formatted.length} cafes to DB`);
    }

    // Return updated results
    const updatedCafes = await Cafe.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusInMeters
        }
      }
    }).limit(100);

    console.log(`✅ Returning ${updatedCafes.length} cafes`);
    res.json({
      location: "Your Location",
      coordinates: { lat: latitude, lon: longitude },
      cafes: updatedCafes
    });

  } catch (error) {
    console.error("❌ Error in coordinates endpoint:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ==============================
   Main Route: Get Cafes Near Location
============================== */
app.get("/api/cafes", async (req, res) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({ error: "Location query required" });
    }

    // 1️⃣ Convert location to coordinates
    const { lat, lon, displayName } = await geocodeLocation(location);

    const radiusInMeters = 5000; // 5km

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
    }).limit(100);

    // If enough cafes already stored, return
    if (existingCafes.length >= 20) {
      console.log(`📦 Returning ${existingCafes.length} cafes from DB`);
      return res.json({
        location: displayName,
        coordinates: { lat, lon },
        cafes: existingCafes
      });
    }

    console.log("🌍 Fetching from OSM...");

    // 3️⃣ Fetch from OSM
    const osmCafes = await fetchCafesFromOSM(lat, lon);

    const formatted = osmCafes
      .filter(cafe => cafe.lat || cafe.center?.lat)
      .map((cafe, index) => formatCafeData(cafe, index));

    // 4️⃣ Upsert safely
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
    }).limit(100);

    res.json({
      location: displayName,
      coordinates: { lat, lon },
      cafes: updatedCafes
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* ==============================
   Get Single Cafe Details
============================== */
app.get("/api/cafes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const cafe = await Cafe.findById(id);
    
    if (!cafe) {
      return res.status(404).json({ error: "Cafe not found" });
    }

    // Add mock reviews
    const mockReviews = [
      {
        author: "Sarah M.",
        rating: 5,
        text: "Absolutely love this place! The coffee is always perfect and the ambiance is unmatched.",
        date: "2 days ago"
      },
      {
        author: "Alex K.",
        rating: 4,
        text: "Great selection and friendly staff. Gets a bit crowded on weekends but worth it!",
        date: "1 week ago"
      },
      {
        author: "Jamie L.",
        rating: 5,
        text: "Best coffee in the area! The interior is beautiful and perfect for remote work.",
        date: "2 weeks ago"
      }
    ];

    // Add mock menu items
    const mockMenu = [
      {
        name: "Espresso",
        price: 3.50,
        image: "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg"
      },
      {
        name: "Cappuccino",
        price: 4.50,
        image: "https://images.pexels.com/photos/29951/pexels-photo-29951.jpg"
      },
      {
        name: "Latte",
        price: 4.75,
        image: "https://images.pexels.com/photos/461064/pexels-photo-461064.jpeg"
      },
      {
        name: "Croissant",
        price: 3.25,
        image: "https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg"
      }
    ];

    res.json({
      ...cafe.toObject(),
      reviews: mockReviews,
      menu: mockMenu,
      rating: 4.5,
      reviewCount: 127
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});