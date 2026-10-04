require("dotenv").config();
const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://cafe-finder-gamma-ten.vercel.app"
  ],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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
  menuUrl: String,
  openingHours: String,
  cuisine: String,
  wheelchair: String,
  outdoor: Boolean,
  wifi: Boolean,
  photo: String,
  photos: [String],
  menuPhotos: [{
    url: String,
    caption: String,
    uploadedBy: String,
    createdAt: { type: Date, default: Date.now }
  }],
  description: String,
  tags: [String],
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  menu: [{
    name: String,
    price: Number,
    category: String,
    description: String,
    image: String,
    isCommunityAdded: { type: Boolean, default: false },
    addedBy: String
  }],
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userAvatar: String,
    rating: Number,
    text: String,
    date: String,
    createdAt: { type: Date, default: Date.now }
  }],
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
  discount: String,
  discountLabel: String,
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
   Redemption Schema
============================== */
const redemptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: "Deal", required: true },
  claimedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});
redemptionSchema.index({ userId: 1, dealId: 1 }, { unique: true });
const Redemption = mongoose.model("Redemption", redemptionSchema);

mongoose.connection.once("open", async () => {
  await Deal.syncIndexes();
  await Redemption.syncIndexes();
  console.log("🏷️ Deal + Redemption Indexes Synced");
});

/* ==============================
   Favorite Schema
   Stores user details + cafe details together
============================== */
const favoriteSchema = new mongoose.Schema({
  user: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true }
  },
  cafe: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Cafe", required: true },
    name: { type: String, required: true },
    address: { type: String },
    photo: { type: String },
    cuisine: { type: String },
    rating: { type: Number },
    distance: { type: String }
  },
  savedAt: { type: Date, default: Date.now }
});
// One favorite per user per cafe
favoriteSchema.index({ "user.id": 1, "cafe.id": 1 }, { unique: true });
const Favorite = mongoose.model("Favorite", favoriteSchema);

mongoose.connection.once("open", async () => {
  await Favorite.syncIndexes();
  console.log("❤️ Favorites Index Synced");
});

/* ==============================
   POST /api/favorites/toggle
   Add or remove a favorite
============================== */
app.post("/api/favorites/toggle", async (req, res) => {
  try {
    const { userId, userName, userEmail, cafe } = req.body;
    if (!userId || !cafe?.id) return res.status(400).json({ error: "userId and cafe.id required" });

    const existing = await Favorite.findOne({ "user.id": userId, "cafe.id": cafe.id });

    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.json({ favorited: false, message: "Removed from favorites" });
    }

    await Favorite.create({
      user: { id: userId, name: userName, email: userEmail },
      cafe: {
        id: cafe.id,
        name: cafe.name,
        address: cafe.address,
        photo: cafe.photo,
        cuisine: cafe.cuisine,
        rating: cafe.rating,
        distance: cafe.distance
      }
    });

    res.json({ favorited: true, message: "Added to favorites" });
  } catch (err) {
    console.error("❌ Toggle favorite error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   GET /api/favorites/:userId
   Get all favorites for a user
============================== */
app.get("/api/favorites/:userId", async (req, res) => {
  try {
    const favorites = await Favorite.find({ "user.id": req.params.userId }).sort({ savedAt: -1 });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   GET /api/favorites/:userId/ids
   Get just cafe IDs favorited by a user (for heart icon state)
============================== */
app.get("/api/favorites/:userId/ids", async (req, res) => {
  try {
    const favorites = await Favorite.find({ "user.id": req.params.userId }).select("cafe.id");
    const ids = favorites.map(f => f.cafe.id.toString());
    res.json(ids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   Seed Deals
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
    res.json({ message: "✅ Deals seeded!", count: sampleDeals.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   GET /api/deals/nearby
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
          $maxDistance: 100000
        }
      }
    }).limit(20);

    let claimedDealIds = new Set();
    let redemptionMap = {};

    if (userId) {
      const redemptions = await Redemption.find({ userId });
      redemptions.forEach(r => {
        claimedDealIds.add(r.dealId.toString());
        redemptionMap[r.dealId.toString()] = { claimedAt: r.claimedAt, expiresAt: r.expiresAt };
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
        claimed: isClaimed,
        expired: isExpired,
        claimedAt: redemption?.claimedAt || null,
        expiresAt: redemption?.expiresAt || null
      };
    }).sort((a, b) => b.score - a.score);

    res.json(scored);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   POST /api/deals/:id/redeem
============================== */
app.post("/api/deals/:id/redeem", async (req, res) => {
  try {
    const { userId } = req.body;
    const dealId = req.params.id;
    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    if (deal.usedCount >= deal.maxUses) return res.status(400).json({ error: "Deal fully redeemed" });

    // Practical 15-minute barista redemption window
    const REDEEM_WINDOW_MS = 15 * 60 * 1000;
    const pin = deal.code ? `${deal.code.slice(0, 3)}-${(deal._id.toString().slice(-4)).toUpperCase()}` : "CF-2026";

    if (userId) {
      const existing = await Redemption.findOne({ userId, dealId });
      if (existing) {
        const secondsLeft = Math.max(Math.floor((new Date(existing.expiresAt) - new Date()) / 1000), 0);
        return res.json({
          success: true,
          alreadyClaimed: true,
          claimedAt: existing.claimedAt,
          expiresAt: existing.expiresAt,
          secondsLeft,
          code: deal.code,
          verificationPin: pin
        });
      }
      const claimedAt = new Date();
      const expiresAt = new Date(claimedAt.getTime() + REDEEM_WINDOW_MS);
      await Redemption.create({ userId, dealId, claimedAt, expiresAt });
      deal.usedCount += 1;
      await deal.save();
      return res.json({
        success: true,
        alreadyClaimed: false,
        claimedAt,
        expiresAt,
        secondsLeft: 900,
        remaining: deal.maxUses - deal.usedCount,
        code: deal.code,
        verificationPin: pin
      });
    }

    deal.usedCount += 1;
    await deal.save();
    res.json({
      success: true,
      alreadyClaimed: false,
      secondsLeft: 900,
      remaining: deal.maxUses - deal.usedCount,
      code: deal.code,
      verificationPin: pin
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   GET /api/deals/my-redemptions/:userId
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
   Geocode Location
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
  return { lat: parseFloat(response.data[0].lat), lon: parseFloat(response.data[0].lon), displayName: response.data[0].display_name };
}

/* ==============================
   Fetch Cafes from OSM
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
   Dynamic Menu Generator
============================== */
function generateDynamicMenu(cuisine = "", cafeName = "", index = 0) {
  const isBakery = (cuisine || "").toLowerCase().includes("bake") || (cafeName || "").toLowerCase().includes("bake");
  const isBrunch = (cuisine || "").toLowerCase().includes("brunch") || (cafeName || "").toLowerCase().includes("bistro");

  const coffeeItems = [
    { name: "Single Origin Espresso", price: 140, category: "Hot Brews", description: "Rich double shot with caramel crema and balanced chocolate notes", image: "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg" },
    { name: "Velvet Cappuccino", price: 190, category: "Hot Brews", description: "Steamed textured whole milk over dark espresso roast", image: "https://images.pexels.com/photos/29951/pexels-photo-29951.jpg" },
    { name: "Vanilla Bean Oat Latte", price: 230, category: "Hot Brews", description: "Smooth espresso paired with creamy oat milk and organic vanilla", image: "https://images.pexels.com/photos/461064/pexels-photo-461064.jpeg" },
    { name: "Signature 18-hr Cold Brew", price: 220, category: "Cold Refreshers", description: "Slow steeped for a naturally sweet, low-acidity refreshing profile", image: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg" },
    { name: "Iced Caramel Cloud Macchiato", price: 250, category: "Cold Refreshers", description: "Layered espresso with cold foam and golden caramel drizzle", image: "https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg" },
  ];

  const bakeryItems = [
    { name: "French Butter Croissant", price: 160, category: "Bakery & Desserts", description: "Golden, freshly baked 24-layer flaky pastry", image: "https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg" },
    { name: "Dark Chocolate Babka", price: 210, category: "Bakery & Desserts", description: "Braided brioche infused with 70% dark Belgian cocoa", image: "https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg" },
    { name: "Warm Blueberry Crumble Muffin", price: 180, category: "Bakery & Desserts", description: "Packed with wild blueberries and topped with spiced crumble", image: "https://images.pexels.com/photos/757520/pexels-photo-757520.jpeg" },
  ];

  const savoryItems = [
    { name: "Avocado & Feta Sourdough", price: 290, category: "Gourmet Bites", description: "Hass avocado, cherry tomatoes, and microgreens on toasted sourdough", image: "https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg" },
    { name: "Grilled Pesto & Mozzarella Panini", price: 270, category: "Gourmet Bites", description: "Sun-dried tomatoes, basil pesto, and molten fresh mozzarella", image: "https://images.pexels.com/photos/1603901/pexels-photo-1603901.jpeg" },
  ];

  if (isBakery) {
    return [...bakeryItems, ...coffeeItems.slice(0, 3), savoryItems[0]];
  }
  if (isBrunch) {
    return [...savoryItems, ...coffeeItems.slice(0, 3), bakeryItems[0]];
  }
  return [...coffeeItems, ...bakeryItems.slice(0, 2), ...savoryItems];
}

/* ==============================
   Dynamic Initial Reviews
============================== */
function generateInitialReviews(cafeName = "", cuisine = "", index = 0) {
  const reviewerPool = [
    { name: "Aarav Sharma", rating: 5, comment: "Top-notch specialty roast! High-speed WiFi and plenty of laptop plug points." },
    { name: "Pooja Mehta", rating: 5, comment: "Cozy aesthetic, lovely playlist, and their freshly baked croissants are fantastic." },
    { name: "Rohan Varma", rating: 4, comment: "Great spot for afternoon study sessions. The cold brew is solid and staff is super welcoming." },
    { name: "Ananya Desai", rating: 5, comment: "One of my go-to cafes in the area. Peaceful seating and consistent quality." },
    { name: "Kabir Sengupta", rating: 4, comment: "Good ambiance, outdoor seating is very relaxing around sunset. Recommended!" }
  ];

  const shift = (index || 0) % reviewerPool.length;
  const selected = [
    reviewerPool[shift % reviewerPool.length],
    reviewerPool[(shift + 1) % reviewerPool.length],
    reviewerPool[(shift + 2) % reviewerPool.length],
  ];

  return selected.map((rev, i) => ({
    userName: rev.name,
    userAvatar: "",
    rating: rev.rating,
    text: rev.comment,
    date: `${(i + 1) * 2} days ago`,
    createdAt: new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000)
  }));
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

  const cafeName = tags.name || "Local Cafe";
  const cuisineType = tags.cuisine || "Coffee & Snacks";
  const initialMenu = generateDynamicMenu(cuisineType, cafeName, index);
  const initialReviews = generateInitialReviews(cafeName, cuisineType, index);
  const avgRating = Math.round((initialReviews.reduce((sum, r) => sum + r.rating, 0) / initialReviews.length) * 10) / 10;

  return {
    osmId: osmElement.id,
    name: cafeName,
    location: { type: "Point", coordinates: [lon, lat] },
    address: tags["addr:street"]
      ? `${tags["addr:housenumber"] || ""} ${tags["addr:street"]}`.trim()
      : tags["addr:city"] || "Address not available",
    phone: tags.phone || tags["contact:phone"] || "Not available",
    website: tags.website || tags["contact:website"] || "",
    menuUrl: tags.menu || tags["contact:menu"] || tags.website || tags["contact:website"] || "",
    openingHours: tags.opening_hours || "Hours vary",
    cuisine: cuisineType,
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
    menuPhotos: [],
    description: descriptions[index % descriptions.length],
    tags: amenityTags,
    rating: avgRating,
    reviewCount: initialReviews.length + 18,
    menu: initialMenu,
    reviews: initialReviews
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

    let needsSave = false;
    if (!cafe.menu || cafe.menu.length === 0) {
      cafe.menu = generateDynamicMenu(cafe.cuisine, cafe.name, 1);
      needsSave = true;
    }
    if (!cafe.reviews || cafe.reviews.length === 0) {
      cafe.reviews = generateInitialReviews(cafe.name, cafe.cuisine, 1);
      const avg = Math.round((cafe.reviews.reduce((s, r) => s + r.rating, 0) / cafe.reviews.length) * 10) / 10;
      cafe.rating = avg;
      cafe.reviewCount = cafe.reviews.length + 15;
      needsSave = true;
    }
    if (!cafe.menuPhotos) {
      cafe.menuPhotos = [];
      needsSave = true;
    }
    if (!cafe.menuUrl && cafe.website) {
      cafe.menuUrl = cafe.website;
      needsSave = true;
    }

    if (needsSave) {
      await cafe.save();
    }

    res.json(cafe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==============================
   Post Review for a Cafe
============================== */
app.post("/api/cafes/:id/reviews", async (req, res) => {
  try {
    const { userId, userName, userAvatar, rating, text } = req.body;
    if (!rating || !text) return res.status(400).json({ error: "Rating and review text are required" });

    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) return res.status(404).json({ error: "Cafe not found" });

    const reviewObj = {
      userId: userId || null,
      userName: userName || "Coffee Lover",
      userAvatar: userAvatar || "",
      rating: Math.min(5, Math.max(1, Number(rating))),
      text: text.trim(),
      date: "Just now",
      createdAt: new Date()
    };

    if (!Array.isArray(cafe.reviews)) cafe.reviews = [];
    cafe.reviews.unshift(reviewObj);

    const sum = cafe.reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    cafe.rating = Math.round((sum / cafe.reviews.length) * 10) / 10;
    cafe.reviewCount = cafe.reviews.length + 15;
    await cafe.save();

    if (userId) {
      await User.findByIdAndUpdate(userId, { $inc: { reviews: 1 } });
    }

    res.json({ message: "Review posted successfully", cafe });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==============================
   Crowdsourced Menu & Menu Photo Upload
   (Similar to Google Maps "Add Menu Photo / Dish")
============================== */
app.post("/api/cafes/:id/menu", async (req, res) => {
  try {
    const { type, item, photo } = req.body;
    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) return res.status(404).json({ error: "Cafe not found" });

    if (type === "photo") {
      const photoPayload = photo || req.body;
      if (!photoPayload.url) {
        return res.status(400).json({ error: "Photo URL or image data is required" });
      }

      const newMenuPhoto = {
        url: photoPayload.url,
        caption: photoPayload.caption?.trim() || "Menu photo",
        uploadedBy: photoPayload.uploadedBy?.trim() || "Community Contributor",
        createdAt: new Date()
      };

      if (!Array.isArray(cafe.menuPhotos)) cafe.menuPhotos = [];
      cafe.menuPhotos.unshift(newMenuPhoto);

      // Also append to cafe general photos gallery
      if (Array.isArray(cafe.photos)) {
        cafe.photos.unshift(photoPayload.url);
      }

      await cafe.save();
      return res.json({ message: "Menu photo uploaded successfully", cafe });
    }

    // Default: Add a dish / drink
    const dish = item || req.body;
    if (!dish.name || !dish.price) {
      return res.status(400).json({ error: "Dish name and price are required" });
    }

    const newItem = {
      name: dish.name.trim(),
      price: Math.max(1, Number(dish.price)),
      category: dish.category?.trim() || "Specialty Coffee",
      description: dish.description?.trim() || "Community recommended item",
      image: dish.image?.trim() || "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg",
      isCommunityAdded: true,
      addedBy: dish.addedBy?.trim() || "Community Contributor"
    };

    if (!Array.isArray(cafe.menu)) cafe.menu = [];
    cafe.menu.unshift(newItem);
    await cafe.save();

    res.json({ message: "Dish added to menu successfully", cafe });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==============================
   Update Official Menu URL
============================== */
app.patch("/api/cafes/:id/menu-url", async (req, res) => {
  try {
    const { menuUrl } = req.body;
    if (!menuUrl) return res.status(400).json({ error: "menuUrl is required" });

    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) return res.status(404).json({ error: "Cafe not found" });

    cafe.menuUrl = menuUrl.trim();
    await cafe.save();

    res.json({ message: "Official menu link updated successfully", cafe });
  } catch (error) {
    res.status(500).json({ error: error.message });
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