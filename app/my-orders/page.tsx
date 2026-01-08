"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import {
  ArrowLeft,
  Search,
  Package,
  Truck,
  CheckCircle2,
  CreditCard,
  Printer,
  ChevronRight,
} from "lucide-react";

import { getOrders } from "@/utils/orders";

type OrderStatus =
  | "paid"
  | "printing"
  | "printed"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "unknown";

type OrderItem = {
  id: string;
  previewUrl?: string;
  src?: string;
  qty?: number;
};

type Order = {
  id: string;
  createdAt?: string | number | Date;
  status?: string;
  currency?: string; // "฿" or "THB"
  total?: number;
  items?: OrderItem[];
  itemsCount?: number;
};

function normalizeStatus(raw?: string): OrderStatus {
  const v = (raw || "").toLowerCase().trim();
  if (v === "paid") return "paid";
  if (v === "printed") return "printed";
  if (v.includes("print") && v.includes("ing")) return "printing";
  if (v.includes("ship")) return "shipping";
  if (v.includes("deliver")) return "delivered";
  if (v.includes("cancel")) return "cancelled";
  return "unknown";
}

function formatDate(d?: Order["createdAt"], language?: string) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const locale = language === "TH" ? "th-TH" : "en-US";
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit" });
}

function formatMoney(total?: number, currency?: string) {
  if (typeof total !== "number") return "";
  const c = (currency || "").trim();
  if (c === "฿") return `฿${total.toFixed(0)}`;
  if (!c) return `${total.toFixed(2)}`;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(total);
  } catch {
    return `${c}${total.toFixed(2)}`;
  }
}

function statusMeta(status: OrderStatus) {
  switch (status) {
    case "paid":
      return { label: "Paid", icon: CreditCard, bg: "#EFF6FF", border: "#BFDBFE", color: "#1E40AF" };
    case "printing":
      return { label: "Printing", icon: Printer, bg: "#F5F3FF", border: "#DDD6FE", color: "#5B21B6" };
    case "printed":
      return { label: "Printed", icon: Package, bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46" };
    case "shipping":
      return { label: "Shipping", icon: Truck, bg: "#FFFBEB", border: "#FDE68A", color: "#92400E" };
    case "delivered":
      return { label: "Delivered", icon: CheckCircle2, bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46" };
    case "cancelled":
      return { label: "Cancelled", icon: Package, bg: "#FEF2F2", border: "#FECACA", color: "#991B1B" };
    default:
      return { label: "Processing", icon: Package, bg: "#F3F4F6", border: "#E5E7EB", color: "#374151" };
  }
}

export default function MyOrdersPage() {
  const router = useRouter();
  const app = useApp() as any;
  const t = app?.t as ((key: string) => string) | undefined;

  const tr = (key: string, fallback: string) => {
    const v = t?.(key);
    if (!v || v === key) return fallback;
    return v;
  };

  const [ordersState, setOrdersState] = useState<Order[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const contextOrders: Order[] = (app?.orders || app?.myOrders || []) as Order[];
    if (Array.isArray(contextOrders) && contextOrders.length) {
      setOrdersState(contextOrders);
      return;
    }

    try {
      const stored = getOrders();
      if (Array.isArray(stored)) setOrdersState(stored as Order[]);
      else setOrdersState([]);
    } catch {
      setOrdersState([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orders: Order[] = ordersState;

  const summary = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) => {
      const s = normalizeStatus(o.status);
      return s !== "delivered" && s !== "cancelled";
    }).length;
    const delivered = orders.filter((o) => normalizeStatus(o.status) === "delivered").length;
    return { total, active, delivered };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => (o.id || "").toLowerCase().includes(q));
  }, [orders, query]);

  const goHome = () => router.push("/");
  const goEditor = () => router.push("/editor");

  return (
    <AppLayout>
      <div style={{ backgroundColor: "#F9FAFB", minHeight: "calc(100vh - 64px)", padding: "2rem 0" }}>
        <div className="container" style={{ maxWidth: 980 }}>
          {/* Header */}
          <div
            className="card"
            style={{
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            {/* Left */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
              <button
                onClick={goHome}
                className="btn btn-text"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.55rem 0.8rem",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "white",
                  fontWeight: 900,
                }}
                onMouseEnter={(e) => ((e.currentTarget.style.background = "#F9FAFB"), (e.currentTarget.style.borderColor = "#E5E7EB"))}
                onMouseLeave={(e) => ((e.currentTarget.style.background = "white"), (e.currentTarget.style.borderColor = "var(--border)"))}
              >
                <ArrowLeft size={16} />
                {tr("home", "Home")}
              </button>

              <div style={{ width: 1, height: 28, background: "var(--border)" }} />

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 950, lineHeight: 1.1 }}>
                  {tr("myOrdersTitle", "My Orders")}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 650, marginTop: 6 }}>
                  {tr("myOrdersSubtitle", "Your orders and delivery updates.")}
                </div>
              </div>
            </div>

            {/* Search */}
            <div
              style={{
                minWidth: 320,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 0.85rem",
                border: "1px solid var(--border)",
                borderRadius: 999,
                background: "white",
              }}
            >
              <Search size={16} color="var(--text-tertiary)" />
              <input
                className="input"
                style={{ border: "none", outline: "none", padding: 0, height: "auto" }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr("searchOrders", "Search by order #")}
              />
            </div>
          </div>

          {/* Summary */}
          <div
            style={{
              marginTop: "1rem",
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "0.75rem",
            }}
          >
            <SummaryCard
              label={tr("active", "Active")}
              value={summary.active}
              helper={tr("ordersSummaryActiveHelper", "Paid / Printing / Printed / Shipping")}
            />
            <SummaryCard
              label={tr("delivered", "Delivered")}
              value={summary.delivered}
              helper={tr("ordersSummaryDeliveredHelper", "Completed orders")}
            />
            <SummaryCard
              label={tr("total", "Total")}
              value={summary.total}
              helper={tr("ordersSummaryTotalHelper", "All time")}
            />
          </div>

          {/* Body */}
          <div style={{ marginTop: "0.75rem" }}>
            {filtered.length === 0 ? (
              <div className="card" style={{ padding: "3.25rem 2rem", textAlign: "center" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    background: "#F3F4F6",
                    border: "1px solid #E5E7EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}
                >
                  <Package size={22} color="#6B7280" />
                </div>

                <div style={{ fontSize: 20, fontWeight: 950 }}>{tr("noOrdersTitle", "No orders yet")}</div>
                <div style={{ marginTop: 10, color: "var(--text-tertiary)", fontWeight: 600, lineHeight: 1.6 }}>
                  {tr("noOrdersSubtitle", "After checkout, your order will appear here with status updates and previews.")}
                </div>

                <div style={{ marginTop: 20 }}>
                  <button className="btn btn-primary" onClick={goEditor} style={{ padding: "0.95rem 1.25rem" }}>
                    {tr("startNewOrder", "Start a new order")}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {filtered
                  .slice()
                  .sort((a, b) => {
                    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return db - da;
                  })
                  .map((o) => (
                    <OrderRow
                      key={o.id}
                      order={o}
                      onOpen={() => router.push(`/myorder/${encodeURIComponent(o.id)}`)}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="card" style={{ padding: "1rem" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 650, color: "var(--text-tertiary)", marginTop: 4 }}>{helper}</div>
    </div>
  );
}

function OrderRow({ order, onOpen }: { order: any; onOpen: () => void }) {
  const app = useApp() as any;
  const t = app?.t as ((key: string) => string) | undefined;

  const tr = (key: string, fallback: string) => {
    const v = t?.(key);
    if (!v || v === key) return fallback;
    return v;
  };

  const s = normalizeStatus(order.status);
  const meta = statusMeta(s);
  const Icon = meta.icon;

  const statusLabelKey: Record<OrderStatus, string> = {
    paid: "orderStatusPaid",
    printing: "orderStatusPrinting",
    printed: "orderStatusPrinted",
    shipping: "orderStatusShipping",
    delivered: "orderStatusDelivered",
    cancelled: "orderStatusCancelled",
    unknown: "orderStatusProcessing",
  };
  const statusLabel = tr(statusLabelKey[s] || "orderStatusProcessing", meta.label);

  const previews: string[] = Array.isArray(order.items)
    ? order.items
        .map((it: any) => it.previewUrl || it.src)
        .filter(Boolean)
        .slice(0, 4)
    : [];

  const itemsCount =
    Array.isArray(order.items) && order.items.length
      ? order.items.reduce((sum: number, it: any) => sum + (Number(it.qty) || 1), 0)
      : order.itemsCount || 0;

  return (
    <div
      className="card"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      style={{
        padding: "1rem",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "1rem",
        alignItems: "center",
        cursor: "pointer",
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", minWidth: 0 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: meta.bg,
            border: `1px solid ${meta.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: meta.color,
            flex: "0 0 auto",
          }}
        >
          <Icon size={20} />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontWeight: 950, fontSize: 15 }}>{order.id}</div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                padding: "2px 10px",
                borderRadius: 999,
                background: meta.bg,
                border: `1px solid ${meta.border}`,
                color: meta.color,
              }}
            >
              {statusLabel}
            </span>
          </div>

          <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 600, marginTop: 4 }}>
            {formatDate(order.createdAt, app?.language)}
            {itemsCount ? ` · ${itemsCount} ${tr("tilesUnit", "tiles")}` : ""}
            {order.total != null ? ` · ${formatMoney(order.total, order.currency)}` : ""}
          </div>

          {previews.length > 0 && (
            <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.6rem" }}>
              {previews.map((src, idx) => (
                <div
                  key={`${order.id}-pv-${idx}`}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    background: "#F3F4F6",
                    flex: "0 0 auto",
                  }}
                >
                  <img src={src} alt="tile preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className="btn btn-text"
        style={{
          fontWeight: 950,
          padding: "0.6rem 0.85rem",
          borderRadius: 999,
          border: "1px solid var(--border)",
          background: "white",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
      >
        {tr("viewOrder", "View")}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
