"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";

// ✅ localStorage orders를 직접 읽기
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
  previewUrl?: string; // legacy / crop preview
  src?: string; // normalized key (editor/checkout에서 쓰는 경우)
  qty?: number;
};

type Order = {
  id: string;                 // localId or firestoreId (로컬은 localId)
  displayId?: string;         // ✅ 추가 (ORD-YYYYMMDD-0001)
  firestoreId?: string;       // ✅ 추가 (서버에서 만든 공식 docId)
  createdAt?: string | number | Date;
  status?: string;
  currency?: string; // "฿" or "THB"
  total?: number;
  items?: OrderItem[];
  itemsCount?: number;
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

// ✅ locale 강제 (EN/TH)
function formatDate(d?: Order["createdAt"], locale: "EN" | "TH" = "EN") {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const loc = locale === "TH" ? "th-TH" : "en-US";
  return date.toLocaleDateString(loc, {
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
    case "printing":
      return {
        label: "Printing",
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
        icon: Package,
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

export default function MyOrdersPage() {
  const router = useRouter();
  const app = useApp() as any;

  // ✅ t: 함수/객체 모두 지원
  const tr = (key: string, fallback: string) => {
    const maybeT = app?.t;
    if (typeof maybeT === "function") {
      const v = maybeT(key);
      if (!v || v === key) return fallback;
      return v;
    }
    if (maybeT && typeof maybeT === "object") {
      const v = maybeT[key];
      if (!v || v === key) return fallback;
      return v;
    }
    return fallback;
  };

  const locale = (app?.locale || "EN") as "EN" | "TH";

  // ✅ my-orders guard: authLoading이 "false로 확정"된 뒤에만 판단
  const nextPath = "/my-orders";
  const redirectingRef = useRef(false);

  // ✅✅✅ 반드시 return 위에: useState / useEffect / useMemo 전부
  const [ordersState, setOrdersState] = useState<Order[]>([]);
  const [query, setQuery] = useState("");

  // 1) 로그인 리다이렉트
  useEffect(() => {
    if (redirectingRef.current) return;
    if (app?.authLoading !== false) return;

    if (!app?.user) {
      redirectingRef.current = true;
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [app?.authLoading, app?.user, router]);

  // 2) 주문 로드 (context 우선, 없으면 localStorage)
  useEffect(() => {
    if (app?.authLoading !== false) return;
    if (!app?.user) return;
    if (redirectingRef.current) return;

    const contextOrders: Order[] = (app?.orders || app?.myOrders || []) as Order[];
    if (Array.isArray(contextOrders) && contextOrders.length) {
      setOrdersState(contextOrders);
      return;
    }

    try {
      const stored = getOrders(app.user.uid);
      if (Array.isArray(stored)) setOrdersState(stored as Order[]);
      else setOrdersState([]);
    } catch {
      setOrdersState([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.authLoading, app?.user]);

  // ✅✅✅ useMemo도 return 위에서 항상 실행되게!
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

  // ✅✅✅ 검색: displayId도 포함
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const a = (o.displayId || "").toLowerCase();
      const b = (o.id || "").toLowerCase();
      return a.includes(q) || b.includes(q);
    });
  }, [orders, query]);

  // ✅ 로그인 확인 중이거나 리다이렉트 중이면 화면 노출 최소화
  if (app?.authLoading !== false || redirectingRef.current || !app?.user) {
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
          {app?.authLoading !== false ? (
            <span style={{ color: "var(--text-tertiary)", fontWeight: 700 }}>
              {tr("loading", "Loading...")}
            </span>
          ) : null}
        </div>
      </AppLayout>
    );
  }

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
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={goHome}
                className="btn btn-text"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <ArrowLeft size={18} />
                {tr("home", "Home")}
              </button>

              <div style={{ width: 1, height: 28, background: "var(--border)" }} />

              <div>
                <div style={{ fontSize: "1.25rem", fontWeight: 900 }}>
                  {tr("myOrdersTitle", "My Orders")}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600 }}>
                  {tr("myOrdersSubtitle", "Your paid orders and delivery status updates.")}
                </div>
              </div>
            </div>

            {/* Search */}
            <div
              style={{
                minWidth: 300,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 0.75rem",
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
              label={tr("ordersSummaryActive", "Active")}
              value={summary.active}
              helper={tr("ordersSummaryActiveHelper", "Paid / Printing / Shipping")}
            />
            <SummaryCard
              label={tr("ordersSummaryDelivered", "Delivered")}
              value={summary.delivered}
              helper={tr("ordersSummaryDeliveredHelper", "Completed orders")}
            />
            <SummaryCard
              label={tr("ordersSummaryTotal", "Total")}
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

                <div style={{ fontSize: 20, fontWeight: 950 }}>
                  {tr("noOrdersTitle", "No orders yet")}
                </div>
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
                      // ✅ 공식 Firestore id가 있으면 그걸로 상세 페이지 이동 (권장)
                      onOpen={() => {
                        const targetId = o.firestoreId || o.id;
                        router.push(`/myorder/${encodeURIComponent(targetId)}`);
                      }}
                      locale={locale}
                      tr={tr}
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

function OrderRow({
  order,
  onOpen,
  locale,
  tr,
}: {
  order: any;
  onOpen: () => void;
  locale: "EN" | "TH";
  tr: (key: string, fallback: string) => string;
}) {
  const s = normalizeStatus(order.status);
  const meta = statusMeta(s);
  const Icon = meta.icon;

  const statusLabel = (() => {
    switch (s) {
      case "paid":
        return tr("statusPaid", "Paid");
      case "printing":
        return tr("statusPrinting", "Printing");
      case "printed":
        return tr("statusPrinted", "Printed");
      case "shipping":
        return tr("statusShipping", "Shipping");
      case "delivered":
        return tr("statusDelivered", "Delivered");
      case "cancelled":
        return tr("statusCancelled", "Cancelled");
      default:
        return tr("statusProcessing", "Processing");
    }
  })();

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
      style={{
        padding: "1rem",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "1rem",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
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
            {/* ✅ 표시: displayId 우선 */}
            <div style={{ fontWeight: 950, fontSize: 15 }}>
              {order.displayId || order.id}
            </div>

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
            {formatDate(order.createdAt, locale)}
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="tile preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button onClick={onOpen} className="btn btn-text" style={{ fontWeight: 950 }}>
        {tr("view", "View")} →
      </button>
    </div>
  );
}
