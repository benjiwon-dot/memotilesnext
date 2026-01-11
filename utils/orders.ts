// utils/orders.ts
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ORDERS_KEY = "memotiles_orders";

export type AnyOrder = any;

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeReadOrders(): AnyOrder[] {
  const parsed = safeJsonParse<AnyOrder[]>(
    typeof window !== "undefined" ? localStorage.getItem(ORDERS_KEY) : null
  );
  return Array.isArray(parsed) ? parsed : [];
}

function safeWriteOrders(list: AnyOrder[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

function makeOrderId() {
  return `ORD-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`.toUpperCase();
}

/**
 * ✅ Firestore setDoc 전에 undefined 제거 (deep)
 * - undefined 필드가 있으면 Firestore가 터짐
 */
function stripUndefinedDeep<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((v) => stripUndefinedDeep(v)) as any;
  }
  if (input && typeof input === "object") {
    const out: any = {};
    Object.entries(input as any).forEach(([k, v]) => {
      if (v === undefined) return;
      out[k] = stripUndefinedDeep(v);
    });
    return out;
  }
  return input;
}

/**
 * ✅ 기존 localStorage 주문 생성 (유지)
 * + (차선) Firestore에도 미러링 저장
 */
export function createOrder(
  uid: string,
  payload: {
    items: any[];
    total: number;
    currency?: string;
    shippingAddress?: any;
  }
) {
  const order: AnyOrder = {
    id: makeOrderId(),
    ownerUid: uid,
    status: "paid",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currency: payload.currency || "฿",
    total: payload.total || 0,
    items: Array.isArray(payload.items) ? payload.items : [],
    shippingAddress: payload.shippingAddress || null,
  };

  // 1) localStorage 저장 (기존 기능 유지)
  const existing = safeReadOrders();
  safeWriteOrders([order, ...existing]);

  // 2) Firestore 미러링 (실패해도 로컬은 성공)
  (async () => {
    try {
      const safeOrder = stripUndefinedDeep({
        ...order,
        createdAtTs: serverTimestamp(),
        updatedAtTs: serverTimestamp(),
      });

      await setDoc(doc(db, "orders", order.id), safeOrder, { merge: true });
    } catch (e) {
      console.error("[Firestore] order mirror failed:", e);
    }
  })();

  return order;
}

export function getOrders(): AnyOrder[] {
  return safeReadOrders();
}

export function updateOrderStatus(orderId: string, status: string) {
  const list = safeReadOrders();
  const idx = list.findIndex((o) => o?.id === orderId);
  if (idx === -1) return;

  list[idx] = {
    ...list[idx],
    status,
    updatedAt: new Date().toISOString(),
  };

  safeWriteOrders(list);

  // Firestore에도 반영(차선)
  (async () => {
    try {
      const safePatch = stripUndefinedDeep({
        status,
        updatedAt: new Date().toISOString(),
        updatedAtTs: serverTimestamp(),
      });

      await setDoc(doc(db, "orders", orderId), safePatch, { merge: true });
    } catch (e) {
      console.error("[Firestore] status update mirror failed:", e);
    }
  })();
}

export function canEdit(order: AnyOrder) {
  const s = String(order?.status || "").toLowerCase();
  return s !== "cancelled" && s !== "delivered";
}
