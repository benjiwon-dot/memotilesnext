// utils/orders.ts
"use client";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase.client";

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
 * ✅ Firestore 미러링: Firebase가 없으면 조용히 스킵(로컬은 계속 됨)
 */
async function mirrorToFirestore(docId: string, data: any) {
  try {
    const { db } = getFirebaseClient();
    await setDoc(doc(db, "orders", docId), data, { merge: true });
  } catch (e) {
    console.warn("[Firestore] mirror skipped/failed:", e);
  }
}

/**
 * ✅ 로컬 주문 업데이트 (id 기준)
 * - displayId, firestoreId 등 서버에서 받은 값을 끼워넣을 때 사용
 */
function patchLocalOrder(localId: string, patch: Record<string, any>) {
  const list = safeReadOrders();
  const idx = list.findIndex((o) => o?.id === localId);
  if (idx === -1) return;

  list[idx] = {
    ...list[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  safeWriteOrders(list);
}

/**
 * ✅ 서버에서 "공식 주문" 생성 (일자별 카운터로 displayId 발급)
 * - 실패해도 로컬은 유지해야 하므로 throw 대신 null 반환
 *
 * ✅ 핵심 FIX:
 * - /api/orders/create 라우트가 없으면(405/404) body가 HTML/빈문자일 수 있음
 * - res.json() 호출하면 "Unexpected end of JSON input" 발생
 * - 따라서:
 *   1) res.ok 아니면 text로 로깅하고 null
 *   2) content-type이 json일 때만 json 파싱
 *   3) json 파싱 실패해도 null
 */
async function createOrderOnServer(input: {
  uid: string;
  status?: string;
  currency?: string;
  total?: number;
  items?: any[];
  itemsCount?: number;
}) {
  try {
    const res = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    // ✅ 405/404/500 등
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[orders] /api/orders/create failed:", res.status, text || res.statusText);
      return null;
    }

    const ct = (res.headers.get("content-type") || "").toLowerCase();

    // ✅ JSON이 아니면(HTML 등) 안전하게 null
    if (!ct.includes("application/json")) {
      const text = await res.text().catch(() => "");
      console.warn("[orders] /api/orders/create non-json response:", ct, text?.slice(0, 200) || "");
      return null;
    }

    const data = await res.json().catch(() => null);

    if (!data?.ok) {
      console.warn("[orders] /api/orders/create failed:", data?.error || "no ok");
      return null;
    }

    // expected: { ok:true, id, displayId, dayKey, seq }
    return data as { id: string; displayId: string; dayKey: string; seq: number };
  } catch (e) {
    console.warn("[orders] /api/orders/create error:", e);
    return null;
  }
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
 * + ✅추가: 서버 트랜잭션으로 displayId 생성 + Firestore "공식 주문" 생성
 *   - 성공하면 로컬 주문에 displayId/firestoreId를 patch
 */
export function createOrder(uid: string, payload: CreateOrderPayload) {
  const nowIso = new Date().toISOString();

  // ✅ 기존 로컬 주문 ID 그대로 유지 (안 해침)
  const localId = makeOrderId();

  const order: AnyOrder = {
    id: localId,
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

    // ✅ 새 필드(처음엔 없을 수 있음)
    displayId: undefined,
    firestoreId: undefined,
    dayKey: undefined,
    seq: undefined,
  };

  // 1) localStorage 저장 (기존 유지)
  const existing = safeReadOrders();
  safeWriteOrders([order, ...existing]);

  // 2) 기존 Firestore 미러링(있으면 저장) - 그대로 유지
  (async () => {
    const safeOrder = stripUndefinedDeep({
      ...order,
      createdAtTs: serverTimestamp(),
      updatedAtTs: serverTimestamp(),
    });
    await mirrorToFirestore(order.id, safeOrder);
  })();

  // 3) ✅ 추가: 서버에서 "공식 주문" 생성해서 displayId 발급
  (async () => {
    const itemsCount =
      Array.isArray(order.items) && order.items.length
        ? order.items.reduce((sum: number, it: any) => sum + (Number(it.qty) || 1), 0)
        : 0;

    const serverCreated = await createOrderOnServer({
      uid,
      status: order.status,
      currency: order.currency,
      total: order.total,
      items: order.items,
      itemsCount,
    });

    if (!serverCreated) return;

    patchLocalOrder(localId, {
      displayId: serverCreated.displayId,
      firestoreId: serverCreated.id,
      dayKey: serverCreated.dayKey,
      seq: serverCreated.seq,

      publicOrderId: order.publicOrderId || serverCreated.displayId,
    });

    await mirrorToFirestore(localId, stripUndefinedDeep({ displayId: serverCreated.displayId }));
  })();

  return order;
}

/**
 * ✅ 표시 안정화 (핵심 FIX):
 * - my-orders가 item.src 우선 렌더링하면 blob:/data:가 끼어들 때 "원본"이 보일 수 있음
 * - previewUrl이 있으면 표시용으로 src를 previewUrl로 보정
 * - 저장 데이터 자체는 건드리지 않고, 반환값만 보정
 */
function normalizeOrderForDisplay(order: AnyOrder): AnyOrder {
  try {
    const items = Array.isArray(order?.items) ? order.items : [];
    const normalizedItems = items.map((it: any) => {
      const src = typeof it?.src === "string" ? it.src : "";
      const previewUrl = typeof it?.previewUrl === "string" ? it.previewUrl : "";

      if (previewUrl && (src.startsWith("blob:") || src.startsWith("data:") || !src)) {
        return { ...it, src: previewUrl };
      }
      return it;
    });

    return { ...order, items: normalizedItems };
  } catch {
    return order;
  }
}

/**
 * ✅ getOrders(uid?) 호환
 */
export function getOrders(uid?: string): AnyOrder[] {
  const list = safeReadOrders();
  const filtered = !uid ? list : Array.isArray(list) ? list.filter((o) => o?.ownerUid === uid) : [];
  return Array.isArray(filtered) ? filtered.map(normalizeOrderForDisplay) : [];
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

  (async () => {
    const safePatch = stripUndefinedDeep({
      status,
      updatedAt: new Date().toISOString(),
      updatedAtTs: serverTimestamp(),
    });

    await mirrorToFirestore(orderId, safePatch);
  })();
}

export function updateOrderPayment(
  orderId: string,
  patch: {
    status?: string;
    paymentProvider?: string;
    paymentIntentId?: string;
    paymentError?: string | null;
    paidAt?: string | null;
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
    const safePatch = stripUndefinedDeep({
      ...patch,
      updatedAt: new Date().toISOString(),
      updatedAtTs: serverTimestamp(),
    });

    await mirrorToFirestore(orderId, safePatch);
  })();
}

export function canEdit(order: AnyOrder) {
  const s = String(order?.status || "").toLowerCase();
  return s !== "cancelled" && s !== "delivered";
}
