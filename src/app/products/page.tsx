"use client";

import { useState, useMemo, useRef, useEffect, ReactNode } from "react";
import { Product } from "@/types";
import { PlusIcon, SearchIcon, GridIcon, ListIcon, TrashIcon, EditIcon, CloseIcon, CheckIcon, ChevronRightIcon } from "@/components/icons";
import { showToast, showConfirm } from "@/lib/swal";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "@/app/actions/products";

// ========== CUSTOM DROPDOWN COMPONENT ==========
interface DropdownItem { value: string; label: string; }
interface CustomDropdownProps {
  icon?: ReactNode;
  label: string;
  items: DropdownItem[];
  value: string;
  onSelect: (value: string) => void;
  width?: string | number;
}

function CustomDropdown({ icon, label, items, value, onSelect, width }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: width || 'auto' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          width: '100%',
          background: "var(--input-bg)",
          border: `1.5px solid ${isOpen ? "var(--accent-primary)" : "var(--input-border)"}`,
          borderRadius: 12,
          color: (isOpen || value !== "all") ? "var(--foreground)" : "var(--text-secondary)",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isOpen ? "0 0 0 4px rgba(99, 102, 241, 0.1)" : "none",
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon && <span style={{ display: "flex", opacity: 0.8 }}>{icon}</span>}
            <span style={{ textTransform: 'capitalize' }}>{items.find(i => i.value === value)?.label || label}</span>
        </div>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: "transform 0.3s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.5 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, width: '100%', minWidth: 200,
          background: "var(--modal-bg)", border: "1px solid var(--card-border)",
          borderRadius: 14, padding: "6px", zIndex: 1000,
          boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
          backdropFilter: "blur(20px)",
          maxHeight: 250,
          overflowY: 'auto'
        }}>
          {items.map((item) => {
            const isSelected = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => { onSelect(item.value); setIsOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px",
                  border: "none", borderRadius: 10, 
                  background: isSelected ? "var(--accent-primary)" : "transparent",
                  color: isSelected ? "#fff" : "var(--text-secondary)",
                  fontSize: 14, fontWeight: isSelected ? 600 : 500, cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s ease", textTransform: 'capitalize'
                }}
                onMouseEnter={(e) => { if(!isSelected) { e.currentTarget.style.background = "rgba(99, 115, 171, 0.08)"; e.currentTarget.style.color = "var(--foreground)"; } }}
                onMouseLeave={(e) => { if(!isSelected) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========== HELPERS ==========
const CATEGORIES = ["pet", "electronics", "accessories", "clothing", "food", "other"];
const GRADIENTS = [
    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    "linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)",
    "linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)"
];

// ========== IMAGE COMPONENT WITH FALLBACK ==========
function getProxiedUrl(src?: string): string | undefined {
  if (!src) return undefined
  // Route backend storage URLs through our server-side proxy
  if (src.includes('triad.my.id/storage/')) {
    return `/api/image-proxy?url=${encodeURIComponent(src)}`
  }
  return src
}

function SafeImage({ src, fallback, className, style }: { src?: string; fallback: string; className?: string; style?: React.CSSProperties }) {
  const [isError, setIsError] = useState(false)
  const proxiedSrc = getProxiedUrl(src)

  useEffect(() => {
    setIsError(false)
    if (src) {
      console.log(`[SafeImage] Attempting to load: ${src}`);
      if (proxiedSrc !== src) {
        console.log(`[SafeImage] Using Proxy URL: ${proxiedSrc}`);
      }
    }
  }, [src, proxiedSrc])
  
  if (!src) {
    return <div className={className} style={{ ...style, background: fallback, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 24, opacity: 0.3 }}>No Image</div>
    </div>
  }

  if (isError) {
    return <div className={className} style={{ ...style, background: fallback, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 40, opacity: 0.5 }}>📦</div>
      <div style={{ fontSize: 10, opacity: 0.5, color: 'white' }}>Load Failed</div>
    </div>
  }

  return (
    <div className={className} style={{ ...style, overflow: 'hidden' }}>
      <img 
        src={proxiedSrc} 
        alt="Product" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        onError={(e) => {
          console.error(`[SafeImage] FAILED to load image:`, src);
          console.error(`[SafeImage] Proxy used was:`, proxiedSrc);
          setIsError(true);
        }} 
      />
    </div>
  )
}


function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "", description: "", category: "pet", price: 0, stock: 0, image_url: "", is_active: true,
    metadata: {}
  });

  const loadProducts = async () => {
    setLoading(true);
    const res = await fetchProducts();
    if (res.success) setProducts(res.data);
    else showToast("error", res.error || "Failed to load products");
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (selectedCategory !== "all") result = result.filter(p => p.category === selectedCategory);
    
    switch (sortBy) {
      case "newest": result.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()); break;
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
    }
    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name, description: product.description, category: product.category,
        price: product.price, stock: product.stock, image_url: product.image_url || "", is_active: product.is_active,
        metadata: (product as any).metadata || {}
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: "", description: "", category: "pet", price: 0, stock: 0, image_url: "", is_active: true, metadata: {} });
    }
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file); // API expects field name 'file' (confirmed from curl)

    setSubmitting(true);
    try {
      // Use API route directly to avoid Next.js Server Action FormData serialization issues
      const res = await fetch('/api/products/upload-image', {
        method: 'POST',
        body: fd, // fetch auto-sets Content-Type: multipart/form-data
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast("error", data.error || "Upload gagal");
        return;
      }

      // API response: { success: true, data: { image_url: "https://triad.my.id/storage/image/xxx.jpg" } }
      const imageUrl: string = data?.data?.image_url || data?.data?.url || data?.image_url || '';

      if (imageUrl) {
        setFormData(prev => ({ ...prev, image_url: imageUrl }));
        showToast("success", "Gambar berhasil diupload!");
      } else {
        showToast("error", "Upload berhasil tapi URL gambar tidak ditemukan");
      }
    } catch (err) {
      showToast("error", "Upload gagal: network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = editingProduct 
      ? await updateProduct(editingProduct.id, formData)
      : await createProduct(formData);

    if (res.success) {
      showToast("success", editingProduct ? "Product updated" : "Product created");
      setShowModal(false);
      loadProducts();
    } else {
      showToast("error", res.error || "Failed to save product");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const confirm = await showConfirm("Delete Product", "Are you sure?");
    if (!confirm.isConfirmed) return;
    const res = await deleteProduct(id);
    if (res.success) {
      showToast("success", "Deleted");
      loadProducts();
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>My Products</h1>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>Manage your product catalog</p>
          </div>
          <button className="btn-primary" onClick={() => handleOpenModal()} style={{ padding: '10px 20px', borderRadius: 12 }}>
            <PlusIcon /> Add Product
          </button>
        </div>

        {/* TOOLBAR */}
        <div style={{ 
            display: "flex", gap: 12, marginBottom: 24, padding: "12px 16px", 
            background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--card-border)",
            alignItems: 'center'
        }}>
          <div className="search-box">
            <SearchIcon />
            <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <CustomDropdown
            label="Category"
            items={[{ value: "all", label: "All Categories" }, ...CATEGORIES.map(c => ({ value: c, label: c }))]}
            value={selectedCategory}
            onSelect={setSelectedCategory}
          />

          <div className="view-selector">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><GridIcon /></button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><ListIcon /></button>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
            <div style={{ textAlign: 'center', padding: 100, color: 'var(--text-secondary)' }}>Loading...</div>
        ) : filteredProducts.length > 0 ? (
          <div className={viewMode === 'grid' ? "product-grid-refined" : "product-list-refined"}>
            {filteredProducts.map((p, idx) => (
                viewMode === 'grid' ? (
                  <div key={p.id} className="premium-product-card">
                    <SafeImage 
                      src={p.image_url} 
                      fallback={GRADIENTS[idx % GRADIENTS.length]} 
                      className="card-media"
                      style={{ aspectRatio: '1 / 1' }}
                    />
                    <div className="card-glass-actions" style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                        <button className="edit-glass" onClick={() => handleOpenModal(p)}><EditIcon /></button>
                        <button className="delete-glass" onClick={() => handleDelete(p.id)}><TrashIcon /></button>
                    </div>
                    
                    <div className="card-content">
                        <div className="card-meta">
                            <span className="cat-tag">{p.category}</span>
                            <span className="stock-tag">Stock: {p.stock}</span>
                        </div>
                        <h3 className="card-name">{p.name}</h3>
                        <p className="card-description">{p.description}</p>
                        <div className="card-footer">
                            <span className="price-tag">{formatCurrency(p.price)}</span>
                        </div>
                    </div>
                  </div>
                ) : (
                    <div key={p.id} className="premium-list-item">
                        <SafeImage 
                          src={p.image_url} 
                          fallback={GRADIENTS[idx % GRADIENTS.length]} 
                          className="list-media"
                          style={{ aspectRatio: '1 / 1' }}
                        />
                        <div className="list-info" style={{ flex: 1 }}>
                            <h4 style={{ margin: 0 }}>{p.name}</h4>
                            <span className="cat-tag" style={{ marginTop: 4 }}>{p.category}</span>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 120 }}>
                            <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{formatCurrency(p.price)}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Stock: {p.stock}</div>
                        </div>
                        <div className="list-actions">
                            <button onClick={() => handleOpenModal(p)}><EditIcon /></button>
                            <button className="delete" onClick={() => handleDelete(p.id)}><TrashIcon /></button>
                        </div>
                    </div>
                )
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 80, border: '2px dashed var(--border-color)', borderRadius: 24, background: 'var(--card-bg)' }}>
            <h3>No products found</h3>
            <button className="btn-primary" onClick={() => handleOpenModal()} style={{ marginTop: 16 }}>Add Product</button>
          </div>
        )}

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content-premium" style={{ maxWidth: 540, padding: 0, overflow: 'hidden' }}>
              <div className="modal-header" style={{ padding: '24px 32px 16px', marginBottom: 0 }}>
                <div>
                    <h2 style={{ fontSize: 20 }}>{editingProduct ? "Edit Product" : "New Product"}</h2>
                </div>
                <button className="close-btn" onClick={() => setShowModal(false)}><CloseIcon /></button>
              </div>

              <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '0 32px 32px' }}>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group full">
                        <label>Product Name</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Cat Food" />
                    </div>
                    
                    <div className="form-group full">
                        <label>Description</label>
                        <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Details..." />
                    </div>

                    <div className="form-row" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label>Category</label>
                            <CustomDropdown
                                label="Select"
                                items={CATEGORIES.map(c => ({ value: c, label: c }))}
                                value={formData.category}
                                onSelect={v => setFormData({...formData, category: v})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Price (IDR)</label>
                            <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                        </div>
                    </div>

                    <div className="form-row" style={{ gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
                        <div className="form-group">
                            <label>Stock</label>
                            <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                        </div>
                        <div className="form-group" style={{ justifyContent: 'center' }}>
                            <div className="toggle-group" style={{ height: 'auto', marginTop: 10 }}>
                                <input type="checkbox" id="visibility-toggle" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                                <label htmlFor="visibility-toggle" style={{ fontSize: 13, fontWeight: 500 }}>Active in store</label>
                            </div>
                        </div>
                    </div>

                    <div className="form-group full">
                        <label>Product Image</label>
                        <div className="upload-zone" style={{ padding: 12 }}>
                            <SafeImage 
                              src={formData.image_url} 
                              fallback="rgba(99, 115, 171, 0.1)" 
                              className="preview-area"
                              style={{ width: 60, height: 60, borderRadius: 12, flexShrink: 0 }}
                            />
                            <div className="upload-controls">
                                <label className="upload-btn" style={{ padding: '8px 14px' }}>
                                    {submitting ? "..." : "Upload Image"}
                                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={submitting} />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1.5 }} disabled={submitting}>
                            {submitting ? "Saving..." : "Save Product"}
                            {!submitting && <ChevronRightIcon />}
                        </button>
                    </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
      
      <style jsx>{`
        .product-grid-refined { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
        .premium-product-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 20px; overflow: hidden; transition: 0.3s; }
        .premium-product-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }
        .card-media { height: 180px; position: relative; display: flex; align-items: center; justify-content: center; background-size: cover; background-position: center; }
        .card-glass-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; opacity: 0; transition: 0.2s; }
        .premium-product-card:hover .card-glass-actions { opacity: 1; }
        .edit-glass, .delete-glass { width: 32px; height: 32px; border-radius: 8px; border: none; background: rgba(255,255,255,0.8); backdrop-filter: blur(4px); cursor: pointer; color: #333; display: flex; align-items: center; justify-content: center; }
        .delete-glass:hover { background: #ef4444; color: #fff; }
        .card-content { padding: 16px; }
        .card-meta { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .cat-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--accent-primary); background: rgba(99, 102, 241, 0.1); padding: 3px 6px; border-radius: 4px; }
        .stock-tag { font-size: 10px; color: var(--text-tertiary); }
        .card-name { font-size: 16px; font-weight: 700; margin: 0 0 4px; color: var(--foreground); }
        .card-description { font-size: 13px; color: var(--text-secondary); line-height: 1.4; height: 36px; overflow: hidden; margin-bottom: 12px; }
        .price-tag { font-size: 18px; font-weight: 800; color: var(--accent-primary); }
        .search-box { flex: 1; position: relative; display: flex; align-items: center; }
        .search-box :global(svg) { position: absolute; left: 12px; color: var(--text-tertiary); }
        .search-box input { width: 100%; padding: 10px 14px 10px 38px; border-radius: 10px; border: 1.5px solid var(--input-border); background: var(--input-bg); color: var(--foreground); font-size: 14px; }
        .view-selector { display: flex; background: rgba(99, 115, 171, 0.08); padding: 4px; border-radius: 10px; }
        .view-selector button { background: transparent; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: var(--text-tertiary); }
        .view-selector button.active { background: #fff; color: var(--accent-primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content-premium { background: var(--modal-bg); border: 1px solid var(--card-border); border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); animation: pop 0.2s ease-out; }
        @keyframes pop { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; }
        .close-btn { background: transparent; border: none; padding: 4px; cursor: pointer; color: var(--text-tertiary); }
        .modal-form { display: grid; gap: 16px; }
        .form-section { display: grid; gap: 12px; }
        .form-row { display: grid; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
        .form-group input, .form-group textarea { padding: 10px 14px; border-radius: 10px; border: 1.5px solid var(--input-border); background: var(--input-bg); color: var(--foreground); font-size: 14px; outline: none; transition: 0.2s; }
        .form-group input:focus { border-color: var(--accent-primary); }
        .premium-list-item { display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; margin-bottom: 8px; }
        .list-media { width: 44px; height: 44px; border-radius: 8px; flex-shrink: 0; }
        .list-actions { display: flex; gap: 8px; }
        .list-actions button { background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 6px; cursor: pointer; color: var(--text-secondary); }
        .list-actions button.delete:hover { background: var(--accent-red-bg); color: var(--accent-red); }
        .upload-zone { display: flex; gap: 12px; background: rgba(99, 115, 171, 0.05); border: 1.5px dashed var(--border-color); border-radius: 12px; align-items: center; }
        .upload-btn { display: inline-block; background: var(--foreground); color: var(--background); border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; }
        .upload-btn input { display: none; }
        .toggle-group { display: flex; align-items: center; gap: 8px; }
      `}</style>
    </div>
  );
}
