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

export type CreateOrderPayload = {
  items: any[];
  total: number;
  currency?: string;

  // 배송
  shippingAddress?: any;

  // ✅ 추가: 결제 플로우용
  status?: string; // payment_pending | paid | failed | cancelled | ...
  publicOrderId?: string; // ORD-1768... (업로드 경로/가독성용)
  paymentProvider?: "stripe" | "none" | string;

  // Stripe 연결용 (Webhook에서 채움)
  paymentIntentId?: string;
  clientSecret?: string; // 보관하고 싶으면(보통은 저장 안해도 됨)
  paymentError?: string;

  // 메타
  notes?: string;
};

/**
 * ✅ 기존 localStorage 주문 생성(유지)
 * + (차선) Firestore에도 미러링 저장
 *
 * 포인트:
 * - status 기본값을 "paid"로 박아두면 Stripe 붙일 때 꼬임
 * - 그래서 payload.status가 오면 그 값을 우선 사용하고,
 *   없으면 기존 로직 유지(= paid)
 */
export function createOrder(uid: string, payload: CreateOrderPayload) {
  const nowIso = new Date().toISOString();

  const order: AnyOrder = {
    id: makeOrderId(),
    ownerUid: uid,

    // ✅ 기본은 paid(기존 호환) / Stripe 붙일 때는 payment_pending을 넘겨라
    status: (payload.status || "paid").toLowerCase(),

    createdAt: nowIso,
    updatedAt: nowIso,

    currency: payload.currency || "฿",
    total: Number(payload.total) || 0,
    items: Array.isArray(payload.items) ? payload.items : [],
    shippingAddress: payload.shippingAddress || null,

    // ✅ 결제 메타(선택)
    publicOrderId: payload.publicOrderId || undefined,
    paymentProvider: payload.paymentProvider || undefined,
    paymentIntentId: payload.paymentIntentId || undefined,
    // clientSecret은 보통 DB에 저장 안하는게 안전하지만,
    // 니가 저장 원하면 payload로 넘긴 경우에만 저장되도록 처리
    clientSecret: payload.clientSecret || undefined,
    paymentError: payload.paymentError || undefined,

    notes: payload.notes || undefined,
  };

  // 1) localStorage 저장(기존 기능 유지)
  const existing = safeReadOrders();
  safeWriteOrders([order, ...existing]);

  // 2) Firestore 미러링(실패해도 로컬은 성공)
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

/**
 * ✅ Stripe용: 결제 정보 업데이트 (Webhook에서 사용하기 좋음)
 * - paymentIntentId / paidAt / 실패 사유 등을 여기로 넣으면 깔끔함
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

  const nextLocal = idx === -1 ? null : { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
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
