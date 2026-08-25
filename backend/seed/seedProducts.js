// Run once with: npm run seed:products
// Populates a handful of demo bags so the storefront isn't empty on first
// run. Uses stable placeholder photos (picsum.photos) — swap these for real
// product photography through the admin panel (Cloudinary) whenever ready.
import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";

dotenv.config();

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

const img = (seed) => ({
  url: `https://picsum.photos/seed/${seed}/900/1000`,
  publicId: `seed/${seed}`,
});

const demoProducts = [
  {
    name: "Trailmark Daypack",
    category: "Backpacks",
    price: 1799,
    mrp: 2999,
    colors: ["Charcoal", "Olive"],
    material: "Water-resistant Ripstop Nylon",
    capacityLitres: 22,
    stock: 40,
    tags: ["bestseller", "college", "everyday"],
    isFeatured: true,
    description:
      "A 22L everyday backpack built for the daily grind — padded 15\" laptop sleeve, a quick-access front pocket, and a contoured back panel that stays comfortable from the first commute to the last errand.",
    images: [img("trailmark-daypack-1"), img("trailmark-daypack-2")],
  },
  {
    name: "Summit Ridge Travel Backpack",
    category: "Backpacks",
    price: 2999,
    mrp: 4499,
    colors: ["Black", "Rust"],
    material: "600D Polyester",
    capacityLitres: 40,
    stock: 25,
    tags: ["travel", "new"],
    isFeatured: true,
    saleEndsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    description:
      "A 40L flight-friendly travel backpack with a clamshell opening that lays flat like a suitcase, a hideaway hip belt, and compression straps to keep the load close and steady.",
    images: [img("summit-ridge-1"), img("summit-ridge-2")],
  },
  {
    name: "Waymark Sling Bag",
    category: "Sling Bags",
    price: 899,
    mrp: 1499,
    colors: ["Sand", "Black"],
    material: "Canvas & Vegan Leather Trim",
    stock: 60,
    tags: ["everyday", "bestseller"],
    isFeatured: true,
    description:
      "A compact crossbody sling with just enough room for a phone, cards, and keys — worn front or back, with an adjustable strap for either.",
    images: [img("waymark-sling-1"), img("waymark-sling-2")],
  },
  {
    name: "Compass Tote",
    category: "Tote Bags",
    price: 1299,
    mrp: 1899,
    colors: ["Ivory", "Terracotta"],
    material: "Heavy Canvas",
    stock: 35,
    tags: ["everyday", "college"],
    description:
      "An oversized tote with a flat base that stands on its own, a zip-top to keep things secure, and an internal pocket for the small stuff.",
    images: [img("compass-tote-1"), img("compass-tote-2")],
  },
  {
    name: "Pathfinder Office Bag",
    category: "Office Bags",
    price: 2499,
    mrp: 3499,
    colors: ["Espresso"],
    material: "Vegan Leather",
    stock: 20,
    tags: ["office", "laptop"],
    isFeatured: true,
    description:
      "A structured 15.6\" laptop bag with a dedicated document sleeve and a trolley strap for the days you're heading straight to the airport after work.",
    images: [img("pathfinder-office-1"), img("pathfinder-office-2")],
  },
  {
    name: "Basecamp Duffle 45L",
    category: "Duffle Bags",
    price: 2199,
    mrp: 3199,
    colors: ["Black", "Forest"],
    material: "Water-resistant Canvas",
    capacityLitres: 45,
    stock: 18,
    tags: ["travel", "gym"],
    description:
      "A weekend-ready duffle with a separate shoe compartment and reinforced handles that don't dig in, even fully packed.",
    images: [img("basecamp-duffle-1"), img("basecamp-duffle-2")],
  },
  {
    name: "Northline Hard Luggage (Cabin)",
    category: "Travel & Luggage",
    price: 3499,
    mrp: 5499,
    colors: ["Slate Blue", "Black"],
    material: "Polycarbonate Shell",
    stock: 15,
    tags: ["travel", "new"],
    saleEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    description:
      "A cabin-size hard-shell suitcase on 360° spinner wheels, with a TSA-approved lock and an expandable zip for the trip back home.",
    images: [img("northline-luggage-1"), img("northline-luggage-2")],
  },
  {
    name: "Kutch Weave Handbag",
    category: "Handbags",
    price: 1649,
    mrp: 2299,
    colors: ["Multicolour"],
    material: "Handwoven Cotton & Vegan Leather",
    stock: 22,
    tags: ["handcrafted", "gifting"],
    isFeatured: true,
    description:
      "A structured handbag finished with hand-woven panels from Kutch artisans — no two are ever quite the same.",
    images: [img("kutch-handbag-1"), img("kutch-handbag-2")],
  },
  {
    name: "Ledger Bifold Wallet",
    category: "Wallets",
    price: 599,
    mrp: 899,
    colors: ["Tan", "Black"],
    material: "Vegan Leather",
    stock: 80,
    tags: ["everyday", "gifting"],
    description: "A slim bifold with six card slots and a coin pocket that actually closes flat.",
    images: [img("ledger-wallet-1"), img("ledger-wallet-2")],
  },
  {
    name: "Basecamp Mini Fanny Pack",
    category: "Accessories",
    price: 549,
    mrp: 899,
    colors: ["Black", "Olive"],
    material: "Ripstop Nylon",
    stock: 50,
    tags: ["festival", "travel"],
    description: "Hands-free carry for festival days and city walks — fits a phone, cash, and a lip balm, nothing more, nothing less.",
    images: [img("fanny-pack-1"), img("fanny-pack-2")],
  },
];

const run = async () => {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes("your_mongodb")) {
    console.error("❌ Set a real MONGO_URI in backend/.env before seeding.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);

  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error("❌ No admin found. Run `npm run seed:admin` first.");
    process.exit(1);
  }

  let created = 0;
  for (const p of demoProducts) {
    const slug = slugify(p.name);
    // eslint-disable-next-line no-await-in-loop
    const exists = await Product.findOne({ slug });
    if (exists) continue;
    // eslint-disable-next-line no-await-in-loop
    await Product.create({ ...p, slug, createdBy: admin._id });
    created += 1;
  }

  console.log(`✅ Seeded ${created} demo products (${demoProducts.length - created} already existed).`);
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Seeding failed:", err.message);
  process.exit(1);
});
