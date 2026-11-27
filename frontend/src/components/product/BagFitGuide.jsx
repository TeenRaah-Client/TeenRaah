import { Laptop, Droplets, Plane, Backpack, Layers, Compass } from "lucide-react";
import { inferBagSpecs } from "../../utils/storefront";

const BagFitGuide = ({ product }) => {
  const specs = inferBagSpecs(product);

  const items = [
    specs.capacityLabel && { icon: Backpack, label: "Capacity", value: specs.capacityLabel },
    specs.laptopFit && { icon: Laptop, label: "Laptop Sleeve", value: specs.laptopFit },
    specs.material && { icon: Layers, label: "Material", value: specs.material },
    { icon: Compass, label: "Best For", value: specs.bestFor },
    specs.waterResistant && { icon: Droplets, label: "Weather", value: "Water-resistant finish" },
    specs.cabinFriendly && { icon: Plane, label: "Travel", value: "Cabin baggage friendly" },
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white border border-ink/10 p-4 sm:p-5 mb-6">
      <p className="text-xs font-bold uppercase tracking-widest2 text-trail-600 mb-3">
        FIT &amp; GEAR SPECS
      </p>
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-trail-50 text-trail-600 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-stone leading-tight">{label}</p>
              <p className="text-xs font-semibold text-ink leading-snug mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BagFitGuide;
