"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTenants, fetchTenantById } from "@/app/actions/tenants";
import { fetchOrders, updateOrderStatus } from "@/app/actions/ordersApi";
import { getMe } from "@/app/actions/auth";
import { Tenant, User } from "@/types";
import { ListIcon, CheckIcon, AlertCircleIcon, PackageIcon } from "@/components/icons";
import SearchableSelect from "@/components/ui/SearchableSelect";
import PageHeader from "@/components/ui/PageHeader";
import OrderDetailsModal from "@/components/orders/OrderDetailsModal";
import { showToast, showConfirm } from "@/lib/swal";

export default function OrdersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [orders, setOrders] = useState<any[]>([]);
  
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadInitialData = useCallback(async () => {
    try {
      setError(null);
      const userRes = await getMe();
      if (!userRes.success) {
        setError("Failed to fetch user profile");
        setLoadingTenants(false);
        return;
      }
      
      const user = userRes.data;
      setCurrentUser(user);

      const res = await fetchTenants(user.id);
      let finalTenants = [];
      
      if (res.success && res.data.length > 0) {
        finalTenants = res.data;
      } else if (user.tenant_id) {
        const tenantRes = await fetchTenantById(user.tenant_id);
        if (tenantRes.success) finalTenants = [tenantRes.data];
      }

      setTenants(finalTenants);
      if (finalTenants.length > 0) {
        const defaultId = sessionStorage.getItem("tenant_id") || finalTenants[0].id;
        const exists = finalTenants.some((t: any) => t.id === defaultId);
        setSelectedTenantId(exists ? defaultId : finalTenants[0].id);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  const loadOrders = useCallback(async (tenantId: string) => {
    if (!tenantId || !currentUser) return;
    try {
      setLoadingOrders(true);
      setError(null);
      const res = await fetchOrders(currentUser.role === "admin" || currentUser.role === "owner" ? tenantId : undefined);
      if (res.success) {
        setOrders(res.data || []);
      } else {
        setError(res.error || "Failed to fetch orders");
      }
    } catch (err: any) {
      console.error("DEBUG [loadOrders] UI Catch:", err);
      setError(err.message || "An unexpected network error occurred while fetching orders");
    } finally {
      setLoadingOrders(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (selectedTenantId) {
      loadOrders(selectedTenantId);
      sessionStorage.setItem("tenant_id", selectedTenantId);
    }
  }, [selectedTenantId, loadOrders]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setLoadingStatus(true);
    try {
      const res = await updateOrderStatus(orderId, status);
      if (res.success) {
        showToast("success", `Order ${status} successfully`);
        loadOrders(selectedTenantId);
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: any) => ({ ...prev, status }));
        }
      } else {
        showToast("error", res.error || "Failed to update order status");
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setLoadingStatus(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    filterStatus === "all" ? true : o.status.toLowerCase() === filterStatus.toLowerCase()
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        <PageHeader 
          title="Orders" 
          description="Monitor and manage product orders from your customers across all channels."
          badge={!loadingOrders && selectedTenantId && (
            <span className="badge badge-count" style={{ fontSize: 13 }}>
              {orders.length}
            </span>
          )}
        />

        {/* Filters and Tenant Selector */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 32, alignItems: "center", justifyContent: "space-between" }}>
          
          <div style={{ display: "flex", gap: 8, background: "rgba(99, 115, 171, 0.05)", padding: 6, borderRadius: 12, border: "1px solid var(--border-color)" }}>
            {["all", "pending", "confirmed", "completed"].map(s => (
              <button 
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  background: filterStatus === s ? "var(--accent-primary)" : "transparent",
                  color: filterStatus === s ? "#fff" : "var(--text-secondary)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {(currentUser?.role === "admin" || currentUser?.role === "owner") && tenants.length > 1 && (
            <div style={{ minWidth: 280 }}>
              <SearchableSelect
                label=""
                options={tenants}
                value={selectedTenantId}
                onSelect={setSelectedTenantId}
                loading={loadingTenants}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-error mb-8 flex justify-between items-center">
            <span>⚠️ {error}</span>
            <button className="btn-secondary btn-sm" onClick={() => loadOrders(selectedTenantId)}>Retry</button>
          </div>
        )}

        {/* Orders Table */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 2fr 1fr 1fr 0.8fr",
            padding: "16px 24px",
            background: "rgba(99, 115, 171, 0.04)",
            borderBottom: "1px solid var(--border-color)",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)"
          }}>
            <div>Order ID</div>
            <div>Customer</div>
            <div>Total Amount</div>
            <div>Status</div>
            <div style={{ textAlign: "right" }}>Action</div>
          </div>

          {loadingOrders ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
                <div className="skeleton" style={{ height: 20, width: "100%", borderRadius: 4 }} />
              </div>
            ))
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div key={order.id} className="table-row" style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 2fr 1fr 1fr 0.8fr",
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-color)",
                alignItems: "center",
                fontSize: 14,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99, 115, 171, 0.02)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontWeight: 600, color: "var(--foreground)", fontFamily: "monospace" }}>
                  #{order.id.split("-")[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{order.customer_contact}</div>
                </div>
                <div style={{ fontWeight: 700, color: "var(--accent-primary)" }}>
                  {formatCurrency(order.total_price)}
                </div>
                <div>
                   <span className="badge" style={{ 
                     background: order.status === "confirmed" ? "rgba(16,185,129,0.1)" : order.status === "pending" ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)",
                     color: order.status === "confirmed" ? "#10b981" : order.status === "pending" ? "#f59e0b" : "#3b82f6",
                     fontSize: 11,
                     fontWeight: 600,
                     textTransform: "uppercase"
                   }}>
                    {order.status}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <button 
                    className="btn-secondary btn-sm" 
                    onClick={() => setSelectedOrder(order)}
                    style={{ padding: "6px 12px" }}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(99, 115, 171, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "var(--text-tertiary)" }}>
                <PackageIcon size={32} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px 0" }}>No orders found</h3>
              <p style={{ color: "var(--text-tertiary)", margin: 0 }}>Try changing the filters or selecting a different tenant.</p>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          loadingStatus={loadingStatus}
        />
      )}
    </div>
  );
}
