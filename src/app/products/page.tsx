"use client";

import { useState, useMemo, useRef, useEffect, ReactNode } from "react";
import { Product } from "@/types";
import { PlusIcon, SearchIcon, GridIcon, ListIcon } from "@/components/icons";
import { showToast } from "@/lib/swal";

// ========== CUSTOM DROPDOWN COMPONENT ==========
interface DropdownItem { value: string; label: string; }
interface CustomDropdownProps {
  icon?: ReactNode;
  label: string;
  items: DropdownItem[];
  value: string;
  onSelect: (value: string) => void;
}

function CustomDropdown({ icon, label, items, value, onSelect }: CustomDropdownProps) {
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
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 14px",
          background: isOpen ? "rgba(99, 102, 241, 0.08)" : "var(--input-bg)",
          border: `1.5px solid ${isOpen ? "var(--accent-primary)" : "var(--input-border)"}`,
          borderRadius: 12,
          color: isOpen ? "var(--accent-primary)" : "var(--text-secondary)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          transition: "all 0.2s ease",
          boxShadow: isOpen ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "var(--card-hover-border)";
            e.currentTarget.style.color = "var(--foreground)";
            e.currentTarget.style.background = "rgba(99, 115, 171, 0.06)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "var(--input-border)";
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "var(--input-bg)";
          }
        }}
      >
        {icon && <span style={{ display: "flex", opacity: 0.7 }}>{icon}</span>}
        {label}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            marginLeft: 2,
            transition: "transform 0.2s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          minWidth: 200,
          background: "var(--modal-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: 14,
          padding: "6px",
          zIndex: 50,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
          backdropFilter: "blur(20px)",
          animation: "dropdownSlide 0.18s ease-out",
        }}>
          {items.map((item) => {
            const isActive = item.value === value;
            return (
              <button
                key={item.value}
                onClick={() => { onSelect(item.value); setIsOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  borderRadius: 10,
                  background: isActive ? "rgba(99, 102, 241, 0.1)" : "transparent",
                  color: isActive ? "var(--accent-primary)" : "var(--foreground)",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(99, 115, 171, 0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {/* Check mark for active item */}
                <span style={{
                  width: 18, height: 18, borderRadius: 6, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive ? "var(--accent-primary)" : "rgba(99, 115, 171, 0.08)",
                  transition: "all 0.15s ease",
                }}>
                  {isActive && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========== DUMMY DATA ==========
const PRODUCT_GRADIENTS = [
  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
  "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
  "linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)",
  "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #10b981 50%, #22c55e 100%)",
  "linear-gradient(135deg, #f97316 0%, #ef4444 50%, #ec4899 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%)",
];

const PRODUCT_ICONS = ["📦", "🎧", "💻", "📱", "⌚", "🎮", "📸", "🖥️", "🎒", "👟"];

const CATEGORIES = ["Electronics", "Accessories", "Clothing", "Home & Living", "Food & Beverage"];

const DUMMY_PRODUCTS: Product[] = [
  {
    id: "p1", name: "Premium Wireless Headphones", description: "High-fidelity sound with active noise cancellation and 30hr battery life.",
    price: 1299000, currency: "IDR", category: "Electronics", stock: 24, is_active: true,
    tenant_id: "t1", created_at: "2026-03-15T08:00:00Z",
  },
  {
    id: "p2", name: "Ergonomic Laptop Stand", description: "Adjustable aluminum stand for improved posture and airflow.",
    price: 450000, currency: "IDR", category: "Accessories", stock: 56, is_active: true,
    tenant_id: "t1", created_at: "2026-03-14T10:30:00Z",
  },
  {
    id: "p3", name: "Smart Fitness Watch", description: "Heart rate monitor, GPS tracking, sleep analysis with AMOLED display.",
    price: 2150000, currency: "IDR", category: "Electronics", stock: 8, is_active: true,
    tenant_id: "t1", created_at: "2026-03-13T14:00:00Z",
  },
  {
    id: "p4", name: "Organic Matcha Powder", description: "Premium ceremonial-grade matcha imported from Uji, Kyoto.",
    price: 185000, currency: "IDR", category: "Food & Beverage", stock: 120, is_active: true,
    tenant_id: "t1", created_at: "2026-03-12T09:15:00Z",
  },
  {
    id: "p5", name: "Minimalist Canvas Backpack", description: "Water-resistant urban backpack with laptop compartment.",
    price: 375000, currency: "IDR", category: "Accessories", stock: 0, is_active: false,
    tenant_id: "t1", created_at: "2026-03-11T16:45:00Z",
  },
  {
    id: "p6", name: "Artisan Ceramic Mug Set", description: "Handcrafted set of 4 mugs with unique glaze patterns.",
    price: 280000, currency: "IDR", category: "Home & Living", stock: 32, is_active: true,
    tenant_id: "t1", created_at: "2026-03-10T11:00:00Z",
  },
  {
    id: "p7", name: "Running Shoes Ultra Boost", description: "Lightweight responsive cushioning for daily training.",
    price: 1780000, currency: "IDR", category: "Clothing", stock: 3, is_active: true,
    tenant_id: "t1", created_at: "2026-03-09T13:30:00Z",
  },
  {
    id: "p8", name: "Portable Bluetooth Speaker", description: "360° surround sound, waterproof IPX7, 20hr playtime.",
    price: 890000, currency: "IDR", category: "Electronics", stock: 45, is_active: true,
    tenant_id: "t1", created_at: "2026-03-08T08:20:00Z",
  },
  {
    id: "p9", name: "Vintage Denim Jacket", description: "Classic wash with modern fit, organic cotton.",
    price: 650000, currency: "IDR", category: "Clothing", stock: 15, is_active: true,
    tenant_id: "t1", created_at: "2026-03-07T15:00:00Z",
  },
  {
    id: "p10", name: "Smart LED Desk Lamp", description: "Touch-controlled, color temperature adjustable, USB charging port.",
    price: 520000, currency: "IDR", category: "Home & Living", stock: 0, is_active: false,
    tenant_id: "t1", created_at: "2026-03-06T10:30:00Z",
  },
];

// ========== HELPERS ==========
function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
}

function getStockInfo(stock: number) {
  if (stock === 0) return { label: "Out of Stock", className: "stock-out" };
  if (stock <= 10) return { label: `Low Stock (${stock})`, className: "stock-low" };
  return { label: `In Stock (${stock})`, className: "stock-in" };
}

type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "newest" | "oldest";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProducts = useMemo(() => {
    let result = [...DUMMY_PRODUCTS];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case "name-asc": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-desc": result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "newest": result.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()); break;
      case "oldest": result.sort((a, b) => new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime()); break;
    }

    return result;
  }, [searchQuery, selectedCategory, sortBy]);

  const handleAddProduct = () => {
    showToast("info", "Product creation coming soon! This is a mockup.");
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ===== HEADER ===== */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                My Products
              </h1>
              <span className="badge badge-count" style={{ fontSize: 13 }}>
                {filteredProducts.length}
              </span>
            </div>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
              Manage and showcase your product catalog
            </p>
          </div>
          <button className="btn-primary" onClick={handleAddProduct}>
            <PlusIcon />
            Add Product
          </button>
        </div>

        {/* ===== TOOLBAR: Search + Filters + View Toggle ===== */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
          flexWrap: "wrap",
          padding: "16px 20px",
          background: "rgba(99, 115, 171, 0.04)",
          borderRadius: 14,
          border: "1px solid var(--card-border)",
        }}>
          {/* Search */}
          <div className="product-search-bar">
            <span className="search-icon"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter — Custom Dropdown */}
          <CustomDropdown
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            }
            label={selectedCategory === "all" ? "All Categories" : selectedCategory}
            items={[
              { value: "all", label: "All Categories" },
              ...CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
            value={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {/* Sort — Custom Dropdown */}
          <CustomDropdown
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            }
            label={
              { newest: "Newest", oldest: "Oldest", "price-asc": "Price ↑", "price-desc": "Price ↓", "name-asc": "A → Z", "name-desc": "Z → A" }[sortBy]
            }
            items={[
              { value: "newest", label: "Newest First" },
              { value: "oldest", label: "Oldest First" },
              { value: "price-asc", label: "Price: Low → High" },
              { value: "price-desc", label: "Price: High → Low" },
              { value: "name-asc", label: "Name: A → Z" },
              { value: "name-desc", label: "Name: Z → A" },
            ]}
            value={sortBy}
            onSelect={(v) => setSortBy(v as SortOption)}
          />

          {/* View Toggle */}
          <div className="view-toggle" style={{ marginLeft: "auto" }}>
            <button
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <GridIcon />
            </button>
            <button
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <ListIcon />
            </button>
          </div>
        </div>

        {/* ===== GRID VIEW ===== */}
        {viewMode === "grid" && filteredProducts.length > 0 && (
          <div className="product-grid">
            {filteredProducts.map((product, idx) => {
              const stockInfo = getStockInfo(product.stock);
              const gradient = PRODUCT_GRADIENTS[idx % PRODUCT_GRADIENTS.length];
              const icon = PRODUCT_ICONS[idx % PRODUCT_ICONS.length];
              return (
                <div key={product.id} className="product-card">
                  {/* Image / Gradient Placeholder */}
                  <div className="product-card-image">
                    <div className="product-card-image-gradient" style={{ background: gradient }}>
                      <span style={{ fontSize: 52, zIndex: 1, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}>
                        {icon}
                      </span>
                    </div>
                    {/* Status Badge */}
                    <div style={{
                      position: "absolute", top: 12, right: 12, zIndex: 2,
                    }}>
                      <span className="badge" style={{
                        background: product.is_active ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.85)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 600,
                        backdropFilter: "blur(8px)",
                      }}>
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="product-card-body">
                    {/* Category */}
                    <span className="badge" style={{
                      background: "rgba(99, 102, 241, 0.1)",
                      color: "var(--accent-primary)",
                      fontSize: 11,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}>
                      {product.category}
                    </span>

                    {/* Name */}
                    <h3 style={{
                      fontSize: 16, fontWeight: 600, color: "var(--foreground)",
                      margin: "8px 0 6px", lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {product.name}
                    </h3>

                    {/* Description */}
                    <p style={{
                      fontSize: 13, color: "var(--text-secondary)", margin: "0 0 12px",
                      lineHeight: 1.5,
                      overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {product.description}
                    </p>

                    {/* Price + Stock */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                      <span style={{
                        fontSize: 18, fontWeight: 700, color: "var(--accent-primary)",
                        letterSpacing: "-0.01em",
                      }}>
                        {formatCurrency(product.price, product.currency)}
                      </span>
                      <span style={{
                        display: "flex", alignItems: "center", fontSize: 12,
                        color: "var(--text-secondary)", fontWeight: 500,
                      }}>
                        <span className={`stock-dot ${stockInfo.className}`} />
                        {stockInfo.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== LIST VIEW ===== */}
        {viewMode === "list" && filteredProducts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr 120px 100px 80px",
              gap: 16,
              padding: "10px 20px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              <span></span>
              <span>Product</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Status</span>
            </div>
            {filteredProducts.map((product, idx) => {
              const stockInfo = getStockInfo(product.stock);
              const gradient = PRODUCT_GRADIENTS[idx % PRODUCT_GRADIENTS.length];
              const icon = PRODUCT_ICONS[idx % PRODUCT_ICONS.length];
              return (
                <div key={product.id} className="product-list-row">
                  {/* Thumbnail */}
                  <div className="product-list-thumb" style={{ background: gradient }}>
                    <span>{icon}</span>
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{
                      fontSize: 14, fontWeight: 600, margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {product.name}
                    </h4>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span className="badge" style={{
                        background: "rgba(99, 102, 241, 0.1)", color: "var(--accent-primary)",
                        fontSize: 10, fontWeight: 600,
                      }}>
                        {product.category}
                      </span>
                      <span style={{
                        fontSize: 12, color: "var(--text-tertiary)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {product.description}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-primary)" }}>
                    {formatCurrency(product.price, product.currency)}
                  </span>

                  {/* Stock */}
                  <span style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                    <span className={`stock-dot ${stockInfo.className}`} />
                    {product.stock}
                  </span>

                  {/* Status */}
                  <span className="badge" style={{
                    background: product.is_active ? "var(--accent-green-bg)" : "var(--accent-red-bg)",
                    color: product.is_active ? "var(--accent-green)" : "var(--accent-red)",
                    fontSize: 11, fontWeight: 600, justifyContent: "center",
                  }}>
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== EMPTY STATE ===== */}
        {filteredProducts.length === 0 && (
          <div style={{
            textAlign: "center", padding: "80px 20px",
            background: "rgba(99, 115, 171, 0.08)", borderRadius: 16,
            border: "2px dashed rgba(99, 115, 171, 0.2)",
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px", fontSize: 32,
            }}>
              📦
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>
              {searchQuery || selectedCategory !== "all"
                ? "No Products Found"
                : "No Products Yet"}
            </h3>
            <p style={{
              color: "var(--text-secondary)", margin: "0 0 24px 0",
              fontSize: 15, maxWidth: 400, marginInline: "auto",
            }}>
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search or filter to find what you're looking for."
                : "Start building your product catalog by adding your first product."}
            </p>
            {!searchQuery && selectedCategory === "all" && (
              <button className="btn-primary" onClick={handleAddProduct}>
                <PlusIcon />
                Add Your First Product
              </button>
            )}
            {(searchQuery || selectedCategory !== "all") && (
              <button
                className="btn-secondary"
                onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
