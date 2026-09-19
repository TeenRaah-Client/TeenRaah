import LegalPageLayout, { LegalSection } from "../components/layout/LegalPageLayout";

const Privacy = () => (
  <LegalPageLayout title="PRIVACY POLICY" updated="19 September 2026">
    <p>
      This Privacy Policy explains what information TeenRaah ("we", "us") collects when you use our website
      and app, how we use it, and the choices you have. By using TeenRaah, you agree to the collection and
      use of information as described here.
    </p>

    <LegalSection heading="Information We Collect">
      <p>We collect information you give us directly, and some collected automatically:</p>
      <ul className="list-disc ml-5 space-y-1">
        <li>Account details: name, email address, phone number, password (stored encrypted, never in plain text)</li>
        <li>Delivery addresses, including the precise location you set on the map when saving an address</li>
        <li>Order history, cart contents, and wishlist</li>
        <li>Payment confirmation details from Razorpay (we never see or store your card, UPI PIN, or full payment credentials — those are handled entirely by Razorpay)</li>
        <li>Messages you send to the TeenRaah Assistant chatbot</li>
        <li>Basic usage data (pages visited, device/browser type) for improving the site</li>
      </ul>
    </LegalSection>

    <LegalSection heading="How We Use Your Information">
      <ul className="list-disc ml-5 space-y-1">
        <li>To process and deliver your orders, and keep you updated on their status</li>
        <li>To verify your email address and keep your account secure</li>
        <li>To respond to your questions via the chatbot or customer support</li>
        <li>To calculate and pay out referral and wallet rewards</li>
        <li>To send order-related emails (confirmations, shipping updates) and, if you opt in, occasional offers</li>
        <li>To improve TeenRaah's products, catalog, and site experience</li>
      </ul>
    </LegalSection>

    <LegalSection heading="How We Share Information">
      <p>We do not sell your personal information. We share it only where necessary to run the service:</p>
      <ul className="list-disc ml-5 space-y-1">
        <li>With Razorpay, to process payments</li>
        <li>With our courier/delivery partners, to deliver your order to the address you provide</li>
        <li>With Cloudinary, Resend, and our hosting/database providers, who process data on our behalf under their own security commitments</li>
        <li>With OpenRouter and Hugging Face, if you use the TeenRaah Assistant chatbot or AI concept image generation — your message text or image description is sent to generate a response</li>
        <li>If required by law, or to protect TeenRaah's or others' rights and safety</li>
      </ul>
    </LegalSection>

    <LegalSection heading="Your Choices">
      <ul className="list-disc ml-5 space-y-1">
        <li>You can view and edit your profile, addresses, and wishlist any time from your account</li>
        <li>You can request deletion of your account and associated personal data by contacting us</li>
        <li>You can unsubscribe from marketing emails at any time via the link in those emails</li>
      </ul>
    </LegalSection>

    <LegalSection heading="Data Security">
      <p>
        We use industry-standard measures to protect your data, including encrypted password storage, secure
        cookies for login sessions, and restricted access to customer data within our team. No method of
        transmission or storage is 100% secure, but we work to protect your information appropriately.
      </p>
    </LegalSection>

    <LegalSection heading="Contact Us">
      <p>Questions about this policy? Reach us at privacy@teenraah.shop.</p>
    </LegalSection>

    <p className="text-xs text-stone pt-6 border-t border-ink/8">
      This is a template policy and should be reviewed by a qualified professional before you rely on it for a
      live store — it isn't legal advice.
    </p>
  </LegalPageLayout>
);

export default Privacy;
