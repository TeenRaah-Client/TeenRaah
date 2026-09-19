import { motion } from "framer-motion";

const LegalPageLayout = ({ title, updated, children }) => (
  <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16">
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-2">{title}</h1>
      <p className="text-sm text-stone mb-10">Last updated: {updated}</p>
      <div className="prose-legal space-y-6 text-sm leading-relaxed text-ink/80">{children}</div>
    </motion.div>
  </div>
);

export const LegalSection = ({ heading, children }) => (
  <section>
    <h2 className="font-display text-xl tracking-wide text-ink mb-2 mt-8">{heading}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);

export default LegalPageLayout;
