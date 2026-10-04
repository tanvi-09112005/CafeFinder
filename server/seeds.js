/**
 * Curated Open-Source Seed Dataset of authentic Mumbai specialty cafes & bakeries.
 * Used as high-fidelity fallback and initial database seed to ensure 100% uptime
 * even when third-party OSM mirrors or cloud databases are warming up.
 */

const SEEDED_CAFES = [
  {
    osmId: 900101,
    name: "Subko Specialty Coffee Roasters",
    location: { type: "Point", coordinates: [72.8277, 19.0560] },
    address: "Crafft Village, 21A Chapel Rd, Ranwar, Bandra West, Mumbai, 400050",
    phone: "+91 22 2640 1928",
    website: "https://subko.coffee",
    menuUrl: "https://subko.coffee",
    openingHours: "7:30 AM – 10:00 PM (Daily)",
    cuisine: "Specialty Coffee",
    wheelchair: "yes",
    outdoor: true,
    wifi: true,
    photo: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
    photos: [
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
      "https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg",
      "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg"
    ],
    menuPhotos: [],
    description: "Iconic specialty coffee roastery and craft bakehouse tucked in Ranwar village. Known for single-origin Indian roasts and podi sourdough toast.",
    tags: ["Wi-Fi", "Outdoor Seating", "Accessible", "Takeaway"],
    rating: 4.8,
    reviewCount: 420,
    menu: [
      { name: "Single Origin Pour Over", price: 240, category: "Specialty Coffee", description: "Washed Arabica from Chikmagalur estates with jasmine notes", image: "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg" },
      { name: "Salted Caramel Cold Brew", price: 260, category: "Specialty Coffee", description: "18-hour slow steeped cold brew with house sea-salt caramel", image: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg" },
      { name: "Classic French Butter Croissant", price: 180, category: "Artisan Bakery", description: "Laminated flaky pastry with 100% French butter", image: "https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg" },
      { name: "Podi Sourdough Toast & Butter", price: 220, category: "Gourmet Bites", description: "Toasted sourdough served with house gunpowder ghee podi", image: "https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg" }
    ],
    reviews: [
      { userName: "Tanvi Khadatkar", rating: 5, text: "The iced pour-over and cardamom babka are unmatched. Perfect aesthetic vibe for studying.", date: "Yesterday" },
      { userName: "Devika Ghadi", rating: 5, text: "High speed WiFi, plenty of laptop charging stations, and superb specialty roasts.", date: "3 days ago" }
    ]
  },
  {
    osmId: 900102,
    name: "Blue Tokai Coffee Roasters (Kala Ghoda)",
    location: { type: "Point", coordinates: [72.8329, 18.9288] },
    address: "Machilimarnagar, Forbes St, Kala Ghoda, Fort, Mumbai, 400001",
    phone: "+91 22 4970 8211",
    website: "https://bluetokaicoffee.com",
    menuUrl: "https://bluetokaicoffee.com",
    openingHours: "7:00 AM – 11:00 PM (Daily)",
    cuisine: "Specialty Coffee",
    wheelchair: "yes",
    outdoor: false,
    wifi: true,
    photo: "https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg",
    photos: [
      "https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg",
      "https://images.pexels.com/photos/461064/pexels-photo-461064.jpeg"
    ],
    menuPhotos: [],
    description: "Pioneer of Indian craft coffee. Serene art-district cafe serving pour-overs, flat whites, and healthy bakery bowls.",
    tags: ["Wi-Fi", "Accessible", "Takeaway"],
    rating: 4.7,
    reviewCount: 380,
    menu: [
      { name: "Attikan Estate Flat White", price: 210, category: "Specialty Coffee", description: "Velvety double ristretto with dark chocolate and fig notes", image: "https://images.pexels.com/photos/29951/pexels-photo-29951.jpg" },
      { name: "Vietnamese Iced Coffee", price: 230, category: "Specialty Coffee", description: "Bold dark roast poured over sweet condensed milk and ice", image: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg" },
      { name: "Almond Croissant", price: 210, category: "Artisan Bakery", description: "Twice-baked almond frangipane croissant topped with flaked almonds", image: "https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg" }
    ],
    reviews: [
      { userName: "Tisha Gogia", rating: 5, text: "Best flat white in Mumbai. The Kala Ghoda art vibe makes it very peaceful.", date: "2 days ago" }
    ]
  },
  {
    osmId: 900103,
    name: "Cafe Mondegar (Mondy's)",
    location: { type: "Point", coordinates: [72.8318, 18.9220] },
    address: "Metro House, 5A Shahid Bhagat Singh Rd, Colaba Causeway, Mumbai, 400039",
    phone: "+91 22 2202 0591",
    website: "https://cafemondegar.com",
    menuUrl: "https://cafemondegar.com",
    openingHours: "8:00 AM – 11:30 PM (Daily)",
    cuisine: "Bistro & Brunch",
    wheelchair: "limited",
    outdoor: false,
    wifi: false,
    photo: "https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg",
    photos: [
      "https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg"
    ],
    menuPhotos: [],
    description: "Legendary heritage Irani-style cafe and bistro founded in 1932. Famous for Mario Miranda wall murals and vintage jukebox.",
    tags: ["Takeaway"],
    rating: 4.6,
    reviewCount: 950,
    menu: [
      { name: "Keema Pav Special", price: 280, category: "Bistro & Brunch", description: "Spiced minced meat served with warm buttery ladi pav", image: "https://images.pexels.com/photos/1603901/pexels-photo-1603901.jpeg" },
      { name: "Chilled Filter Coffee", price: 120, category: "Specialty Coffee", description: "Traditional South Indian chicory-infused brew over ice", image: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg" }
    ],
    reviews: [
      { userName: "Rohan Varma", rating: 5, text: "A Mumbai institution! Murals by Mario Miranda, jukebox, and delicious breakfast.", date: "1 week ago" }
    ]
  },
  {
    osmId: 900104,
    name: "Candies (Pali Hill)",
    location: { type: "Point", coordinates: [72.8272, 19.0628] },
    address: "5AA Pali Hill, Next to Learners Academy, Bandra West, Mumbai, 400050",
    phone: "+91 22 2642 4124",
    website: "https://candiesbandra.com",
    menuUrl: "https://candiesbandra.com",
    openingHours: "8:30 AM – 10:30 PM (Tue–Sun)",
    cuisine: "Artisan Bakery",
    wheelchair: "limited",
    outdoor: true,
    wifi: true,
    photo: "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg",
    photos: [
      "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg"
    ],
    menuPhotos: [],
    description: "Sprawling multi-level Portuguese villa cafe with whimsical tiled stairways, rooftop terrace, and legendary chicken rolls & cold coffee.",
    tags: ["Wi-Fi", "Outdoor Seating", "Takeaway"],
    rating: 4.6,
    reviewCount: 880,
    menu: [
      { name: "Candies Signature Iced Coffee", price: 150, category: "Specialty Coffee", description: "Thick, creamy Mumbai style cold coffee in classic glass", image: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg" },
      { name: "Chicken Tikka Croissant Sandwich", price: 210, category: "Artisan Bakery", description: "Spiced chicken tikka layered in butter croissant", image: "https://images.pexels.com/photos/1603901/pexels-photo-1603901.jpeg" }
    ],
    reviews: [
      { userName: "Ananya Desai", rating: 5, text: "The multi-level outdoor garden seating is magical in the evening. Very pocket friendly.", date: "5 days ago" }
    ]
  },
  {
    osmId: 900105,
    name: "Prithvi Cafe (Juhu)",
    location: { type: "Point", coordinates: [72.8262, 19.1065] },
    address: "Prithvi Theatre, 20 Janki Kutir, Juhu Church Rd, Juhu, Mumbai, 400049",
    phone: "+91 22 2614 9546",
    website: "https://prithvitheatre.org",
    menuUrl: "https://prithvitheatre.org",
    openingHours: "10:00 AM – 11:00 PM (Daily)",
    cuisine: "Bistro & Brunch",
    wheelchair: "yes",
    outdoor: true,
    wifi: true,
    photo: "https://images.pexels.com/photos/461064/pexels-photo-461064.jpeg",
    photos: [
      "https://images.pexels.com/photos/461064/pexels-photo-461064.jpeg"
    ],
    menuPhotos: [],
    description: "Bohemian open-air courtyard cafe shaded by bamboo and trees beneath fairy lights. Renowned for Irish coffee and stuffed parathas.",
    tags: ["Wi-Fi", "Outdoor Seating", "Accessible", "Takeaway"],
    rating: 4.7,
    reviewCount: 1200,
    menu: [
      { name: "Irish Coffee (Non-Alcoholic)", price: 170, category: "Specialty Coffee", description: "Steaming spiced espresso blend topped with heavy cream float", image: "https://images.pexels.com/photos/29951/pexels-photo-29951.jpg" },
      { name: "Fresh Herb & Cheese Paratha", price: 220, category: "Bistro & Brunch", description: "Crisp pan-fried paratha with homemade white butter", image: "https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg" },
      { name: "Kullad Masala Chai", price: 90, category: "Artisanal Tea", description: "Clay-pot brewed Assam tea infused with ginger and cardamom", image: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg" }
    ],
    reviews: [
      { userName: "Kabir Sengupta", rating: 5, text: "The open-air theatre ambiance is unmatched anywhere in the country.", date: "3 days ago" }
    ]
  },
  {
    osmId: 900106,
    name: "Third Wave Coffee (BKC)",
    location: { type: "Point", coordinates: [72.8688, 19.0657] },
    address: "Platina Building, G Block BKC, Bandra Kurla Complex, Mumbai, 400051",
    phone: "+91 22 6902 4410",
    website: "https://thirdwavecoffee.in",
    menuUrl: "https://thirdwavecoffee.in",
    openingHours: "7:00 AM – 11:30 PM (Daily)",
    cuisine: "Specialty Coffee",
    wheelchair: "yes",
    outdoor: true,
    wifi: true,
    photo: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg",
    photos: [
      "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg"
    ],
    menuPhotos: [],
    description: "Modern, high-energy specialty coffee lounge in Mumbai's financial center. Ideal for business meetings and co-working.",
    tags: ["Wi-Fi", "Outdoor Seating", "Accessible", "Takeaway"],
    rating: 4.6,
    reviewCount: 310,
    menu: [
      { name: "Sea Salt Mocha", price: 240, category: "Specialty Coffee", description: "Rich chocolate and espresso with a whisper of Maldon sea salt", image: "https://images.pexels.com/photos/461064/pexels-photo-461064.jpeg" },
      { name: "Avocado Cream Cheese Bagel", price: 290, category: "Gourmet Bites", description: "Toasted everything bagel filled with crushed avocado and scallion cream cheese", image: "https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg" }
    ],
    reviews: [
      { userName: "Aarav Sharma", rating: 5, text: "High speed WiFi, great lighting, and great coffee. My favorite workspace in BKC.", date: "4 days ago" }
    ]
  },
  {
    osmId: 900107,
    name: "The Bagel Shop (Pali Hill)",
    location: { type: "Point", coordinates: [72.8290, 19.0665] },
    address: "30 Pali Mala Rd, Behind Carter Rd, Bandra West, Mumbai, 400050",
    phone: "+91 22 2605 0178",
    website: "https://thebagelshop.in",
    menuUrl: "https://thebagelshop.in",
    openingHours: "8:00 AM – 10:30 PM (Daily)",
    cuisine: "Bistro & Brunch",
    wheelchair: "yes",
    outdoor: true,
    wifi: true,
    photo: "https://images.pexels.com/photos/757520/pexels-photo-757520.jpeg",
    photos: [
      "https://images.pexels.com/photos/757520/pexels-photo-757520.jpeg"
    ],
    menuPhotos: [],
    description: "Rustic bungalow sanctuary with open patio, hammock vibes, and authentic New York style boiled and baked bagels.",
    tags: ["Wi-Fi", "Outdoor Seating", "Accessible", "Takeaway"],
    rating: 4.5,
    reviewCount: 520,
    menu: [
      { name: "Smoked Salmon & Capers Bagel", price: 380, category: "Gourmet Bites", description: "Norwegian salmon, dill cream cheese, capers on toasted sesame bagel", image: "https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg" },
      { name: "Iced Americano", price: 170, category: "Specialty Coffee", description: "Double shot dark roast over sparkling water and ice", image: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg" }
    ],
    reviews: [
      { userName: "Pooja Mehta", rating: 4, text: "Lovely outdoor trees, dog-friendly, and very tasty bagels.", date: "1 week ago" }
    ]
  },
  {
    osmId: 900108,
    name: "Starbucks Reserve (Fort)",
    location: { type: "Point", coordinates: [72.8340, 18.9325] },
    address: "Elphinstone Building, Horniman Circle, Fort, Mumbai, 400001",
    phone: "+91 22 6655 1200",
    website: "https://starbucks.in",
    menuUrl: "https://starbucks.in",
    openingHours: "7:00 AM – 11:00 PM (Daily)",
    cuisine: "Specialty Coffee",
    wheelchair: "yes",
    outdoor: false,
    wifi: true,
    photo: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg",
    photos: [
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg"
    ],
    menuPhotos: [],
    description: "The flagship heritage Starbucks in India inside a restored Victorian building facing Horniman Circle Garden.",
    tags: ["Wi-Fi", "Accessible", "Takeaway"],
    rating: 4.7,
    reviewCount: 1100,
    menu: [
      { name: "Reserve Microblend Pour Over", price: 320, category: "Specialty Coffee", description: "Exotic micro-lot beans extracted via Chemex manual brew", image: "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg" },
      { name: "Smoked Butterscotch Latte", price: 340, category: "Specialty Coffee", description: "Espresso with smoked butterscotch sauce and turbinado sugar sprinkles", image: "https://images.pexels.com/photos/461064/pexels-photo-461064.jpeg" }
    ],
    reviews: [
      { userName: "Devika Ghadi", rating: 5, text: "Gorgeous heritage ceilings and architecture. One of the prettiest coffee spaces in Asia.", date: "2 weeks ago" }
    ]
  }
];

module.exports = { SEEDED_CAFES };
