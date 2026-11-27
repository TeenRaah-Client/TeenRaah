import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import {
  buildProductFilterQuery,
  buildProductSort,
  normalizePagination,
} from "../utils/productQuery.js";
import {
  addBusinessDays,
  estimateDeliveryForPincode,
  isValidIndianPincode,
} from "../utils/pincodeServiceability.js";
import {
  normalizeSubscriberEmail,
  validateSubscriberInput,
} from "../utils/subscriberValidation.js";
import { buildOrderInvoiceData } from "../utils/invoiceBuilder.js";

test("buildProductFilterQuery builds safe partial search, price, capacity, color, and stock filters", () => {
  const query = buildProductFilterQuery({
    category: "Backpacks",
    search: "aero (25L)",
    minPrice: "1000",
    maxPrice: "2500",
    minCapacity: "20",
    maxCapacity: "40",
    color: "Black",
    inStock: "true",
    featured: "true",
    tag: "Travel",
  });

  assert.equal(query.isActive, true);
  assert.equal(query.category, "Backpacks");
  assert.equal(query.isFeatured, true);
  assert.deepEqual(query.stock, { $gt: 0 });
  assert.deepEqual(query.price, { $gte: 1000, $lte: 2500 });
  assert.deepEqual(query.capacityLitres, { $gte: 20, $lte: 40 });
  assert.equal(query.tags, "travel");
  assert.equal(query.colors.$regex.test("black"), true);
  assert.equal(Array.isArray(query.$or), true);
  assert.equal(query.$or[0].name.test("Aero (25L) Urban Backpack"), true);
});

test("buildProductSort and normalizePagination guard against invalid inputs", () => {
  assert.deepEqual(buildProductSort("priceLowHigh"), { price: 1, createdAt: -1 });
  assert.deepEqual(buildProductSort("unknown"), { createdAt: -1 });
  assert.deepEqual(normalizePagination("-2", "999", 50), { page: 1, limit: 50, skip: 0 });
  assert.deepEqual(normalizePagination("3", "12", 50), { page: 3, limit: 12, skip: 24 });
});

test("addBusinessDays skips Sundays accurately", () => {
  const saturday = new Date("2026-11-28T06:00:00.000Z"); // Saturday
  const plus2 = addBusinessDays(saturday, 2); // Mon Nov 30, Tue Dec 1
  assert.equal(plus2.toISOString().slice(0, 10), "2026-12-01");
});

test("estimateDeliveryForPincode handles metro, standard, extended, APO, and invalid pincodes", () => {
  const now = new Date("2026-11-28T06:00:00.000Z");

  assert.equal(isValidIndianPincode("400001"), true);
  assert.equal(isValidIndianPincode("000123"), false);
  assert.equal(isValidIndianPincode("40001"), false);

  const mumbai = estimateDeliveryForPincode("400001", { orderAmount: 1499, now });
  assert.equal(mumbai.valid, true);
  assert.equal(mumbai.serviceable, true);
  assert.equal(mumbai.zone, "Metro Express");
  assert.equal(mumbai.minDays, 2);
  assert.equal(mumbai.maxDays, 3);
  assert.equal(mumbai.freeShippingEligible, true);
  assert.equal(mumbai.deliveryFee, 0);

  const jaipur = estimateDeliveryForPincode("302001", { orderAmount: 599, now });
  assert.equal(jaipur.serviceable, true);
  assert.equal(jaipur.zone, "Standard Pan-India");
  assert.equal(jaipur.freeShippingEligible, false);
  assert.equal(jaipur.deliveryFee, 79);

  const assam = estimateDeliveryForPincode("781001", { orderAmount: 1999, now });
  assert.equal(assam.serviceable, true);
  assert.equal(assam.zone, "Extended Delivery");
  assert.equal(assam.minDays, 5);

  const apo = estimateDeliveryForPincode("900056", { orderAmount: 1499, now });
  assert.equal(apo.valid, true);
  assert.equal(apo.serviceable, false);

  const bad = estimateDeliveryForPincode("12AB", { now });
  assert.equal(bad.valid, false);
  assert.equal(bad.serviceable, false);
});

test("validateSubscriberInput normalizes emails and defaults unknown sources", () => {
  assert.equal(normalizeSubscriberEmail("  USER@Example.COM "), "user@example.com");

  const okResult = validateSubscriberInput({ email: "  Buyer@TeenRaah.Shop ", source: "FOOTER" });
  assert.deepEqual(okResult, { valid: true, email: "buyer@teenraah.shop", source: "footer" });

  const unknownSource = validateSubscriberInput({ email: "buyer@example.com", source: "random" });
  assert.equal(unknownSource.valid, true);
  assert.equal(unknownSource.source, "footer");

  const invalid = validateSubscriberInput({ email: "not-an-email" });
  assert.equal(invalid.valid, false);
});

test("buildOrderInvoiceData splits CGST+SGST for Maharashtra and IGST for other states", () => {
  const baseOrder = {
    orderNumber: "TR-2026-0001",
    itemsTotal: 2000,
    discount: 200,
    deliveryFee: 0,
    walletUsed: 100,
    totalAmount: 1700,
    shippingAddress: {
      fullName: "Aarav Sharma",
      phone: "9999999999",
      line1: "12 MG Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    },
    items: [{ name: "Trailmark Daypack", color: "Charcoal", quantity: 1, price: 2000 }],
    payment: { status: "paid", razorpayPaymentId: "pay_test123" },
  };

  const mhInvoice = buildOrderInvoiceData(baseOrder);
  assert.equal(mhInvoice.invoiceNumber, "INV-TR-2026-0001");
  assert.equal(mhInvoice.summary.taxType, "CGST+SGST");
  assert.equal(mhInvoice.summary.igst, 0);
  assert.equal(Number((mhInvoice.summary.cgst + mhInvoice.summary.sgst).toFixed(2)), mhInvoice.summary.totalTax);
  assert.equal(Number((mhInvoice.summary.taxableValue + mhInvoice.summary.totalTax).toFixed(2)), mhInvoice.summary.grossTotal);
  assert.equal(mhInvoice.items[0].hsnCode, "4202");

  const dlInvoice = buildOrderInvoiceData({
    ...baseOrder,
    shippingAddress: { ...baseOrder.shippingAddress, city: "New Delhi", state: "Delhi", pincode: "110001" },
  });
  assert.equal(dlInvoice.summary.taxType, "IGST");
  assert.equal(dlInvoice.summary.cgst, 0);
  assert.equal(dlInvoice.summary.sgst, 0);
  assert.equal(dlInvoice.summary.igst, dlInvoice.summary.totalTax);

  assert.throws(() => buildOrderInvoiceData(null), TypeError);
});

test("HTTP integration: pincode serviceability and subscriber validation endpoints", async () => {
  const app = express();
  app.use(express.json());

  app.get("/api/location/pincode/:pincode", (req, res) => {
    const estimate = estimateDeliveryForPincode(req.params.pincode, { orderAmount: Number(req.query.amount) || 0 });
    if (!estimate.valid) return res.status(400).json({ success: false, message: estimate.message });
    return res.status(200).json({ success: true, estimate });
  });

  app.post("/api/subscribers", (req, res) => {
    const result = validateSubscriberInput(req.body);
    if (!result.valid) return res.status(400).json({ success: false, message: result.error });
    return res.status(201).json({ success: true, subscribed: true, email: result.email, source: result.source });
  });

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const pinOk = await fetch(`${baseUrl}/api/location/pincode/560001?amount=1499`);
    assert.equal(pinOk.status, 200);
    const pinOkBody = await pinOk.json();
    assert.equal(pinOkBody.estimate.zone, "Metro Express");
    assert.equal(pinOkBody.estimate.freeShippingEligible, true);

    const pinBad = await fetch(`${baseUrl}/api/location/pincode/1234`);
    assert.equal(pinBad.status, 400);

    const subOk = await fetch(`${baseUrl}/api/subscribers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "Client@TeenRaah.shop", source: "footer" }),
    });
    assert.equal(subOk.status, 201);
    const subOkBody = await subOk.json();
    assert.equal(subOkBody.email, "client@teenraah.shop");

    const subBad = await fetch(`${baseUrl}/api/subscribers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad-email" }),
    });
    assert.equal(subBad.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
