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
  reviews: { type: Number, default: 0 },
  avatar: { type: String, default: "" }
});
const User = mongoose.model("User", userSchema);

/* ==============================
   Cafe Schema
============================== */
const cafeSchema = new mongoose.Schema({
  osmId: { type: Number, unique: true },
  name: String,
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }
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

mongoose.connection.once("open", async () => {
  await Cafe.syncIndexes();
  console.log("📍 Geo Index Synced");
});

/* ==============================
   Deal Schema
============================== */
const dealSchema = new mongoose.Schema({
  title: String,
  description: String,
  discount: String,       // plain number string e.g. "50"
  discountLabel: String,  // display label e.g. "50% OFF" or "Free Cookie"
  code: String,
  validUntil: String,
  image: String,
  category: { type: String, enum: ["cafe", "bakery", "workspace"], default: "cafe" },
  cafeName: String,
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number]
  },
  maxUses: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
});
dealSchema.index({ location: "2dsphere" });
const Deal = mongoose.model("Deal", dealSchema);

/* ==============================
   Redemption Schema — tracks which user claimed which deal
============================== */
const redemptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: "Deal", required: true },
  claimedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }  // claimedAt + 3 minutes
});
// Unique index: one redemption per user per deal
redemptionSchema.index({ userId: 1, dealId: 1 }, { unique: true });
const Redemption = mongoose.model("Redemption", redemptionSchema);

mongoose.connection.once("open", async () => {
  await Deal.syncIndexes();
  await Redemption.syncIndexes();
  console.log("🏷️ Deal + Redemption Indexes Synced");
});

/* ==============================
   Seed Deals — run once via POST /api/deals/seed
============================== */
app.post("/api/deals/seed", async (req, res) => {
  try {
    await Deal.deleteMany({});
    const sampleDeals = [
      {
        title: "Buy 1 Get 1 Coffee",
        description: "Any coffee drink, buy one get one free all day. Valid on all hot and cold brews!",
        discount: "50", discountLabel: "50% OFF", code: "BOGO50",
        validUntil: "Apr 30, 2026",
        image: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
        category: "cafe", cafeName: "Brew House",
        location: { type: "Point", coordinates: [72.8354, 19.0596] }
      },
      {
        title: "Student 20% Off",
        description: "Show your college ID and get 20% off your entire order. Every day!",
        discount: "20", discountLabel: "20% OFF", code: "STUDENT20",
        validUntil: "Jun 1, 2026",
        image: "https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg",
        category: "cafe", cafeName: "Urban Beans",
        location: { type: "Point", coordinates: [72.8310, 19.0540] }
      },
      {
        title: "Free Cookie Combo",
        description: "Order any cappuccino and get a free chocolate chip cookie.",
        discount: "15", discountLabel: "Free Cookie", code: "COOKIE",
        validUntil: "Apr 15, 2026",
        image: "https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg",
        category: "bakery", cafeName: "Cafe Mocha",
        location: { type: "Point", coordinates: [72.8400, 19.0620] }
      },
      {
        title: "Remote Worker Pack",
        description: "4-hour focus pod + 2 free Americanos. Work in peace.",
        discount: "35", discountLabel: "35% OFF", code: "REMOTE35",
        validUntil: "Apr 10, 2026",
        image: "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg",
        category: "workspace", cafeName: "CloudWork Café",
        location: { type: "Point", coordinates: [72.8280, 19.0510] }
      },
      {
        title: "Happy Hour Special",
        description: "4–6 PM only: any cold brew or iced latte for just ₹99.",
        discount: "40", discountLabel: "40% OFF", code: "HAPPY40",
        validUntil: "May 1, 2026",
        image: "https://images.pexels.com/photos/461064/pexels-photo-461064.jpeg",
        category: "cafe", cafeName: "Chill Drip",
        location: { type: "Point", coordinates: [72.8370, 19.0580] }
      },
      {
        title: "Morning Brew Deal",
        description: "Any breakfast combo before 11 AM at 30% off.",
        discount: "30", discountLabel: "30% OFF", code: "MORNING30",
        validUntil: "May 15, 2026",
        image: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg",
        category: "cafe", cafeName: "Dawn Roast",
        location: { type: "Point", coordinates: [72.8420, 19.0610] }
      },
      {
        title: "Vegan Combo Deal",
        description: "Any vegan item + oat milk latte for just ₹299.",
        discount: "25", discountLabel: "25% OFF", code: "VEGAN25",
        validUntil: "Apr 5, 2026",
        image: "https://images.pexels.com/photos/757520/pexels-photo-757520.jpeg",
        category: "bakery", cafeName: "Café Botanica",
        location: { type: "Point", coordinates: [72.8340, 19.0555] }
      },
      {
        title: "Late Night Special",
        description: "After 8 PM: signature mocha + banana bread for just ₹199.",
        discount: "20", discountLabel: "20% OFF", code: "NIGHT20",
        validUntil: "Mar 31, 2026",
        image: "https://images.pexels.com/photos/29951/pexels-photo-29951.jpg",
        category: "cafe", cafeName: "Mocha Hideaway",
        location: { type: "Point", coordinates: [72.8390, 19.0635] }
      }
    ];
    await Deal.insertMany(sampleDeals);
    console.log(`✅ Seeded ${sampleDeals.length} deals`);
    res.json({ message: "✅ Deals seeded!", count: sampleDeals.length });
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   GET /api/deals/nearby
   Returns deals sorted by score, with claimed status per user
============================== */
app.get("/api/deals/nearby", async (req, res) => {
  try {
    const { lat, lon, userId } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon required" });

    const userLat = parseFloat(lat);
    const userLon = parseFloat(lon);

    const deals = await Deal.find({
      active: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [userLon, userLat] },
          $maxDistance: 100000 // 100km — covers whole city
        }
      }
    }).limit(20);

    // Fetch this user's redemptions if logged in
    let claimedDealIds = new Set();
    let redemptionMap = {}; // dealId -> { claimedAt, expiresAt }

    if (userId) {
      const redemptions = await Redemption.find({ userId });
      redemptions.forEach(r => {
        claimedDealIds.add(r.dealId.toString());
        redemptionMap[r.dealId.toString()] = {
          claimedAt: r.claimedAt,
          expiresAt: r.expiresAt
        };
      });
    }

    const scored = deals.map(d => {
      const discountNum = parseFloat(d.discount) || 10;
      const dlon = d.location.coordinates[0];
      const dlat = d.location.coordinates[1];
      const distKm = Math.sqrt(
        Math.pow((dlon - userLon) * Math.cos(userLat * Math.PI / 180) * 111, 2) +
        Math.pow((dlat - userLat) * 111, 2)
      );
      const score = (discountNum * 0.6) + ((1 / (distKm + 0.1)) * 20 * 0.4);

      const dealIdStr = d._id.toString();
      const redemption = redemptionMap[dealIdStr];
      const isClaimed = claimedDealIds.has(dealIdStr);
      const isExpired = redemption ? new Date() > new Date(redemption.expiresAt) : false;

      return {
        ...d.toObject(),
        distanceKm: Math.round(distKm * 10) / 10,
        score: Math.round(score * 10) / 10,
        // Redemption info for this user
        claimed: isClaimed,
        expired: isExpired,
        claimedAt: redemption?.claimedAt || null,
        expiresAt: redemption?.expiresAt || null
      };
    }).sort((a, b) => b.score - a.score);

    console.log(`🏷️ Returning ${scored.length} deals near ${userLat},${userLon}`);
    res.json(scored);
  } catch (err) {
    console.error("❌ Deals error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   POST /api/deals/:id/redeem
   Requires userId in body. Prevents double-claiming.
============================== */
app.post("/api/deals/:id/redeem", async (req, res) => {
  try {
    const { userId } = req.body;
    const dealId = req.params.id;

    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    if (deal.usedCount >= deal.maxUses) return res.status(400).json({ error: "Deal fully redeemed" });

    // If user is logged in, check + record redemption
    if (userId) {
      const existing = await Redemption.findOne({ userId, dealId });

      if (existing) {
        // Already claimed — return existing timer info so frontend can resume
        const secondsLeft = Math.max(
          Math.floor((new Date(existing.expiresAt) - new Date()) / 1000),
          0
        );
        return res.json({
          success: true,
          alreadyClaimed: true,
          claimedAt: existing.claimedAt,
          expiresAt: existing.expiresAt,
          secondsLeft
        });
      }

      // New redemption — save to DB
      const claimedAt = new Date();
      const expiresAt = new Date(claimedAt.getTime() + 3 * 60 * 1000); // +3 minutes

      await Redemption.create({ userId, dealId, claimedAt, expiresAt });

      // Increment usedCount
      deal.usedCount += 1;
      await deal.save();

      return res.json({
        success: true,
        alreadyClaimed: false,
        claimedAt,
        expiresAt,
        secondsLeft: 180,
        remaining: deal.maxUses - deal.usedCount
      });
    }

    // Guest user — just increment count, no redemption record
    deal.usedCount += 1;
    await deal.save();
    res.json({ success: true, alreadyClaimed: false, secondsLeft: 180, remaining: deal.maxUses - deal.usedCount });

  } catch (err) {
    console.error("❌ Redeem error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   GET /api/deals/my-redemptions/:userId
   Returns all deals this user has claimed
============================== */
app.get("/api/deals/my-redemptions/:userId", async (req, res) => {
  try {
    const redemptions = await Redemption.find({ userId: req.params.userId })
      .populate("dealId")
      .sort({ claimedAt: -1 });

    res.json(redemptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   Geocode Location (Nominatim)
============================== */
async function geocodeLocation(location) {
  let searchQuery = location;
  const mumbaiSuburbs = ["bandra", "andheri", "dadar", "juhu", "powai", "worli", "colaba", "lower parel"];
  if (mumbaiSuburbs.some(suburb => location.toLowerCase().includes(suburb))) {
    searchQuery = `${location}, Mumbai, India`;
  }
  const response = await axios.get(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
    { headers: { "User-Agent": "cafe-finder-app" } }
  );
  if (!response.data.length) throw new Error(`Location "${location}" not found.`);
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
  const delta = 0.03;
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="cafe"](${lat - delta},${lon - delta},${lat + delta},${lon + delta});
      way["amenity"="cafe"](${lat - delta},${lon - delta},${lat + delta},${lon + delta});
    );
    out body center;
  `;
  const response = await axios.post("https://overpass-api.de/api/interpreter", query, {
    headers: { "Content-Type": "text/plain" }
  });
  return response.data.elements;
}

/* ==============================
   Format OSM Data
============================== */
function formatCafeData(osmElement, index) {
  const tags = osmElement.tags || {};
  const lat = osmElement.lat || osmElement.center?.lat;
  const lon = osmElement.lon || osmElement.center?.lon;
  const amenityTags = [];
  if (tags.wifi === "yes" || tags["internet_access"] === "wlan") amenityTags.push("Wi-Fi");
  if (tags.outdoor_seating === "yes") amenityTags.push("Outdoor Seating");
  if (tags.wheelchair === "yes") amenityTags.push("Accessible");
  if (tags.takeaway === "yes") amenityTags.push("Takeaway");
  const descriptions = [
    "Cozy neighborhood cafe with artisanal coffee and fresh pastries.",
    "Modern coffee shop known for specialty brews and friendly atmosphere.",
    "Charming cafe perfect for working or catching up with friends.",
    "Local favorite serving excellent coffee and homemade treats.",
    "Stylish coffee bar with a relaxed vibe and quality beans."
  ];
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
    location: { type: "Point", coordinates: [lon, lat] },
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
   Auth Endpoints
============================== */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: "User created successfully", user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const user = await User.findOne({ email });
    if (!user || user.password !== password) return res.status(401).json({ error: "Invalid email or password" });
    res.json({ message: "Login successful", user: { id: user._id, name: user.name, email: user.email,avatar: user.avatar,   favorites: user.favorites, visits: user.visits, reviews: user.reviews, createdAt: user.createdAt } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==============================
   Cafes by Coordinates
============================== */
app.get("/api/cafes/coordinates", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Latitude and longitude required" });
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const existingCafes = await Cafe.find({
      location: { $near: { $geometry: { type: "Point", coordinates: [longitude, latitude] }, $maxDistance: 5000 } }
    }).limit(100);
    if (existingCafes.length >= 5) {
      return res.json({ location: "Your Location", coordinates: { lat: latitude, lon: longitude }, cafes: existingCafes });
    }
    const osmCafes = await fetchCafesFromOSM(latitude, longitude);
    const formatted = osmCafes.filter(c => c.lat || c.center?.lat).map((c, i) => formatCafeData(c, i));
    if (formatted.length > 0) {
      await Cafe.bulkWrite(formatted.map(cafe => ({
        updateOne: { filter: { osmId: cafe.osmId }, update: { $setOnInsert: cafe }, upsert: true }
      })));
    }
    const updatedCafes = await Cafe.find({
      location: { $near: { $geometry: { type: "Point", coordinates: [longitude, latitude] }, $maxDistance: 5000 } }
    }).limit(100);
    res.json({ location: "Your Location", coordinates: { lat: latitude, lon: longitude }, cafes: updatedCafes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==============================
   Cafes by Location Name
============================== */
app.get("/api/cafes", async (req, res) => {
  try {
    const { location } = req.query;
    if (!location) return res.status(400).json({ error: "Location query required" });
    const { lat, lon, displayName } = await geocodeLocation(location);
    const existingCafes = await Cafe.find({
      location: { $near: { $geometry: { type: "Point", coordinates: [lon, lat] }, $maxDistance: 5000 } }
    }).limit(100);
    if (existingCafes.length >= 20) {
      return res.json({ location: displayName, coordinates: { lat, lon }, cafes: existingCafes });
    }
    const osmCafes = await fetchCafesFromOSM(lat, lon);
    const formatted = osmCafes.filter(c => c.lat || c.center?.lat).map((c, i) => formatCafeData(c, i));
    if (formatted.length > 0) {
      await Cafe.bulkWrite(formatted.map(cafe => ({
        updateOne: { filter: { osmId: cafe.osmId }, update: { $setOnInsert: cafe }, upsert: true }
      })));
    }
    const updatedCafes = await Cafe.find({
      location: { $near: { $geometry: { type: "Point", coordinates: [lon, lat] }, $maxDistance: 5000 } }
    }).limit(100);
    res.json({ location: displayName, coordinates: { lat, lon }, cafes: updatedCafes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==============================
   Single Cafe Details
============================== */
app.get("/api/cafes/:id", async (req, res) => {
  try {
    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) return res.status(404).json({ error: "Cafe not found" });
    const mockReviews = [
      { author: "Sarah M.", rating: 5, text: "Absolutely love this place! The coffee is always perfect and the ambiance is unmatched.", date: "2 days ago" },
      { author: "Alex K.", rating: 4, text: "Great selection and friendly staff. Gets a bit crowded on weekends but worth it!", date: "1 week ago" },
      { author: "Jamie L.", rating: 5, text: "Best coffee in the area! The interior is beautiful and perfect for remote work.", date: "2 weeks ago" }
    ];
    const mockMenu = [
      { name: "Espresso", price: 3.50, image: "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg" },
      { name: "Cappuccino", price: 4.50, image: "https://images.pexels.com/photos/29951/pexels-photo-29951.jpg" },
      { name: "Latte", price: 4.75, image: "https://images.pexels.com/photos/461064/pexels-photo-461064.jpeg" },
      { name: "Croissant", price: 3.25, image: "https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg" }
    ];
    res.json({ ...cafe.toObject(), reviews: mockReviews, menu: mockMenu, rating: 4.5, reviewCount: 127 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
/* ==============================
   Favorites Endpoints
============================== */

// GET /api/users/:userId/favorites — fetch populated favorites
app.get("/api/users/:userId/favorites", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("favorites");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:userId/favorites/:cafeId — add a favorite
app.post("/api/users/:userId/favorites/:cafeId", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $addToSet: { favorites: req.params.cafeId } }, // $addToSet prevents duplicates
      { new: true }
    ).populate("favorites");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:userId/favorites/:cafeId — remove a favorite
app.delete("/api/users/:userId/favorites/:cafeId", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $pull: { favorites: req.params.cafeId } },
      { new: true }
    ).populate("favorites");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/* ==============================
   Update Profile
============================== */
app.put("/api/auth/profile/:userId", async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (avatar !== undefined) updates.avatar = avatar; // base64 string or ""

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: updates },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Profile updated", user: {
      id: user._id, name: user.name, email: user.email,
      avatar: user.avatar, favorites: user.favorites,
      visits: user.visits, reviews: user.reviews, createdAt: user.createdAt
    }});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/deals/reset-all", async (req, res) => {
  try {
    await Redemption.deleteMany({});
    await Deal.updateMany({}, { $set: { usedCount: 0 } });
    res.json({ message: "✅ All redemptions cleared, deals reset" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});