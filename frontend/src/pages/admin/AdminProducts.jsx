import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { apiMultipart } from "../../api/axios";
import ProductForm from "../../components/admin/ProductForm";
import { Loader } from "../../components/ui/Loader";
import Button from "../../components/ui/Button";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await apiMultipart.get("/admin/products");
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await apiMultipart.delete(`/admin/products/${id}`);
      toast.success("Product deleted");
      fetchProducts();
    } catch (err) {
      toast.error(err.message || "Could not delete product");
    }
  };

  const openNew = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };
  const openEdit = (p) => {
    setEditingProduct(p);
    setFormOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl tracking-wide">PRODUCTS</h1>
        <Button variant="dark" icon={Plus} onClick={openNew}>Add Product</Button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone uppercase border-b border-ink/8">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="px-5 py-3 font-semibold">Stock</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/6">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-paper/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]?.url} alt={p.name} className="w-11 h-11 rounded-lg object-cover bg-paper-dark" />
                      <div>
                        <p className="font-semibold flex items-center gap-1.5">
                          {p.name}
                          {p.isFeatured && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                        </p>
                        <p className="text-xs text-stone">{p.images.length} img · {p.videos.length} video</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink/70">{p.category}</td>
                  <td className="px-5 py-3 tnum">
                    ₹{p.price.toLocaleString("en-IN")}
                    {p.mrp > p.price && <span className="text-stone line-through ml-1.5 text-xs">₹{p.mrp.toLocaleString("en-IN")}</span>}
                  </td>
                  <td className="px-5 py-3 tnum">
                    <span className={p.stock === 0 ? "text-rose font-semibold" : ""}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.isActive ? "bg-trail-50 text-trail-700" : "bg-stone/10 text-stone"}`}>
                      {p.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEdit(p)} className="text-ink/60 hover:text-trail-600" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p._id)} className="text-ink/60 hover:text-rose" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <p className="text-center text-stone py-10">No products yet. Add your first bag!</p>}
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <ProductForm
            product={editingProduct}
            onClose={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false);
              fetchProducts();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;
