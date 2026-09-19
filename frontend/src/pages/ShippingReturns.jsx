import LegalPageLayout, { LegalSection } from "../components/layout/LegalPageLayout";

const ShippingReturns = () => (
  <LegalPageLayout title="SHIPPING & RETURNS" updated="19 September 2026">
    <LegalSection heading="Shipping">
      <ul className="list-disc ml-5 space-y-1">
        <li>Free shipping on orders over ₹999; a flat ₹79 delivery fee applies below that</li>
        <li>Orders are typically delivered within 5 business days of being placed, depending on your location</li>
        <li>You can track your order in real time from "My Orders" — status updates the moment it changes on our end</li>
        <li>Delivery is made to the exact address and pin you set when saving it, so it's worth double-checking the map pin before placing an order</li>
      </ul>
    </LegalSection>

    <LegalSection heading="Returns & Exchanges">
      <ul className="list-disc ml-5 space-y-1">
        <li>Returns are accepted within 7 days of delivery for items in original, unused condition with tags and packaging intact</li>
        <li>To start a return, contact us with your order number, or use the TeenRaah Assistant chatbot — it can look up your order and point you in the right direction</li>
        <li>Once we receive and inspect the returned item, refunds are issued to your original payment method within 5-7 business days</li>
        <li>Items marked as final sale, or used/damaged outside of a manufacturing defect, aren't eligible for return</li>
      </ul>
    </LegalSection>

    <LegalSection heading="Damaged or Incorrect Items">
      <p>
        If your order arrives damaged or you received the wrong item, contact us within 48 hours of delivery
        with photos of the item and packaging — we'll arrange a replacement or full refund at no cost to you.
      </p>
    </LegalSection>

    <LegalSection heading="Cancellations">
      <p>
        Orders can be cancelled before they're marked "Shipped" — reach out with your order number as soon as
        possible. Once an order has shipped, it can no longer be cancelled but can still be returned per the
        policy above once delivered.
      </p>
    </LegalSection>

    <p className="text-xs text-stone pt-6 border-t border-ink/8">
      This is a template policy — confirm actual delivery timelines, fees, and return terms with your
      operations and courier partners before publishing.
    </p>
  </LegalPageLayout>
);

export default ShippingReturns;
