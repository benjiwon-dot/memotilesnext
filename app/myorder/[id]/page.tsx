"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Clock,
  ShieldCheck,
  MessageCircle,
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
  id: string;
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
  // 기존 UI에서 printing을 쓰던 흔적도 흡수
  if (v.includes("print") && v.includes("ing")) return "printing";
  if (v === "printed") return "printed";
  if (v.includes("ship")) return "shipping";
  if (v.includes("deliver")) return "delivered";
  if (v.includes("cancel")) return "cancelled";
  return "unknown";
}

function formatDate(d?: Order["createdAt"]) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
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
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: c,
    }).format(total);
  } catch {
    return `${c}${total.toFixed(2)}`;
  }
}

function statusMeta(status: OrderStatus) {
  switch (status) {
    case "paid":
      return {
        label: "Paid",
        icon: CreditCard,
        bg: "#EFF6FF",
        border: "#BFDBFE",
        color: "#1E40AF",
      };
    case "processing":
    case "printing":
      return {
        label: status === "processing" ? "Processing" : "Printing",
        icon: Printer,
        bg: "#F5F3FF",
        border: "#DDD6FE",
        color: "#5B21B6",
      };
    case "printed":
      return {
        label: "Printed",
        icon: Package,
        bg: "#ECFDF5",
        border: "#A7F3D0",
        color: "#065F46",
      };
    case "shipping":
      return {
        label: "Shipping",
        icon: Truck,
        bg: "#FFFBEB",
        border: "#FDE68A",
        color: "#92400E",
      };
    case "delivered":
      return {
        label: "Delivered",
        icon: CheckCircle2,
        bg: "#ECFDF5",
        border: "#A7F3D0",
        color: "#065F46",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        icon: AlertCircle,
        bg: "#FEF2F2",
        border: "#FECACA",
        color: "#991B1B",
      };
    default:
      return {
        label: "Processing",
        icon: Package,
        bg: "#F3F4F6",
        border: "#E5E7EB",
        color: "#374151",
      };
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
    .slice(0, 12) as string[];
}

function buildStatusSteps(current: OrderStatus) {
  const base = [
    { key: "paid", label: "Paid" },
    { key: "printing", label: "Printing" },
    { key: "shipping", label: "Shipping" },
    { key: "delivered", label: "Delivered" },
  ] as const;

  if (current === "cancelled") {
    return base.map((s) => ({ ...s, state: s.key === "paid" ? "done" : "todo" })) as any;
  }

  // processing도 printing 단계로 취급
  const currentMapped: OrderStatus = current === "processing" ? "printing" : current;

  const order = ["paid", "printing", "shipping", "delivered"] as OrderStatus[];
  const idx = order.indexOf(currentMapped);
  return base.map((s, i) => {
    if (idx === -1) return { ...s, state: i === 0 ? "active" : "todo" };
    if (i < idx) return { ...s, state: "done" };
    if (i === idx) return { ...s, state: "active" };
    return { ...s, state: "todo" };
  });
}

/**
 * ✅ fallback: localStorage 전체를 훑어서 orderId를 찾는다.
 * - uid 키가 꼬였거나, 예전 키(guest/base)로 저장된 주문도 찾을 수 있음
 */
function findOrderByScanningStorage(orderId: string): Order | null {
  if (typeof window === "undefined") return null;

  try {
    const keys = Object.keys(localStorage);
    const targetKeys = keys.filter(
      (k) => k === "memotiles_orders" || k.startsWith("memotiles_orders__")
    );

    for (const k of targetKeys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) continue;
      const found = list.find((o: any) => String(o?.id) === orderId);
      if (found) return found as Order;
    }
  } catch {}

  return null;
}

export default function MyOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const app = useApp() as any;

  const id = decodeURIComponent(params?.id || "");

  const [order, setOrder] = useState<Order | null>(null);

  // ✅ my-orders와 같은 방식으로 auth 확정 후 로드
  useEffect(() => {
    if (app?.authLoading !== false) return;

    // 로그인 안됐으면 my-orders처럼 로그인으로
    if (!app?.user) {
      router.replace(`/login?next=${encodeURIComponent(`/myorder/${encodeURIComponent(id)}`)}`);
      return;
    }

    const uid = String(app.user.uid || "").trim();
    if (!uid) return;

    // 1) 정상 경로: uid scoped
    try {
      const all = getOrders(uid) as Order[];
      const found = Array.isArray(all) ? all.find((o) => o.id === id) : null;
      if (found) {
        setOrder(found || null);
        return;
      }
    } catch {}

    // 2) fallback: storage scan
    const scanned = findOrderByScanningStorage(id);
    setOrder(scanned || null);
  }, [app?.authLoading, app?.user, id, router]);

  const status = useMemo(() => normalizeStatus(order?.status), [order?.status]);
  const meta = useMemo(() => statusMeta(status), [status]);
  const Icon = meta.icon;

  const previews = useMemo(() => (order ? getPreviewImages(order) : []), [order]);
  const itemsCount = useMemo(() => (order ? getItemsCount(order) : 0), [order]);
  const steps = useMemo(() => buildStatusSteps(status), [status]);

  const goBack = () => router.push("/my-orders");

  // auth 확인 중이면 로딩
  if (app?.authLoading !== false) {
    return (
      <AppLayout>
        <div
          style={{
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F9FAFB",
          }}
        >
          <span style={{ color: "var(--text-tertiary)", fontWeight: 700 }}>Loading...</span>
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div style={{ backgroundColor: "#F9FAFB", minHeight: "calc(100vh - 64px)", padding: "2rem 0" }}>
          <div className="container" style={{ maxWidth: 980 }}>
            <div className="card" style={{ padding: "1.25rem" }}>
              <button
                onClick={goBack}
                className="btn btn-text"
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <ArrowLeft size={18} />
                Back to My Orders
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
                  <div style={{ fontSize: 18, fontWeight: 950 }}>Order not found</div>
                  <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 600, marginTop: 4 }}>
                    This order may have been stored under a different browser key.
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-tertiary)", fontWeight: 650 }}>
                Debug tip: check localStorage keys starting with <b>memotiles_orders</b>.
              </div>

              <div style={{ marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => router.push("/editor")}>
                  Start a new order
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
          {/* Top header */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={goBack}
                className="btn btn-text"
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <ArrowLeft size={18} />
                My Orders
              </button>

              <div style={{ width: 1, height: 28, background: "var(--border)" }} />

              <div>
                <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 800 }}>Order</div>
                <div style={{ fontSize: 18, fontWeight: 950 }}>{order.id}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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

              <button className="btn btn-text" onClick={() => router.push("/support")} style={{ fontWeight: 950 }}>
                Support
              </button>
            </div>
          </div>

          {/* Main grid */}
          <div
            style={{
              marginTop: "0.75rem",
              display: "grid",
              gridTemplateColumns: "1.4fr 0.9fr",
              gap: "0.75rem",
            }}
          >
            {/* Left: status + photos */}
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {/* Status timeline */}
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 950 }}>Delivery status</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-tertiary)", fontWeight: 650 }}>
                      Updated from your latest order state.
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 800 }}>
                    {formatDate(order.createdAt)}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 10,
                  }}
                >
                  {steps.map((s: any) => {
                    const state = s.state as "done" | "active" | "todo";
                    const bg = state === "done" ? "#ECFDF5" : state === "active" ? "#EFF6FF" : "#F3F4F6";
                    const bd = state === "done" ? "#A7F3D0" : state === "active" ? "#BFDBFE" : "#E5E7EB";
                    const color = state === "done" ? "#065F46" : state === "active" ? "#1E40AF" : "#374151";
                    return (
                      <div
                        key={s.key}
                        style={{
                          padding: "0.9rem",
                          borderRadius: 16,
                          border: `1px solid ${bd}`,
                          background: bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 950, color }}>{s.label}</div>
                          <div
                            style={{
                              fontSize: 12,
                              marginTop: 4,
                              color: "rgba(0,0,0,0.45)",
                              fontWeight: 700,
                            }}
                          >
                            {state === "done" ? "Done" : state === "active" ? "In progress" : "Next"}
                          </div>
                        </div>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 10,
                            border: `1px solid ${bd}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color,
                            background: "rgba(255,255,255,0.7)",
                            flex: "0 0 auto",
                          }}
                        >
                          {state === "done" ? <CheckCircle2 size={16} /> : <Package size={16} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <InfoPill icon={Clock} text="Typical delivery: within ~5 days" />
                  <InfoPill icon={ShieldCheck} text="Re-stickable tiles · wall-safe adhesive" />
                </div>
              </div>

              {/* Photos */}
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 950 }}>Your tiles</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-tertiary)", fontWeight: 650 }}>
                      {itemsCount ? `${itemsCount} tiles` : "Tile previews"}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 950 }}>
                    {order.total != null ? formatMoney(order.total, order.currency) : ""}
                  </div>
                </div>

                {previews.length === 0 ? (
                  <div
                    style={{
                      marginTop: 16,
                      padding: "1.25rem",
                      border: "1px solid var(--border)",
                      borderRadius: 16,
                      background: "white",
                    }}
                  >
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 650 }}>
                      No preview images found.
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 16,
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                      gap: 10,
                    }}
                  >
                    {previews.map((src, idx) => (
                      <div
                        key={`${order.id}-img-${idx}`}
                        style={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          borderRadius: 16,
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                          background: "#F3F4F6",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="tile preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: address + summary + help */}
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
                    <div style={{ fontSize: 16, fontWeight: 950 }}>Shipping</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-tertiary)", fontWeight: 650 }}>
                      Where your tiles will be delivered
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <AddressBlock addr={order.shippingAddress} />
                </div>

                {(order.trackingNumber || order.shippingCarrier) && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text-tertiary)" }}>Tracking</div>
                    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800 }}>
                      {order.shippingCarrier ? `${order.shippingCarrier} · ` : ""}
                      {order.trackingNumber || "-"}
                    </div>
                  </div>
                )}
              </div>

              {/* Order summary */}
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: 16, fontWeight: 950 }}>Order summary</div>

                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <KeyValue label="Order date" value={formatDate(order.createdAt) || "-"} />
                  <KeyValue label="Items" value={itemsCount ? `${itemsCount} tiles` : "-"} />
                  <KeyValue label="Status" value={meta.label} pill={{ bg: meta.bg, bd: meta.border, color: meta.color }} />
                  <KeyValue label="Total" value={order.total != null ? formatMoney(order.total, order.currency) : "-"} />
                </div>

                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text-tertiary)" }}>Good to know</div>
                  <ul
                    style={{
                      marginTop: 10,
                      paddingLeft: 18,
                      color: "var(--text-tertiary)",
                      fontWeight: 650,
                      lineHeight: 1.7,
                    }}
                  >
                    <li>Once printing starts, changes may not be possible.</li>
                    <li>If your tiles fall off, contact support — we’ll help.</li>
                    <li>Keep your order ID for faster support.</li>
                  </ul>
                </div>
              </div>

              {/* Help */}
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 950 }}>Need help?</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-tertiary)", fontWeight: 650 }}>
                      Contact support with your order ID.
                    </div>
                  </div>

                  <MessageCircle size={18} color="var(--text-tertiary)" />
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <button className="btn btn-primary" onClick={() => router.push("/contact")} style={{ width: "100%" }}>
                    Contact us
                  </button>
                  <button className="btn btn-text" onClick={() => router.push("/support")} style={{ width: "100%", fontWeight: 950 }}>
                    View FAQ
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-tertiary)", fontWeight: 650 }}>
            Tip: For true admin sync, connect orders to Firestore and fetch by order ID here.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* --------- small UI helpers --------- */

function InfoPill({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "white",
        fontSize: 12,
        fontWeight: 800,
        color: "var(--text-tertiary)",
      }}
    >
      <Icon size={14} />
      {text}
    </div>
  );
}

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
        Shipping address is not available yet.
        <br />
        (Add it during checkout and save into the order object.)
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
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}
