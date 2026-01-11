"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Download,
  Check,
  X,
  Image as ImageIcon,
  MoreHorizontal,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { getOrders, updateOrderStatus } from "@/utils/orders";

/* -------------------- CONSTANTS -------------------- */

const TABS = [
  { id: "all", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "processing", label: "Processing" },
  { id: "printed", label: "Printed" },
  { id: "shipping", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const SEARCH_FIELDS = [
  { id: "name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "id", label: "Order ID" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
];

const DATE_PRESETS = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "custom", label: "Custom Range" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  paid: { bg: "#DBEAFE", text: "#1E40AF" },
  processing: { bg: "#F3E8FF", text: "#6B21A8" },
  printed: { bg: "#FEF3C7", text: "#92400E" },
  shipping: { bg: "#E0E7FF", text: "#3730A3" },
  delivered: { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
};

type AnyOrder = any;
type AnyPhoto = any;

/* -------------------- HELPERS -------------------- */

function normalizePhone(s: string) {
  return (s || "").replace(/[^\d]/g, "");
}

function safeStr(v: any) {
  return typeof v === "string" ? v : "";
}

function sanitizePart(input: string) {
  return (input || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

// ✅ 주문의 고객/주소 정보를 “신형/구형/다른키” 모두 지원
function getCustomer(order: AnyOrder) {
  const userName =
    order?.user?.name ||
    order?.customer?.name ||
    order?.customerName ||
    order?.userName;

  const userEmail =
    order?.user?.email ||
    order?.customer?.email ||
    order?.customerEmail ||
    order?.email;

  const legacy = order?.shipping || {};
  const addr = order?.shippingAddress || {};

  const name =
    safeStr(userName) ||
    safeStr(legacy?.name) ||
    safeStr(addr?.fullName) ||
    "";
  const email =
    safeStr(userEmail) ||
    safeStr(legacy?.email) ||
    safeStr(addr?.email) ||
    "";
  const phone = safeStr(legacy?.phone) || safeStr(addr?.phone) || "";
  const instagram =
    safeStr(legacy?.instagram) || safeStr(addr?.instagram) || "";

  const address1 = safeStr(legacy?.address) || safeStr(addr?.address1) || "";
  const address2 = safeStr(addr?.address2) || safeStr(legacy?.address2) || "";
  const city = safeStr(legacy?.city) || safeStr(addr?.city) || "";
  const state = safeStr(legacy?.state) || safeStr(addr?.state) || "";
  const postalCode =
    safeStr(legacy?.postalCode) || safeStr(addr?.postalCode) || "";
  const country = safeStr(legacy?.country) || safeStr(addr?.country) || "";

  return {
    name,
    email,
    phone,
    instagram,
    address1,
    address2,
    city,
    state,
    postalCode,
    country,
  };
}

function getTileCount(order: AnyOrder) {
  if (typeof order?.qty === "number") return order.qty;
  if (typeof order?.itemsCount === "number") return order.itemsCount;
  if (Array.isArray(order?.items) && order.items.length) {
    return order.items.reduce(
      (sum: number, it: any) => sum + (Number(it?.qty) || 1),
      0
    );
  }
  return 0;
}

function getPhotoUrl(photo: AnyPhoto) {
  return photo?.previewUrl || photo?.url || photo?.src || "";
}

function downloadUrl(url: string, filename: string) {
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "photo.jpg";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function isoDateOnly(isoString: string) {
  try {
    return new Date(isoString).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

async function downloadZipFromServer(payload: {
  folderName: string;
  files: { url: string; name: string }[];
}) {
  const res = await fetch("/api/admin/photos-zip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ZIP download failed (${res.status}). ${text}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${payload.folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export default function AdminClient() {
  // Local State
  const [orders, setOrders] = useState<AnyOrder[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("name");
  const [sortOption, setSortOption] = useState("newest");

  const [dateRange, setDateRange] = useState("all");
  const [customDates, setCustomDates] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  const [lightboxPhoto, setLightboxPhoto] = useState<AnyPhoto | null>(null);

  // Multi-Select State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");

  // Selection Mode State (Photos)
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  // ✅ ZIP 다운로드 로딩/에러
  const [isZipping, setIsZipping] = useState(false);

  const refreshOrders = () => setOrders(getOrders());

  useEffect(() => {
    refreshOrders();
    window.addEventListener("storage", refreshOrders);
    return () => window.removeEventListener("storage", refreshOrders);
  }, []);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // 1) Status filter
    if (activeTab !== "all") {
      result = result.filter(
        (o) => (o.status || "").toLowerCase() === activeTab.toLowerCase()
      );
    }

    // 2) Date filter
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    result = result.filter((order) => {
      const orderDate = new Date(order.createdAt);
      if (dateRange === "all") return true;
      if (dateRange === "today") return orderDate >= startOfToday;
      if (dateRange === "7d") return orderDate >= new Date(now.getTime() - 7 * 86400000);
      if (dateRange === "30d") return orderDate >= new Date(now.getTime() - 30 * 86400000);
      if (dateRange === "custom") {
        const s = customDates.start ? new Date(customDates.start) : null;
        const e = customDates.end ? new Date(customDates.end) : null;
        if (s && orderDate < s) return false;
        if (e) {
          const endLimit = new Date(e);
          endLimit.setHours(23, 59, 59, 999);
          if (orderDate > endLimit) return false;
        }
        return true;
      }
      return true;
    });

    // 3) Search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((order) => {
        const idValue = (order.id || "").toLowerCase();
        const c = getCustomer(order);

        const nameValue = (c.name || "").toLowerCase();
        const emailValue = (c.email || "").toLowerCase();
        const phoneValue = normalizePhone(c.phone || "");
        const qPhone = normalizePhone(q);

        switch (searchField) {
          case "id":
            return idValue.includes(q);
          case "email":
            return emailValue.includes(q);
          case "phone":
            return phoneValue.includes(qPhone);
          case "name":
          default:
            return nameValue.includes(q);
        }
      });
    }

    // 4) Sorting
    result.sort((a, b) => {
      const ad = new Date(a.createdAt).getTime();
      const bd = new Date(b.createdAt).getTime();
      if (sortOption === "newest") return bd - ad;
      if (sortOption === "oldest") return ad - bd;
      return 0;
    });

    return result;
  }, [orders, activeTab, searchQuery, searchField, sortOption, dateRange, customDates]);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, { date: string; orders: AnyOrder[]; tileCount: number }> = {};
    filteredOrders.forEach((order) => {
      const dateStr = new Date(order.createdAt).toISOString().split("T")[0];
      if (!groups[dateStr]) groups[dateStr] = { date: dateStr, orders: [], tileCount: 0 };
      groups[dateStr].orders.push(order);
      groups[dateStr].tileCount += getTileCount(order);
    });
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredOrders]);

  const summary = useMemo(() => {
    const totalTiles = filteredOrders.reduce((sum, o) => sum + getTileCount(o), 0);
    return { orderCount: filteredOrders.length, tileCount: totalTiles };
  }, [filteredOrders]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId),
    [orders, selectedOrderId]
  );

  const customer = selectedOrder ? getCustomer(selectedOrder) : null;
  const items: AnyPhoto[] = Array.isArray(selectedOrder?.items) ? selectedOrder.items : [];

  // Ensure selectedOrderId stays valid and auto-select if needed
  useEffect(() => {
    if (filteredOrders.length > 0) {
      if (selectedOrderId && !filteredOrders.some((o) => o.id === selectedOrderId)) {
        setSelectedOrderId(filteredOrders[0].id);
      } else if (!selectedOrderId) {
        setSelectedOrderId(filteredOrders[0].id);
      }
    } else {
      setSelectedOrderId(null);
    }
  }, [filteredOrders, selectedOrderId]);

  // Clear selectedIds that are no longer visible
  useEffect(() => {
    const visibleIds = new Set(filteredOrders.map((o) => o.id));
    setSelectedIds((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [filteredOrders]);

  // Reset selection when changing order
  useEffect(() => {
    setIsSelectMode(false);
    setSelectedPhotoIds(new Set());
  }, [selectedOrderId]);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    if (!newStatus || newStatus === "all") return;
    updateOrderStatus(orderId, newStatus as any);
    refreshOrders();
  };

  const handleBulkStatusApply = () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    if (
      window.confirm(
        `Change status of ${selectedIds.length} orders to ${bulkStatus.toUpperCase()}?`
      )
    ) {
      selectedIds.forEach((id) => updateOrderStatus(id, bulkStatus as any));
      refreshOrders();
      setSelectedIds([]);
      setBulkStatus("");
    }
  };

  const toggleOrderSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = (checked: boolean) => {
    if (checked) setSelectedIds(filteredOrders.map((o) => o.id));
    else setSelectedIds([]);
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const handlePhotoClick = (photo: AnyPhoto) => {
    if (isSelectMode) togglePhotoSelection(photo.id);
    else setLightboxPhoto(photo);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ 기존 “개별 파일” 다운로드(유지)
  const handleDownloadAll = () => {
    if (!items?.length) return;
    items.forEach((p: any, idx: number) => {
      const url = getPhotoUrl(p);
      if (!url) return;
      const name = p?.filename || `tile-${idx + 1}.jpg`;
      setTimeout(() => downloadUrl(url, name), idx * 120);
    });
  };

  const handleDownloadSelected = () => {
    if (!items?.length) return;
    const list = items.filter((p: any, idx: number) => {
      const pid = p?.id || `photo-${idx}`;
      return selectedPhotoIds.has(pid);
    });

    list.forEach((p: any, i: number) => {
      const url = getPhotoUrl(p);
      if (!url) return;
      const name = p?.filename || `tile-${i + 1}.jpg`;
      setTimeout(() => downloadUrl(url, name), i * 120);
    });
  };

  // ✅ ZIP 다운로드: 폴더명(고객명_날짜_오더ID) 안에 01.jpg~ 로 저장
  const buildFolderName = () => {
    const cName = sanitizePart(customer?.name?.trim() ? customer!.name : "Unknown");
    const date = sanitizePart(selectedOrder?.createdAt ? isoDateOnly(selectedOrder.createdAt) : "");
    const oid = sanitizePart(selectedOrder?.id || "ORDER");
    return `${cName}_${date}_${oid}`.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  };

  const handleDownloadZipAll = async () => {
    if (!selectedOrder || !items?.length) return;

    const folderName = buildFolderName();

    const files = items
      .map((p: any, idx: number) => {
        const url = getPhotoUrl(p);
        if (!url) return null;
        const extGuess =
          (url.split("?")[0].toLowerCase().endsWith(".png") && "png") ||
          (url.split("?")[0].toLowerCase().endsWith(".webp") && "webp") ||
          (url.split("?")[0].toLowerCase().endsWith(".jpeg") && "jpg") ||
          (url.split("?")[0].toLowerCase().endsWith(".jpg") && "jpg") ||
          "jpg";
        const fileName = `${String(idx + 1).padStart(2, "0")}.${extGuess}`;
        return { url, name: fileName };
      })
      .filter(Boolean) as { url: string; name: string }[];

    try {
      setIsZipping(true);
      await downloadZipFromServer({ folderName, files });
    } catch (e: any) {
      alert(e?.message || "ZIP download failed");
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadZipSelected = async () => {
    if (!selectedOrder || !items?.length) return;
    if (selectedPhotoIds.size === 0) return;

    const folderName = buildFolderName();

    const selectedList = items
      .map((p: any, idx: number) => ({ p, idx }))
      .filter(({ p, idx }) => {
        const pid = p?.id || `photo-${idx}`;
        return selectedPhotoIds.has(pid);
      });

    const files = selectedList
      .map(({ p, idx }, localIdx) => {
        const url = getPhotoUrl(p);
        if (!url) return null;
        const extGuess =
          (url.split("?")[0].toLowerCase().endsWith(".png") && "png") ||
          (url.split("?")[0].toLowerCase().endsWith(".webp") && "webp") ||
          (url.split("?")[0].toLowerCase().endsWith(".jpeg") && "jpg") ||
          (url.split("?")[0].toLowerCase().endsWith(".jpg") && "jpg") ||
          "jpg";
        // 선택 다운로드도 01,02...로 깔끔하게
        const fileName = `${String(localIdx + 1).padStart(2, "0")}.${extGuess}`;
        return { url, name: fileName };
      })
      .filter(Boolean) as { url: string; name: string }[];

    try {
      setIsZipping(true);
      await downloadZipFromServer({ folderName, files });
    } catch (e: any) {
      alert(e?.message || "ZIP download failed");
    } finally {
      setIsZipping(false);
    }
  };

  const fullAddress = useMemo(() => {
    if (!customer) return "";
    const parts = [
      customer.address1,
      customer.address2,
      customer.city,
      customer.state,
      customer.postalCode,
      customer.country,
    ].filter(Boolean);
    return parts.join(", ");
  }, [customer]);

  return (
    <AppLayout showFooter={false}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          backgroundColor: "#F9FAFB",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* Header */}
        <header
          style={{
            height: 64,
            backgroundColor: "white",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2rem",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                backgroundColor: "#111827",
                width: 32,
                height: 32,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontWeight: "bold" }}>M</span>
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#111827" }}>
              Admin Dashboard
            </h2>
          </div>
          <button
            onClick={() => alert("Export is a placeholder for now.")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              backgroundColor: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            <Download size={16} />
            Export
          </button>
        </header>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* LEFT */}
          <div
            style={{
              width: 420,
              borderRight: "1px solid #E5E7EB",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "white",
              flexShrink: 0,
            }}
          >
            {/* Tabs */}
            <div
              className="no-scrollbar"
              style={{
                display: "flex",
                padding: "1rem",
                gap: "0.5rem",
                borderBottom: "1px solid #E5E7EB",
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 6,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    backgroundColor: activeTab === tab.id ? "#111827" : "transparent",
                    color: activeTab === tab.id ? "white" : "#6B7280",
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Summary + Date */}
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#F9FAFB",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6B7280",
                  fontWeight: 600,
                  marginBottom: "1rem",
                  padding: "0 0.5rem",
                }}
              >
                Orders: <span style={{ color: "#111827" }}>{summary.orderCount}</span> · Tiles:{" "}
                <span style={{ color: "#111827" }}>{summary.tileCount}</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setDateRange(preset.id)}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.6rem",
                      borderRadius: 4,
                      border: "1px solid",
                      borderColor: dateRange === preset.id ? "#111827" : "#E5E7EB",
                      backgroundColor: dateRange === preset.id ? "#111827" : "white",
                      color: dateRange === preset.id ? "white" : "#6B7280",
                      cursor: "pointer",
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {dateRange === "custom" && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="date"
                    value={customDates.start}
                    onChange={(e) => setCustomDates((prev) => ({ ...prev, start: e.target.value }))}
                    style={{ flex: 1, fontSize: "0.75rem", padding: "0.25rem", borderRadius: 4, border: "1px solid #E5E7EB" }}
                  />
                  <span style={{ color: "#9CA3AF" }}>-</span>
                  <input
                    type="date"
                    value={customDates.end}
                    onChange={(e) => setCustomDates((prev) => ({ ...prev, end: e.target.value }))}
                    style={{ flex: 1, fontSize: "0.75rem", padding: "0.25rem", borderRadius: 4, border: "1px solid #E5E7EB" }}
                  />
                </div>
              )}
            </div>

            {/* Search / Sort */}
            <div style={{ padding: "1rem", borderBottom: "1px solid #F3F4F6", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder={`Search ${SEARCH_FIELDS.find((f) => f.id === searchField)?.label}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", paddingLeft: "2.25rem", paddingRight: "2rem", paddingTop: "0.625rem", paddingBottom: "0.625rem", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: "0.875rem", outline: "none" }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select value={searchField} onChange={(e) => setSearchField(e.target.value)} style={{ flex: 1, padding: "0.5rem", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: "0.875rem", backgroundColor: "white", cursor: "pointer" }}>
                  {SEARCH_FIELDS.map((f) => (
                    <option key={f.id} value={f.id}>
                      Search {f.label}
                    </option>
                  ))}
                </select>

                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{ flex: 1, padding: "0.5rem", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: "0.875rem", backgroundColor: "white", cursor: "pointer" }}>
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk bar */}
            {selectedIds.length > 0 && (
              <div style={{ padding: "0.75rem 1rem", backgroundColor: "#EFF6FF", borderBottom: "1px solid #DBEAFE", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1E40AF", whiteSpace: "nowrap" }}>{selectedIds.length} Selected</span>
                <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} style={{ flex: 1, padding: "0.4rem", borderRadius: 6, border: "1px solid #BFDBFE", fontSize: "0.875rem" }}>
                  <option value="">Change Status...</option>
                  {TABS.filter((t) => t.id !== "all").map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button onClick={handleBulkStatusApply} disabled={!bulkStatus} style={{ padding: "0.4rem 0.8rem", borderRadius: 6, backgroundColor: bulkStatus ? "#2563EB" : "#93C5FD", color: "white", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: bulkStatus ? "pointer" : "not-allowed" }}>
                  Apply
                </button>
                <button onClick={() => setSelectedIds([])} style={{ padding: "0.4rem", borderRadius: 6, border: "1px solid #BFDBFE", backgroundColor: "white", color: "#1E40AF", fontSize: "0.875rem" }}>
                  Clear
                </button>
              </div>
            )}

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#F9FAFB" }}>
              {groupedOrders.length === 0 ? (
                <div style={{ padding: "3rem 2rem", textAlign: "center", color: "#6B7280", backgroundColor: "white", height: "100%" }}>
                  <p style={{ marginBottom: "1rem" }}>No orders match your criteria.</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveTab("all");
                      setDateRange("all");
                    }}
                    style={{ color: "#2563EB", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ padding: "0.5rem 1.25rem", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "white" }}>
                    <input type="checkbox" checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length} onChange={(e) => handleSelectAllVisible(e.target.checked)} style={{ cursor: "pointer" }} />
                    <span style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 500 }}>Select All Visible</span>
                  </div>

                  {groupedOrders.map((group) => (
                    <div key={group.date}>
                      <div style={{ padding: "0.75rem 1.25rem", backgroundColor: "#F3F4F6", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 5 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4B5563" }}>
                          {new Date(group.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "#6B7280" }}>
                          {group.orders.length} orders · {group.tileCount} tiles
                        </span>
                      </div>

                      {group.orders.map((order) => {
                        const isSelected = selectedIds.includes(order.id);
                        const statusKey = (order.status || "").toLowerCase();
                        const statusColor = STATUS_COLORS[statusKey] || { bg: "#F3F4F6", text: "#6B7280" };

                        const c = getCustomer(order);
                        const displayName = c.name?.trim() ? c.name : "Unknown User";

                        return (
                          <div
                            key={order.id}
                            onClick={() => setSelectedOrderId(order.id)}
                            style={{
                              padding: "1rem 1.25rem",
                              borderBottom: "1px solid #F3F4F6",
                              cursor: "pointer",
                              backgroundColor: selectedOrderId === order.id ? "#F0F9FF" : "white",
                              borderLeft: selectedOrderId === order.id ? "4px solid #0284C7" : "4px solid transparent",
                              display: "flex",
                              gap: "1rem",
                            }}
                          >
                            <div onClick={(e) => e.stopPropagation()} style={{ paddingTop: "0.125rem" }}>
                              <input type="checkbox" checked={isSelected} onChange={() => toggleOrderSelection(order.id)} style={{ cursor: "pointer" }} />
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                                <span style={{ fontWeight: 600, color: "#111827", fontSize: "0.925rem" }}>{order.id}</span>
                                <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                                  {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>

                              <div style={{ fontWeight: 500, color: "#374151", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
                                {displayName}
                              </div>

                              <div style={{ fontSize: "0.825rem", color: "#6B7280", marginBottom: "0.5rem" }}>
                                {getTileCount(order)} tiles · {(order.currency || "฿")}{(order.total || 0).toLocaleString()}
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
                                  <select
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                    style={{
                                      appearance: "none",
                                      backgroundColor: statusColor.bg,
                                      color: statusColor.text,
                                      border: "none",
                                      borderRadius: 4,
                                      padding: "0.2rem 1.25rem 0.2rem 0.5rem",
                                      fontSize: "0.7rem",
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {TABS.filter((t) => t.id !== "all").map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.label}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown size={10} style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: statusColor.text }} />
                                </div>

                                <span style={{ fontSize: "0.75rem", color: "#3B82F6", fontWeight: 500 }}>Details →</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, backgroundColor: "#F9FAFB", overflowY: "auto" }}>
            {selectedOrder ? (
              <div style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                  <div>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#111827", marginBottom: "0.5rem" }}>
                      {selectedOrder.id}
                    </h1>
                    <p style={{ color: "#6B7280" }}>Created on {formatDate(selectedOrder.createdAt)}</p>

                    <p style={{ color: "#374151", marginTop: 6, fontWeight: 800 }}>
                      Customer: {customer?.name?.trim() ? customer.name : "Unknown User"}
                      {customer?.phone ? ` · ${customer.phone}` : ""}
                    </p>

                    {/* ✅ NEW: 고객 상세 정보 표시 */}
                    <div style={{ marginTop: 10, color: "#374151", fontSize: "0.875rem", lineHeight: 1.6 }}>
                      {customer?.email ? (
                        <div><span style={{ color: "#6B7280", fontWeight: 700 }}>Email:</span> {customer.email}</div>
                      ) : (
                        <div><span style={{ color: "#6B7280", fontWeight: 700 }}>Email:</span> —</div>
                      )}

                      {fullAddress ? (
                        <div><span style={{ color: "#6B7280", fontWeight: 700 }}>Address:</span> {fullAddress}</div>
                      ) : (
                        <div><span style={{ color: "#6B7280", fontWeight: 700 }}>Address:</span> —</div>
                      )}

                      {customer?.instagram ? (
                        <div>
                          <span style={{ color: "#6B7280", fontWeight: 700 }}>Instagram:</span>{" "}
                          {customer.instagram.startsWith("@") ? customer.instagram : `@${customer.instagram}`}
                        </div>
                      ) : (
                        <div><span style={{ color: "#6B7280", fontWeight: 700 }}>Instagram:</span> —</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ position: "relative" }}>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                        style={{
                          appearance: "none",
                          padding: "0.75rem 2.5rem 0.75rem 1rem",
                          borderRadius: 8,
                          border: "1px solid #D1D5DB",
                          backgroundColor: "white",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          minWidth: 160,
                        }}
                      >
                        {TABS.filter((t) => t.id !== "all").map((t) => (
                          <option key={t.id} value={t.id}>
                            Move to {t.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6B7280" }} />
                    </div>

                    <button style={{ padding: "0.75rem", borderRadius: 8, border: "1px solid #D1D5DB", backgroundColor: "white" }}>
                      <MoreHorizontal size={20} color="#374151" />
                    </button>
                  </div>
                </div>

                <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: 12, border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Order Summary</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "#6B7280" }}>Standard Tiles x {getTileCount(selectedOrder)}</span>
                    <span style={{ fontWeight: 500 }}>{(selectedOrder.currency || "฿")}{(selectedOrder.total || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <span style={{ color: "#6B7280" }}>Shipping</span>
                    <span style={{ fontWeight: 500 }}>Free</span>
                  </div>
                  <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: "1rem", display: "flex", justifyContent: "space-between", fontSize: "1.125rem", fontWeight: "bold" }}>
                    <span>Total</span>
                    <span>{(selectedOrder.currency || "฿")}{(selectedOrder.total || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: 12, border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Photos</h3>
                      <span style={{ backgroundColor: "#F3F4F6", padding: "0.25rem 0.75rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, color: "#4B5563" }}>
                        {items.length} files
                      </span>
                      {isZipping && (
                        <span style={{ fontSize: "0.75rem", color: "#2563EB", fontWeight: 700 }}>
                          Zipping...
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        onClick={() => {
                          setIsSelectMode(!isSelectMode);
                          if (isSelectMode) setSelectedPhotoIds(new Set());
                        }}
                        style={{
                          padding: "0.5rem 1rem",
                          fontSize: "0.875rem",
                          backgroundColor: isSelectMode ? "#FEF2F2" : "white",
                          color: isSelectMode ? "#DC2626" : "inherit",
                          border: "1px solid",
                          borderColor: isSelectMode ? "#FECACA" : "#E5E7EB",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {isSelectMode ? "Cancel Selection" : "Select"}
                      </button>

                      {/* ✅ NEW: ZIP 버튼 */}
                      <button
                        onClick={() => {
                          if (selectedPhotoIds.size > 0) handleDownloadZipSelected();
                          else handleDownloadZipAll();
                        }}
                        disabled={isZipping || items.length === 0}
                        style={{
                          padding: "0.5rem 1rem",
                          fontSize: "0.875rem",
                          borderRadius: 6,
                          border: "1px solid #E5E7EB",
                          backgroundColor: isZipping ? "#F3F4F6" : "white",
                          cursor: isZipping ? "not-allowed" : "pointer",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                        title="Download as a ZIP folder named (Customer_Date_OrderID)"
                      >
                        <Download size={16} />
                        {selectedPhotoIds.size > 0
                          ? `Download ZIP (${selectedPhotoIds.size})`
                          : "Download ZIP (All)"}
                      </button>

                      {/* (옵션) 기존 개별 다운로드 유지하고 싶으면 버튼 하나 더 두기 */}
                      <button
                        onClick={() => {
                          if (selectedPhotoIds.size > 0) handleDownloadSelected();
                          else handleDownloadAll();
                        }}
                        style={{
                          padding: "0.5rem 1rem",
                          fontSize: "0.875rem",
                          borderRadius: 6,
                          border: "1px solid #E5E7EB",
                          backgroundColor: "white",
                          cursor: "pointer",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                        title="Download files individually (not zipped)"
                      >
                        <Download size={16} />
                        Individual
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
                    {items.map((photo, idx) => {
                      const photoId = photo.id || `photo-${idx}`;
                      const isSelected = selectedPhotoIds.has(photoId);
                      const url = getPhotoUrl(photo);

                      return (
                        <div
                          key={photoId}
                          onClick={() => handlePhotoClick({ ...photo, id: photoId })}
                          style={{
                            aspectRatio: "1/1",
                            borderRadius: 8,
                            overflow: "hidden",
                            position: "relative",
                            cursor: "pointer",
                            border: isSelected ? "3px solid #3B82F6" : "1px solid #E5E7EB",
                            backgroundColor: "#F9FAFB",
                          }}
                        >
                          {url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt={photo.filename || "Photo"}
                              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isSelectMode && !isSelected ? 0.6 : 1 }}
                            />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6" }}>
                              <ImageIcon size={32} color="#D1D5DB" />
                            </div>
                          )}

                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)", color: "white", fontSize: "0.65rem", padding: "0.25rem 0.5rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {photo.filename || `Item ${idx + 1}`}
                          </div>

                          {isSelectMode && (
                            <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, backgroundColor: isSelected ? "#3B82F6" : "rgba(255,255,255,0.8)", borderRadius: "50%", border: isSelected ? "none" : "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                              {isSelected && <Check size={14} color="white" />}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", flexDirection: "column", gap: "1rem" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ImageIcon size={40} color="#D1D5DB" />
                </div>
                <p>Select an order to view details</p>
              </div>
            )}
          </div>
        </div>

        {lightboxPhoto && (
          <div onClick={() => setLightboxPhoto(null)} style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
            <button onClick={() => setLightboxPhoto(null)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "transparent", border: "none", color: "white", cursor: "pointer" }}>
              <X size={32} />
            </button>

            <div style={{ position: "relative", maxWidth: "100%", maxHeight: "100%" }} onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getPhotoUrl(lightboxPhoto)} alt={lightboxPhoto.filename || "Photo"} style={{ maxWidth: "80vw", maxHeight: "80vh", borderRadius: 4 }} />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
