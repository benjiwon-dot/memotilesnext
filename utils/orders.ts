// utils/orders.ts  ✅ 통코드 (그대로 교체 OK)
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

export type CreateOrderPayload = {
  items: any[];
  total: number;
  currency?: string;

  // 배송
  shippingAddress?: any;

  // ✅ 결제 플로우용
  status?: string; // payment_pending | paid | failed | cancelled | ...
  publicOrderId?: string; // ORD-1768... (업로드 경로/가독성용)
  paymentProvider?: "stripe" | "none" | string;

  // Stripe 연결용 (Webhook에서 채움)
  paymentIntentId?: string;
  clientSecret?: string; // 저장 원할때만
  paymentError?: string;

  // 메타
  notes?: string;
};

/**
 * ✅ 기존 localStorage 주문 생성(유지)
 * + Firestore에도 미러링 저장(실패해도 로컬은 성공)
 */
export function createOrder(uid: string, payload: CreateOrderPayload) {
  const nowIso = new Date().toISOString();

  const order: AnyOrder = {
    id: makeOrderId(),
    ownerUid: uid,

    status: (payload.status || "paid").toLowerCase(),

    createdAt: nowIso,
    updatedAt: nowIso,

    currency: payload.currency || "฿",
    total: Number(payload.total) || 0,
    items: Array.isArray(payload.items) ? payload.items : [],
    shippingAddress: payload.shippingAddress || null,

    publicOrderId: payload.publicOrderId || undefined,
    paymentProvider: payload.paymentProvider || undefined,
    paymentIntentId: payload.paymentIntentId || undefined,
    clientSecret: payload.clientSecret || undefined,
    paymentError: payload.paymentError || undefined,

    notes: payload.notes || undefined,
  };

  // 1) localStorage 저장
  const existing = safeReadOrders();
  safeWriteOrders([order, ...existing]);

  // 2) Firestore 미러링
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

/**
 * ✅ 핵심 수정: getOrders가 uid 인자도 받도록 "호환" 제공
 * - getOrders()        : 전체 반환 (기존 호환)
 * - getOrders(uid)     : 해당 유저 주문만 반환 (my-orders 코드 호환)
 */
export function getOrders(uid?: string): AnyOrder[] {
  const list = safeReadOrders();
  if (!uid) return list;
  return Array.isArray(list) ? list.filter((o) => o?.ownerUid === uid) : [];
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

  // Firestore에도 반영
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

/**
 * ✅ Stripe용: 결제 정보 업데이트
 */
export function updateOrderPayment(
  orderId: string,
  patch: {
    status?: string;
    paymentProvider?: string;
    paymentIntentId?: string;
    paymentError?: string | null;
    paidAt?: string | null; // ISO
    amountReceived?: number | null;
    currency?: string | null;
  }
) {
  const list = safeReadOrders();
  const idx = list.findIndex((o) => o?.id === orderId);

  const nextLocal =
    idx === -1 ? null : { ...list[idx], ...patch, updatedAt: new Date().toISOString() };

  if (nextLocal) {
    list[idx] = nextLocal;
    safeWriteOrders(list);
  }

  (async () => {
    try {
      const safePatch = stripUndefinedDeep({
        ...patch,
        updatedAt: new Date().toISOString(),
        updatedAtTs: serverTimestamp(),
      });
      await setDoc(doc(db, "orders", orderId), safePatch, { merge: true });
    } catch (e) {
      console.error("[Firestore] payment update mirror failed:", e);
    }
  })();
}

export function canEdit(order: AnyOrder) {
  const s = String(order?.status || "").toLowerCase();
  return s !== "cancelled" && s !== "delivered";
}
