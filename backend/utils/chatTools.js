import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const CHAT_CATEGORIES = [
  "Backpacks",
  "Handbags",
  "Sling Bags",
  "Tote Bags",
  "Office Bags",
  "Travel & Luggage",
  "Duffle Bags",
  "Wallets",
  "Accessories",
];

/**
 * OpenAI-compatible function-calling schema (OpenRouter uses the same
 * shape). track_order is only offered to logged-in customers — a guest
 * session simply never sees that tool exists.
 *
 * Note there is deliberately NO tool that generates an image directly. The
 * model can only *suggest* one via suggest_bag_image; actually spending
 * money on a generation always requires one further explicit click from the
 * customer, on a separate rate-limited endpoint. An LLM autonomously
 * triggering a paid action from a loosely-interpreted request is exactly
 * the failure mode this avoids.
 */
export const buildToolDefinitions = ({ isAuthenticated }) => {
  const tools = [
    {
      type: "function",
      function: {
        name: "search_products",
        description:
          "Search TeenRaah's real product catalog of bags and travel gear. Always call this before recommending or describing specific products, prices, or stock — never invent them.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Free-text search, e.g. 'waterproof backpack for laptop'" },
            category: { type: "string", enum: CHAT_CATEGORIES },
            maxPrice: { type: "number", description: "Maximum price in INR" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_categories",
        description: "List the product categories TeenRaah currently sells.",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "suggest_bag_image",
        description:
          "Call this when the customer describes a custom bag/gear concept they want to SEE (e.g. 'what would a rose gold weekend duffle look like'). This does not generate anything itself — it offers the customer a button to generate a concept image if they choose to spend a generation on it. ONLY for bags, backpacks, luggage, wallets, or travel/outdoor gear. Never call this for anything else, and don't call it unless the customer described an actual visual concept.",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", enum: CHAT_CATEGORIES },
            description: { type: "string", description: "A short product-photography-style description of the concept" },
          },
          required: ["category", "description"],
        },
      },
    },
  ];

  if (isAuthenticated) {
    tools.push({
      type: "function",
      function: {
        name: "track_order",
        description: "Look up the status of the logged-in customer's own orders. Never returns another customer's data.",
        parameters: {
          type: "object",
          properties: { orderNumber: { type: "string", description: "Optional — a specific order number to look up" } },
        },
      },
    });
  }

  return tools;
};

const summarizeProduct = (p) => ({
  name: p.name,
  slug: p.slug,
  category: p.category,
  price: p.price,
  mrp: p.mrp,
  image: p.images[0]?.url,
  inStock: p.stock > 0,
});

/** Executes one resolved tool call server-side. `userId` is only ever the
 * currently-authenticated user — there is no way for a tool argument to
 * make this look up someone else's orders. */
export const executeToolCall = async (name, args = {}, { userId } = {}) => {
  switch (name) {
    case "search_products": {
      const query = { isActive: true };
      if (args.category) query.category = args.category;
      if (args.maxPrice) query.price = { $lte: Number(args.maxPrice) };
      if (args.query) query.$text = { $search: String(args.query) };
      const products = await Product.find(query).limit(5);
      return { products: products.map(summarizeProduct) };
    }

    case "get_categories": {
      const categories = await Product.distinct("category", { isActive: true });
      return { categories };
    }

    case "suggest_bag_image": {
      if (!CHAT_CATEGORIES.includes(args.category)) {
        return { error: "Not a recognized bag/gear category" };
      }
      // Echoed straight back to the frontend as a structured suggestion —
      // see chatController.js. No cost is incurred here.
      return { suggested: true, category: args.category, description: String(args.description || "").slice(0, 300) };
    }

    case "track_order": {
      if (!userId) return { error: "The customer is not logged in — tell them to sign in to check order status." };
      const query = { user: userId };
      if (args.orderNumber) query.orderNumber = args.orderNumber;
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .limit(args.orderNumber ? 1 : 3);
      return {
        orders: orders.map((o) => ({
          orderNumber: o.orderNumber,
          status: o.status,
          totalAmount: o.totalAmount,
          estimatedDelivery: o.estimatedDelivery,
          placedOn: o.createdAt,
          itemCount: o.items.length,
        })),
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
};
