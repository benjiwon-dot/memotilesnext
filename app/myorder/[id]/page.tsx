"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import { getOrders } from "@/utils/orders";
import {
  ArrowLeft,
  AlertCircle,
  MapPin,
  ChevronRight,
  X,
  Mail,
} from "lucide-react";

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

type ShippingAddress = {
  fullName?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

type Order = {
  id: string;
  createdAt?: string | number | Date;
  status?: string;
  currency?: string; // "฿" or "THB"
  total?: number;
  items?: OrderItem[];
  itemsCount?: number;

  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  shippingCarrier?: string;
};

function normalizeStatus(raw?: string): OrderStatus {
  const v = (raw || "").toLowerCase();
  if (v === "paid") return "paid";
  if (v.includes("print") && v.includes("ing")) return "printing";
  if (v === "printed") return "printed";
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
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
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

function statusPill(status: OrderStatus) {
  // “타임라인” 말고, 한 줄로 깔끔한 상태 배지
  switch (status) {
    case "paid":
      return { label: "Paid", bg: "#EFF6FF", bd: "#BFDBFE", color: "#1E40AF" };
    case "printing":
      return { label: "Printing", bg: "#F5F3FF", bd: "#DDD6FE", color: "#5B21B6" };
    case "printed":
      return { label: "Printed", bg: "#ECFDF5", bd: "#A7F3D0", color: "#065F46" };
    case "shipping":
      return { label: "Shipping", bg: "#FFFBEB", bd: "#FDE68A", color: "#92400E" };
    case "delivered":
      return { label: "Delivered", bg: "#ECFDF5", bd: "#A7F3D0", color: "#065F46" };
    case "cancelled":
      return { label: "Cancelled", bg: "#FEF2F2", bd: "#FECACA", color: "#991B1B" };
    default:
      return { label: "Processing", bg: "#F3F4F6", bd: "#E5E7EB", color: "#374151" };
  }
}

function getItemsCount(order: Order) {
  if (Array.isArray(order.items) && order.items.length) {
    return order.items.reduce((sum, it) => sum + (Number(it.qty) || 1), 0);
  }
  return order.itemsCount || 0;
}

function getPreviewImages(order: Order) {
  if (!Array.isArray(order.items)) return [];
  return order.items
    .map((it) => it.previewUrl || it.src)
    .filter(Boolean)
    .slice(0, 20) as string[];
}

function canRequestAddressChange(status: OrderStatus) {
  // printed(인쇄 완료)부터는 변경 어려움
  return status !== "printed" && status !== "shipping" && status !== "delivered" && status !== "cancelled";
}

function buildAddressText(addr?: ShippingAddress) {
  if (!addr) return "";
  const lines = [
    addr.fullName,
    addr.phone,
    addr.address1,
    addr.address2,
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", "),
    addr.country,
  ].filter(Boolean);
  return lines.join("\n");
}

export default function MyOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params?.id || "");

  const app = useApp() as any;
  const t = app?.t as ((key: string) => string) | undefined;

  const tr = (key: string, fallback: string) => {
    const v = t?.(key);
    if (!v || v === key) return fallback;
    return v;
  };

  const [order, setOrder] = useState<Order | null>(null);
  const [lightbox, setLightbox] = useState<{ open: boolean; src?: string }>({ open: false });

  useEffect(() => {
    try {
      const all = getOrders() as Order[];
      const found = Array.isArray(all) ? all.find((o) => o.id === id) : null;
      setOrder(found || null);
    } catch {
      setOrder(null);
    }
  }, [id]);

  const status = useMemo(() => normalizeStatus(order?.status), [order?.status]);
  const pill = useMemo(() => statusPill(status), [status]);

  const previews = useMemo(() => (order ? getPreviewImages(order) : []), [order]);
  const itemsCount = useMemo(() => (order ? getItemsCount(order) : 0), [order]);

  const goBack = () => router.push("/my-orders");

  const canChange = canRequestAddressChange(status);
  const supportEmail = "support@memotiles.com"; // ✅ 너희 실제 메일로 바꿔
  const subject = encodeURIComponent(`[Address change] Order ${order?.id || ""}`);
  const body = encodeURIComponent(
    [
      `Hello MEMOTILES Support,`,
      ``,
      `I would like to request an address change for my order.`,
      ``,
      `Order ID: ${order?.id || ""}`,
      `Current status: ${pill.label}`,
      ``,
      `Current address on file:`,
      buildAddressText(order?.shippingAddress) || "(not available)",
      ``,
      `New address:`,
      `(Please write your new address here)`,
      ``,
      `Thanks.`,
    ].join("\n")
  );

  const mailto = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

  if (!order) {
    return (
      <AppLayout>
        <div style={{ backgroundColor: "#F9FAFB", minHeight: "calc(100vh - 64px)", padding: "2rem 0" }}>
          <div className="container" style={{ maxWidth: 980 }}>
            <div className="card" style={{ padding: "1.25rem" }}>
              <button
                onClick={goBack}
                className="btn btn-text"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0.55rem 0.8rem",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "white",
                  fontWeight: 900,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                <ArrowLeft size={16} />
                {tr("backToMyOrders", "Back to My Orders")}
              </button>

              <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#991B1B",
                  }}
                >
                  <AlertCircle size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 950 }}>{tr("orderNotFoundTitle", "Order not found")}</div>
                  <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 600, marginTop: 4 }}>
                    {tr("orderNotFoundSubtitle", "This order may have been removed from your browser storage.")}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => router.push("/editor")}>
                  {tr("startNewOrder", "Start a new order")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ backgroundColor: "#F9FAFB", minHeight: "calc(100vh - 64px)", padding: "2rem 0" }}>
        <div className="container" style={{ maxWidth: 980 }}>
          {/* Header (예시처럼 심플) */}
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
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <button
                onClick={goBack}
                className="btn btn-text"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0.55rem 0.8rem",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "white",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                <ArrowLeft size={16} />
                {tr("myOrdersTitle", "My Orders")}
              </button>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 850 }}>
                  {tr("orderLabel", "Order")}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                  <div style={{ fontSize: 18, fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {order.id}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 700 }}>
                    {formatDate(order.createdAt, app?.language)}
                    {itemsCount ? ` · ${itemsCount} ${tr("tilesUnit", "tiles")}` : ""}
                    {order.total != null ? ` · ${formatMoney(order.total, order.currency)}` : ""}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 950,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: pill.bg,
                  border: `1px solid ${pill.bd}`,
                  color: pill.color,
                  whiteSpace: "nowrap",
                }}
              >
                {tr(
                  status === "paid"
                    ? "orderStatusPaid"
                    : status === "printing"
                    ? "orderStatusPrinting"
                    : status === "printed"
                    ? "orderStatusPrinted"
                    : status === "shipping"
                    ? "orderStatusShipping"
                    : status === "delivered"
                    ? "orderStatusDelivered"
                    : status === "cancelled"
                    ? "orderStatusCancelled"
                    : "orderStatusProcessing",
                  pill.label
                )}
              </span>

              <button
                className="btn btn-text"
                onClick={() => router.push("/support")}
                style={{
                  fontWeight: 950,
                  padding: "0.55rem 0.85rem",
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
                {tr("support", "Support")}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Main grid (예시처럼: 왼쪽 타일이 핵심) */}
          <div
            style={{
              marginTop: "0.75rem",
              display: "grid",
              gridTemplateColumns: "1.35fr 0.95fr",
              gap: "0.75rem",
              alignItems: "start",
            }}
          >
            {/* LEFT: Your tiles 크게 */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 950 }}>{tr("yourTilesTitle", "Your tiles")}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-tertiary)", fontWeight: 650 }}>
                    {itemsCount ? `${itemsCount} ${tr("tilesUnit", "tiles")}` : tr("tilePreviews", "Tile previews")}
                  </div>
                </div>

                {order.total != null && (
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 950,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid var(--border)",
                      background: "white",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatMoney(order.total, order.currency)}
                  </div>
                )}
              </div>

              {previews.length === 0 ? (
                <div
                  style={{
                    marginTop: 16,
                    padding: "1.25rem",
                    border: "1px solid var(--border)",
                    borderRadius: 18,
                    background: "white",
                    color: "var(--text-tertiary)",
                    fontWeight: 650,
                    fontSize: 13,
                  }}
                >
                  {tr("noPreviewImagesFound", "No preview images found.")}
                </div>
              ) : (
                <div
                  style={{
                    marginTop: 16,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  {previews.map((src, idx) => (
                    <button
                      key={`${order.id}-img-${idx}`}
                      type="button"
                      onClick={() => setLightbox({ open: true, src })}
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        borderRadius: 18,
                        overflow: "hidden",
                        border: "1px solid var(--border)",
                        background: "#F3F4F6",
                        aspectRatio: "1 / 1",
                        position: "relative",
                        transition: "transform 0.12s ease, box-shadow 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as any).style.transform = "translateY(-1px)";
                        (e.currentTarget as any).style.boxShadow = "0 14px 34px rgba(0,0,0,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as any).style.transform = "translateY(0)";
                        (e.currentTarget as any).style.boxShadow = "";
                      }}
                      aria-label="Open tile preview"
                    >
                      <img
                        src={src}
                        alt="tile preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Shipping + Summary (예시처럼 깔끔) */}
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {/* Shipping */}
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      background: "#F3F4F6",
                      border: "1px solid #E5E7EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#374151",
                    }}
                  >
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 950 }}>{tr("shippingSectionTitle", "Delivery address")}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-tertiary)", fontWeight: 650 }}>
                      {tr("shippingSectionSubtitle", "Where your tiles will be delivered")}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <AddressBlock addr={order.shippingAddress} />
                </div>

                {/* ✅ 버튼은 여기 딱 1개만 */}
                <div style={{ marginTop: 14 }}>
                  {canChange ? (
                    <a
                      href={mailto}
                      className="btn btn-text"
                      style={{
                        width: "100%",
                        fontWeight: 950,
                        padding: "0.8rem 0.9rem",
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        background: "white",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as any).style.background = "#F9FAFB")}
                      onMouseLeave={(e) => ((e.currentTarget as any).style.background = "white")}
                    >
                      <Mail size={18} />
                      {tr("requestAddressChange", "Request address change")}
                    </a>
                  ) : (
                    <div
                      style={{
                        marginTop: 2,
                        padding: "0.85rem 0.95rem",
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        background: "#F9FAFB",
                        color: "var(--text-tertiary)",
                        fontWeight: 700,
                        fontSize: 13,
                        lineHeight: 1.45,
                      }}
                    >
                      {tr(
                        "addressChangeNotAvailable",
                        "Address changes are usually not possible after printing starts."
                      )}
                    </div>
                  )}
                </div>

                {(order.trackingNumber || order.shippingCarrier) && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text-tertiary)" }}>
                      {tr("trackingLabel", "Tracking")}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 850 }}>
                      {order.shippingCarrier ? `${order.shippingCarrier} · ` : ""}
                      {order.trackingNumber || "-"}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: 16, fontWeight: 950 }}>{tr("orderSummaryTitle", "Order summary")}</div>

                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <KeyValue
                    label={tr("orderDateLabel", "Order date")}
                    value={formatDate(order.createdAt, app?.language) || "-"}
                  />
                  <KeyValue
                    label={tr("itemsLabel", "Items")}
                    value={itemsCount ? `${itemsCount} ${tr("tilesUnit", "tiles")}` : "-"}
                  />
                  <KeyValue
                    label={tr("statusLabel", "Status")}
                    value={tr(
                      status === "paid"
                        ? "orderStatusPaid"
                        : status === "printing"
                        ? "orderStatusPrinting"
                        : status === "printed"
                        ? "orderStatusPrinted"
                        : status === "shipping"
                        ? "orderStatusShipping"
                        : status === "delivered"
                        ? "orderStatusDelivered"
                        : status === "cancelled"
                        ? "orderStatusCancelled"
                        : "orderStatusProcessing",
                      pill.label
                    )}
                    pill={pill}
                  />
                  <KeyValue
                    label={tr("totalLabel", "Total")}
                    value={order.total != null ? formatMoney(order.total, order.currency) : "-"}
                  />
                </div>

                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text-tertiary)" }}>
                    {tr("needHelpTitle", "Need help?")}
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => router.push("/contact")}
                      style={{ width: "100%" }}
                    >
                      {tr("contactUs", "Contact us")}
                    </button>

                    <button
                      className="btn btn-text"
                      onClick={() => router.push("/support")}
                      style={{
                        width: "100%",
                        fontWeight: 950,
                        padding: "0.75rem 0.9rem",
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        background: "white",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      {tr("viewFaq", "View FAQ")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lightbox */}
          {lightbox.open && (
            <div
              role="dialog"
              aria-modal="true"
              onClick={() => setLightbox({ open: false })}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                zIndex: 99999,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "min(860px, 96vw)",
                  background: "white",
                  borderRadius: 18,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.25)",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 13, color: "#111827" }}>
                    {tr("preview", "Preview")}
                  </div>
                  <button
                    className="btn btn-text"
                    onClick={() => setLightbox({ open: false })}
                    style={{
                      padding: "0.45rem 0.6rem",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "white",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 900,
                    }}
                  >
                    <X size={16} />
                    {tr("close", "Close")}
                  </button>
                </div>

                <div style={{ background: "#0B0F19" }}>
                  <img
                    src={lightbox.src}
                    alt="preview"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

/* --------- small UI helpers --------- */

function KeyValue({
  label,
  value,
  pill,
}: {
  label: string;
  value: string;
  pill?: { bg: string; bd: string; color: string; label: string };
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text-tertiary)" }}>{label}</div>
      {pill ? (
        <span
          style={{
            fontSize: 12,
            fontWeight: 950,
            padding: "4px 10px",
            borderRadius: 999,
            background: pill.bg,
            border: `1px solid ${pill.bd}`,
            color: pill.color,
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </span>
      ) : (
        <div style={{ fontSize: 13, fontWeight: 900, whiteSpace: "nowrap" }}>{value}</div>
      )}
    </div>
  );
}

function AddressBlock({ addr }: { addr?: ShippingAddress }) {
  const app = useApp() as any;
  const t = app?.t as ((key: string) => string) | undefined;

  const tr = (key: string, fallback: string) => {
    const v = t?.(key);
    if (!v || v === key) return fallback;
    return v;
  };

  if (!addr) {
    return (
      <div
        style={{
          padding: "1rem",
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: "white",
          color: "var(--text-tertiary)",
          fontWeight: 650,
          lineHeight: 1.6,
          fontSize: 13,
        }}
      >
        {tr("shippingAddressNotAvailable", "Shipping address is not available yet.")}
      </div>
    );
  }

  const lines = [
    addr.fullName,
    addr.phone,
    addr.address1,
    addr.address2,
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", "),
    addr.country,
  ].filter(Boolean);

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: 18,
        border: "1px solid var(--border)",
        background: "white",
        fontWeight: 750,
        lineHeight: 1.7,
        fontSize: 13,
      }}
    >
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}
