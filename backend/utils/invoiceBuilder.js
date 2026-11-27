const DEFAULT_GST_RATE = 0.18;
const SELLER_STATE = "maharashtra";

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

export const buildOrderInvoiceData = (order, { gstRate = DEFAULT_GST_RATE } = {}) => {
  if (!order || !order.orderNumber) {
    throw new TypeError("Valid order object with orderNumber is required");
  }

  const totalPaid = round2(Number(order.totalAmount) || 0);
  const itemsTotal = round2(Number(order.itemsTotal) || 0);
  const discount = round2(Number(order.discount) || 0);
  const walletUsed = round2(Number(order.walletUsed) || 0);
  const deliveryFee = round2(Number(order.deliveryFee) || 0);

  const grossPayableBeforeWallet = round2(Math.max(0, itemsTotal - discount + deliveryFee));
  const taxableValue = round2(grossPayableBeforeWallet / (1 + gstRate));
  const totalTax = round2(grossPayableBeforeWallet - taxableValue);

  const destState = String(order.shippingAddress?.state || "").trim().toLowerCase();
  const isIntraState = destState === SELLER_STATE || destState === "mh";

  const cgst = isIntraState ? round2(totalTax / 2) : 0;
  const sgst = isIntraState ? round2(totalTax - cgst) : 0;
  const igst = isIntraState ? 0 : totalTax;

  const lineItems = (order.items || []).map((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = round2(Number(item.price) || 0);
    const lineGross = round2(unitPrice * qty);
    const lineTaxable = round2(lineGross / (1 + gstRate));
    return {
      name: item.name,
      color: item.color || "",
      hsnCode: "4202",
      quantity: qty,
      unitPrice,
      taxableValue: lineTaxable,
      taxAmount: round2(lineGross - lineTaxable),
      lineTotal: lineGross,
    };
  });

  return {
    invoiceNumber: `INV-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    issuedAt: order.payment?.paidAt || order.createdAt || new Date().toISOString(),
    seller: {
      name: "TeenRaah Retail",
      tagline: "Find Your Path",
      state: "Maharashtra, India",
      supportEmail: process.env.SUPPORT_EMAIL || "support@teenraah.shop",
    },
    customer: {
      fullName: order.shippingAddress?.fullName || "",
      phone: order.shippingAddress?.phone || "",
      addressLine1: order.shippingAddress?.line1 || "",
      addressLine2: order.shippingAddress?.line2 || "",
      city: order.shippingAddress?.city || "",
      state: order.shippingAddress?.state || "",
      pincode: order.shippingAddress?.pincode || "",
      country: order.shippingAddress?.country || "India",
    },
    payment: {
      method: order.payment?.method || "razorpay",
      status: order.payment?.status || "pending",
      transactionId: order.payment?.razorpayPaymentId || "",
      paidAt: order.payment?.paidAt || null,
    },
    items: lineItems,
    summary: {
      itemsTotal,
      discount,
      couponCode: order.couponCode || null,
      deliveryFee,
      walletUsed,
      grossTotal: grossPayableBeforeWallet,
      taxableValue,
      gstRatePercent: Math.round(gstRate * 100),
      taxType: isIntraState ? "CGST+SGST" : "IGST",
      cgst,
      sgst,
      igst,
      totalTax,
      totalPaid,
    },
  };
};
