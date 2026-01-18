"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import { getOrders } from "@/utils/orders";
import {
  ArrowLeft,
  CreditCard,
  Printer,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  MessageCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type OrderStatus =
  | "paid"
  | "processing"
  | "printing"
  | "printed"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "unknown";

type OrderItem = {
  id: string;
  previewUrl?: string | null;
  src?: string | null;
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
  // 로컬/서버 혼재 가능
  id: string;                 // localId or firestoreId
  firestoreId?: string;       // 서버 docId
  displayId?: string;         // ORD-xxxx
  createdAt?: string | number | Date;
  status?: string;
  currency?: string;
  total?: number;
  items?: OrderItem[];
  itemsCount?: number;

  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  shippingCarrier?: string;

  ownerUid?: string;
};

function normalizeStatus(raw?: string): OrderStatus {
  const v = (raw || "").toLowerCase().trim();
  if (v === "paid") return "paid";
  if (v === "processing") return "processing";
  if (v.includes("print") && v.includes("ing")) return "printing";
  if (v === "printed") return "printed";
  if (v.includes("ship")) return "shipping";
  if (v.includes("deliver")) return "delivered";
  if (v.includes("cancel")) return "cancelled";
  return "unknown";
}

/** ✅ locale 강제: EN -> en-US, TH -> th-TH */
function formatDate(d?: Order["createdAt"], locale: "EN" | "TH" = "EN") {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const loc = locale === "TH" ? "th-TH" : "en-US";
  return date.toLocaleDateString(loc, { year: "numeric", month: "short", day: "2-digit" });
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

function statusMeta(status: OrderStatus, tt: (k: string, fb: string) => string) {
  switch (status) {
    case "paid":
      return { label: tt("statusPaid", "Paid"), icon: CreditCard, bg: "#EFF6FF", border: "#BFDBFE", color: "#1E40AF" };
    case "processing":
      return { label: tt("statusProcessing", "Processing"), icon: Printer, bg: "#F5F3FF", border: "#DDD6FE", color: "#5B21B6" };
    case "printing":
      return { label: tt("statusPrinting", "Printing"), icon: Printer, bg: "#F5F3FF", border: "#DDD6FE", color: "#5B21B6" };
    case "printed":
      return { label: tt("statusPrinted", "Printed"), icon: Package, bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46" };
    case "shipping":
      return { label: tt("statusShipping", "Shipping"), icon: Truck, bg: "#FFFBEB", border: "#FDE68A", color: "#92400E" };
    case "delivered":
      return { label: tt("statusDelivered", "Delivered"), icon: CheckCircle2, bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46" };
    case "cancelled":
      return { label: tt("statusCancelled", "Cancelled"), icon: AlertCircle, bg: "#FEF2F2", border: "#FECACA", color: "#991B1B" };
    default:
      return { label: tt("statusProcessing", "Processing"), icon: Package, bg: "#F3F4F6", border: "#E5E7EB", color: "#374151" };
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
    .slice(0, 24) as string[];
}

/**
 * ✅ 주문 매칭(중요)
 * - my-orders에서 넘어오는 id(= firestoreId || id) 를 기준으로,
 *   상세에서 어떤 키로 저장되어 있든 찾아야 함.
 */
function isOrderMatch(order: any, targetId: string) {
  const t = String(targetId || "").trim();
  if (!t) return false;

  const a = String(order?.firestoreId || "").trim();
  const b = String(order?.id || "").trim();
  const c = String(order?.displayId || "").trim();

  return a === t || b === t || c === t;
}

/** ✅ fallback: localStorage 전체를 훑어서 orderId를 찾는다. */
function findOrderByScanningStorage(orderId: string): Order | null {
  if (typeof window === "undefined") return null;

  try {
    const keys = Object.keys(localStorage);
    const targetKeys = keys.filter((k) => k === "memotiles_orders" || k.startsWith("memotiles_orders__"));

    for (const k of targetKeys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) continue;

      const found = list.find((o: any) => isOrderMatch(o, orderId));
      if (found) return found as Order;
    }
  } catch {}

  return null;
}

export default function MyOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const app = useApp() as any;

  // ✅ t가 함수든 객체든 안전하게 처리 (my-orders와 동일 스타일)
  const tt = useCallback(
    (key: string, fallback: string) => {
      const maybeT = app?.t;
      if (typeof maybeT === "function") {
        const v = maybeT(key);
        return typeof v === "string" && v.trim() && v !== key ? v : fallback;
      }
      if (maybeT && typeof maybeT === "object") {
        const v = maybeT[key];
        return typeof v === "string" && v.trim() && v !== key ? v : fallback;
      }
      return fallback;
    },
    [app?.t]
  );

  const locale = (app?.locale || "EN") as "EN" | "TH";
  const id = decodeURIComponent(params?.id || "");

  const [order, setOrder] = useState<Order | null>(null);

  // ✅ Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  // ✅ auth 확정 후 로드
  useEffect(() => {
    if (app?.authLoading !== false) return;

    if (!app?.user) {
      const nextPath = `/myorder/${encodeURIComponent(id)}`;
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    // 0) context orders 먼저 (my-orders에서 이미 가지고 있을 수 있음)
    const contextOrders: Order[] = (app?.orders || app?.myOrders || []) as Order[];
    if (Array.isArray(contextOrders) && contextOrders.length) {
      const found = contextOrders.find((o: any) => isOrderMatch(o, id));
      if (found) {
        setOrder(found);
        return;
      }
    }

    const uid = String(app.user.uid || "").trim();
    if (!uid) return;

    // 1) 정상 경로: uid scoped localStorage (getOrders)
    try {
      const all = getOrders(uid) as Order[];
      const found = Array.isArray(all) ? all.find((o: any) => isOrderMatch(o, id)) : null;
      if (found) {
        setOrder(found);
        return;
      }
    } catch {}

    // 2) fallback: storage scan
    const scanned = findOrderByScanningStorage(id);
    setOrder(scanned || null);
  }, [app?.authLoading, app?.user, id, router, app?.orders, app?.myOrders]);

  const status = useMemo(() => normalizeStatus(order?.status), [order?.status]);
  const meta = useMemo(() => statusMeta(status, tt), [status, tt]);
  const Icon = meta.icon;

  const previews = useMemo(() => (order ? getPreviewImages(order) : []), [order]);
  const itemsCount = useMemo(() => (order ? getItemsCount(order) : 0), [order]);

  const goBack = () => router.push("/my-orders");

  const openLightbox = useCallback(
    (idx: number) => {
      setActiveIdx(Math.max(0, Math.min(idx, previews.length - 1)));
      setLightboxOpen(true);
    },
    [previews.length]
  );

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const goPrev = useCallback(() => {
    setActiveIdx((v) => {
      const n = previews.length;
      if (n <= 1) return v;
      return (v - 1 + n) % n;
    });
  }, [previews.length]);

  const goNext = useCallback(() => {
    setActiveIdx((v) => {
      const n = previews.length;
      if (n <= 1) return v;
      return (v + 1) % n;
    });
  }, [previews.length]);

  // ✅ Keyboard support (esc / arrows)
  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, closeLightbox, goPrev, goNext]);

  // ✅ auth 확인 중이면 로딩
  if (app?.authLoading !== false) {
    return (
      <AppLayout>
        <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" }}>
          <span style={{ color: "var(--text-tertiary)", fontWeight: 700 }}>
            {tt("loading", "Loading...")}
          </span>
        </div>
      </AppLayout>
    );
  }

  // ✅ 주문 못 찾음
  if (!order) {
    return (
      <AppLayout>
        <div style={{ backgroundColor: "#F9FAFB", minHeight: "calc(100vh - 64px)", padding: "2rem 0" }}>
          <div className="container" style={{ maxWidth: 980 }}>
            <div className="card" style={{ padding: "1.25rem" }}>
              <button
                onClick={goBack}
                className="btn btn-text"
                style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 950 }}
              >
                <ArrowLeft size={18} />
                {tt("backToMyOrders", "Back to My Orders")}
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
                    flex: "0 0 auto",
                  }}
                >
                  <AlertCircle size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 950 }}>
                    {tt("orderNotFound", "Order not found")}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 600, marginTop: 4, lineHeight: 1.5 }}>
                    {tt("orderNotFoundDesc", "This order may have been stored under a different browser key.")}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 700, marginTop: 8 }}>
                    {tt("order", "Order")}: <span style={{ fontWeight: 900 }}>{id}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => router.push("/editor")}>
                  {tt("startNewOrderCta", tt("startNewOrder", "Start a new order"))}
                </button>
                <button className="btn btn-text" onClick={goBack} style={{ fontWeight: 950 }}>
                  {tt("myOrders", "My Orders")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const activeSrc = previews[activeIdx] || "";
  const displayOrderId = order.displayId || order.firestoreId || order.id;

  return (
    <AppLayout>
      <div style={{ backgroundColor: "#F9FAFB", minHeight: "calc(100vh - 64px)", padding: "2rem 0" }}>
        <div className="container" style={{ maxWidth: 980 }}>
          {/* ✅ Top header (뒤로가기 + 주문번호 + 상태 + 도움) */}
          <div
            className="card"
            style={{
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
              <button
                onClick={goBack}
                className="btn btn-text"
                style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 950 }}
              >
                <ArrowLeft size={18} />
                {tt("myOrders", "My Orders")}
              </button>

              <div style={{ width: 1, height: 28, background: "var(--border)" }} />

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 800 }}>
                  {tt("order", "Order")}
                </div>
                <div style={{ fontSize: 16, fontWeight: 950, wordBreak: "break-all" }}>
                  {displayOrderId}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: meta.bg,
                  border: `1px solid ${meta.border}`,
                  color: meta.color,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Icon size={16} />
                {meta.label}
              </span>

              <button
                className="btn btn-text"
                onClick={() => router.push("/support")}
                style={{ fontWeight: 950, display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <MessageCircle size={16} />
                {tt("needHelp", "Need help?")}
              </button>
            </div>
          </div>

          {/* ✅ Main: 반응형(모바일 1컬럼 / 데스크탑 2컬럼) */}
          <div className="myorder-grid" style={{ marginTop: "0.75rem" }}>
            {/* Left: Photos (상단) */}
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 950 }}>{tt("yourTiles", "Your tiles")}</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-tertiary)", fontWeight: 650 }}>
                      {itemsCount ? `${itemsCount} ${tt("tilesUnit", "tiles")}` : tt("tilePreviews", "Tile previews")}
                      {order.createdAt ? (
                        <span style={{ marginLeft: 10, fontWeight: 800 }}>
                          · {formatDate(order.createdAt, locale)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 950, whiteSpace: "nowrap" }}>
                    {order.total != null ? formatMoney(order.total, order.currency) : ""}
                  </div>
                </div>

                {previews.length === 0 ? (
                  <div style={{ marginTop: 16, padding: "1.25rem", border: "1px solid var(--border)", borderRadius: 16, background: "white" }}>
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 650 }}>
                      {tt("noPreviewImages", "No preview images found.")}
                    </div>
                  </div>
                ) : (
                  <div className="myorder-thumbgrid" style={{ marginTop: 16 }}>
                    {previews.map((src, idx) => (
                      <button
                        key={`${order.id}-img-${idx}`}
                        type="button"
                        onClick={() => openLightbox(idx)}
                        aria-label={`Open preview ${idx + 1}`}
                        style={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          borderRadius: 16,
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                          background: "#F3F4F6",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
            </div>

            {/* Right: Shipping + Summary + Help */}
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
                    <div style={{ fontSize: 16, fontWeight: 950 }}>{tt("shippingTitle", "Shipping")}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-tertiary)", fontWeight: 650 }}>
                      {tt("shippingSubtitle", "Where your tiles will be delivered")}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <AddressBlock addr={order.shippingAddress} />
                </div>

                {(order.trackingNumber || order.shippingCarrier) && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text-tertiary)" }}>
                      {tt("tracking", "Tracking")}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800 }}>
                      {order.shippingCarrier ? `${order.shippingCarrier} · ` : ""}
                      {order.trackingNumber || "-"}
                    </div>
                  </div>
                )}
              </div>

              {/* Order summary */}
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: 16, fontWeight: 950 }}>{tt("orderSummary", "Order summary")}</div>

                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <KeyValue label={tt("orderDate", "Order date")} value={formatDate(order.createdAt, locale) || "-"} />
                  <KeyValue
                    label={tt("items", "Items")}
                    value={itemsCount ? `${itemsCount} ${tt("tilesUnit", "tiles")}` : "-"}
                  />
                  <KeyValue
                    label={tt("orderStatus", "Status")}
                    value={meta.label}
                    pill={{ bg: meta.bg, bd: meta.border, color: meta.color }}
                  />
                  <KeyValue
                    label={tt("total", "Total")}
                    value={order.total != null ? formatMoney(order.total, order.currency) : "-"}
                  />
                </div>
              </div>

              {/* Help */}
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 950 }}>{tt("needHelp", "Need help?")}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-tertiary)", fontWeight: 650 }}>
                      {displayOrderId ? `Order ID: ${displayOrderId}` : ""}
                    </div>
                  </div>

                  <MessageCircle size={18} color="var(--text-tertiary)" />
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <button className="btn btn-primary" onClick={() => router.push("/contact")} style={{ width: "100%" }}>
                    {tt("contactUs", "Contact us")}
                  </button>
                  <button className="btn btn-text" onClick={() => router.push("/support")} style={{ width: "100%", fontWeight: 950 }}>
                    {tt("viewFAQ", "View FAQ")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ responsive style (파일 내 인라인) */}
          <style jsx>{`
            .myorder-grid {
              display: grid;
              grid-template-columns: 1.4fr 0.9fr;
              gap: 0.75rem;
            }
            .myorder-thumbgrid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 10px;
            }
            @media (max-width: 920px) {
              .myorder-grid {
                grid-template-columns: 1fr;
              }
              .myorder-thumbgrid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
              }
            }
            @media (max-width: 520px) {
              .myorder-thumbgrid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }
          `}</style>
        </div>

        {/* ✅ Lightbox overlay */}
        {lightboxOpen && (
          <div
            role="dialog"
            aria-modal="true"
            onClick={closeLightbox}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.72)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(980px, 96vw)",
                height: "min(720px, 88vh)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 18,
                overflow: "hidden",
                position: "relative",
                backdropFilter: "blur(6px)",
              }}
            >
              {/* Top bar */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  right: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: "rgba(255,255,255,0.85)",
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    padding: "6px 10px",
                    borderRadius: 999,
                  }}
                >
                  {previews.length ? `${activeIdx + 1} / ${previews.length}` : ""}
                </div>

                <button
                  type="button"
                  onClick={closeLightbox}
                  aria-label="Close"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(0,0,0,0.35)",
                    color: "rgba(255,255,255,0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Image */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 18,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSrc}
                  alt="tile preview large"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.06)",
                  }}
                />
              </div>

              {/* Arrows */}
              {previews.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous"
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(0,0,0,0.35)",
                      color: "rgba(255,255,255,0.92)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      zIndex: 2,
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next"
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(0,0,0,0.35)",
                      color: "rgba(255,255,255,0.92)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      zIndex: 2,
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
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
  pill?: { bg: string; bd: string; color: string };
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
          }}
        >
          {value}
        </span>
      ) : (
        <div style={{ fontSize: 13, fontWeight: 900 }}>{value}</div>
      )}
    </div>
  );
}

function AddressBlock({ addr }: { addr?: ShippingAddress }) {
  if (!addr) {
    return (
      <div
        style={{
          padding: "1rem",
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "white",
          color: "var(--text-tertiary)",
          fontWeight: 650,
          lineHeight: 1.6,
          fontSize: 13,
        }}
      >
        -
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
        borderRadius: 16,
        border: "1px solid var(--border)",
        background: "white",
        fontWeight: 700,
        lineHeight: 1.7,
        fontSize: 13,
      }}
    >
      {lines.length ? lines.map((l, i) => <div key={i}>{l}</div>) : <div>-</div>}
    </div>
  );
}
