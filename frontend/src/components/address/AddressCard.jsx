import { motion } from "framer-motion";
import { Home, Briefcase, MapPin, Pencil, Trash2, Check } from "lucide-react";

const LABEL_ICONS = { Home, Work: Briefcase, Other: MapPin };

const AddressCard = ({ address, selected, onSelect, onEdit, onDelete, selectable = false }) => {
  const Icon = LABEL_ICONS[address.label] || MapPin;

  return (
    <motion.div
      layout
      onClick={selectable ? onSelect : undefined}
      className={`relative rounded-2xl border-2 p-5 transition-colors ${
        selectable ? "cursor-pointer" : ""
      } ${selected ? "border-trail-500 bg-trail-50" : "border-ink/10 bg-white hover:border-ink/20"}`}
    >
      {selected && (
        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-trail-500 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-trail-600" />
        <span className="text-sm font-bold uppercase tracking-wide">{address.label}</span>
        {address.isDefault && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">DEFAULT</span>}
      </div>

      <p className="font-semibold text-sm text-ink mb-0.5">{address.fullName}</p>
      <p className="text-sm text-ink/70 leading-relaxed">
        {address.line1}
        {address.line2 && `, ${address.line2}`}
        <br />
        {address.city}, {address.state} {address.pincode}
      </p>
      <p className="text-sm text-stone mt-1">{address.phone}</p>

      {(onEdit || onDelete) && (
        <div className="flex gap-4 mt-4 pt-3 border-t border-ink/8">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(address);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-ink/70 hover:text-trail-600"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(address._id);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-ink/70 hover:text-rose"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AddressCard;
