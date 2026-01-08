const STORAGE_KEY = "memotiles_orders";
const SEED_FLAG = "memotiles_seeded_v2";

/** ✅ 앱 확장 대비:
 *  - shippingAddress(신형): 체크아웃 폼 구조 그대로 유지
 *  - shipping(구형): 기존 Admin/Seed/호환 유지
 *  - status: shipped(구형) -> shipping(신형) 자동 마이그레이션
 */

export type OrderStatus =
  | "paid"
  | "processing"
  | "printed"
  | "shipping"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  id: string;
  qty?: number;
  src?: string | null; // editor에서 objectURL 등
  url?: string | null; // storage 붙이면 사용
  previewUrl?: string | null; // 크롭 결과(영구 미리보기)
  filename?: string;
  zoom?: number;
  dragPos?: { x: number; y: number };
  filter?: string;
};

export type ShippingInfo = {
  name?: string;
  email?: string;
  phone?: string;
  instagram?: string; // ✅ NEW (optional)
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type ShippingAddress = {
  fullName: string;
  email?: string; // optional
  phone: string;
  instagram?: string; // ✅ NEW (optional)
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
};

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  qty: number;
  total: number;
  currency?: string;

  /** 구형 호환 */
  shipping?: ShippingInfo;

  /** 신형 (Checkout 폼 그대로 저장) */
  shippingAddress?: ShippingAddress;

  /** 기타 */
  user?: { name?: string; email?: string };
  customer?: { name?: string; email?: string };
  customerName?: string;
  customerEmail?: string;
  email?: string;

  meta?: any;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeStatus(s: any): OrderStatus {
  const v = String(s || "").toLowerCase().trim();
  // ✅ 구형 shipped -> shipping
  if (v === "shipped") return "shipping";
  // ✅ 그 외 허용
  if (
    v === "paid" ||
    v === "processing" ||
    v === "printed" ||
    v === "shipping" ||
    v === "delivered" ||
    v === "cancelled"
  ) {
    return v as OrderStatus;
  }
  return "paid";
}

function toLegacyShipping(addr?: ShippingAddress | null): ShippingInfo {
  if (!addr) return {};
  return {
    name: addr.fullName,
    email: addr.email,
    phone: addr.phone,
    instagram: addr.instagram,
    address: addr.address1,
    address2: addr.address2,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode,
    country: addr.country,
  };
}

/** ✅ 저장된 주문을 “지금 앱 구조”로 정규화 */
function normalizeOrder(raw: any): Order {
  const items: OrderItem[] = Array.isArray(raw?.items) ? raw.items : [];
  const qty =
    typeof raw?.qty === "number"
      ? raw.qty
      : items.reduce((sum, it) => sum + (Number(it?.qty) || 1), 0);

  const shippingAddress: ShippingAddress | undefined = raw?.shippingAddress;

  // ✅ shipping(구형) 없으면 shippingAddress에서 만들어 넣어줌
  const shipping: ShippingInfo =
    raw?.shipping && typeof raw.shipping === "object"
      ? raw.shipping
      : shippingAddress
      ? toLegacyShipping(shippingAddress)
      : {};

  const total =
    typeof raw?.total === "number"
      ? raw.total
      : qty * 200;

  const currency = raw?.currency || "฿";

  const createdAt =
    typeof raw?.createdAt === "string" ? raw.createdAt : new Date().toISOString();

  const id = String(raw?.id || `ORD-${Date.now()}`);

  // ✅✅✅ 핵심: Admin 표시용 이름/이메일 백필
  const nameFromAddress = shippingAddress?.fullName?.trim();
  const nameFromLegacy = shipping?.name?.trim();
  const nameFromCustomer = raw?.customer?.name?.trim?.() || raw?.customerName?.trim?.();
  const nameFromUser = raw?.user?.name?.trim?.();

  const finalName =
    nameFromCustomer ||
    nameFromUser ||
    nameFromAddress ||
    nameFromLegacy ||
    "Unknown User";

  const emailFromAddress = shippingAddress?.email?.trim();
  const emailFromLegacy = shipping?.email?.trim();
  const emailFromCustomer = raw?.customer?.email?.trim?.() || raw?.customerEmail?.trim?.();
  const emailFromUser = raw?.user?.email?.trim?.();
  const finalEmail =
    emailFromCustomer ||
    emailFromUser ||
    emailFromAddress ||
    emailFromLegacy ||
    raw?.email ||
    undefined;

  return {
    ...raw,
    id,
    createdAt,
    status: normalizeStatus(raw?.status),
    items,
    qty,
    total,
    currency,
    shipping,
    shippingAddress,

    // ✅ 백필 결과를 루트 + customer에 확실히 채워줌
    customerName: raw?.customerName || finalName,
    customerEmail: raw?.customerEmail || finalEmail,
    customer: {
      ...(raw?.customer || {}),
      name: raw?.customer?.name || finalName,
      email: raw?.customer?.email || finalEmail,
    },
  };
}

export const getOrders = (): Order[] => {
  if (typeof window === "undefined") return [];

  const rawList = safeParse<any[]>(localStorage.getItem(STORAGE_KEY), []);
  const isSeeded = localStorage.getItem(SEED_FLAG);

  // seed 없거나 비었으면 seed
  if (!isSeeded || !Array.isArray(rawList) || rawList.length === 0) {
    const seeded = generateSeedOrders().map(normalizeOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    localStorage.setItem(SEED_FLAG, "true");
    return seeded;
  }

  // ✅ 마이그레이션/정규화 (shipped -> shipping 포함 + 이름 백필 포함)
  const normalized = rawList.map(normalizeOrder);

  // 저장소 구조가 오래된 경우 자동 덮어쓰기
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // ignore
  }

  return normalized;
};

export const saveOrders = (orders: Order[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("storage"));
};

export const createOrder = (args: {
  items: OrderItem[];
  total?: number;
  currency?: string;

  // ✅ 구형/신형 둘 다 받을 수 있게
  shipping?: ShippingInfo;
  shippingAddress?: ShippingAddress;
}): Order => {
  const existing = getOrders();

  const items = Array.isArray(args.items) ? args.items : [];
  const qty = items.reduce((sum, it) => sum + (Number(it?.qty) || 1), 0);

  const shippingAddress = args.shippingAddress;

  /**
   * ✅✅✅ 핵심 수정:
   * - shippingAddress가 있으면 기본 legacy shipping을 만들고
   * - args.shipping이 오면 그걸 덮어써서(merge) 항상 name/address가 유지되게 함
   */
  const shipping: ShippingInfo = {
    ...(shippingAddress ? toLegacyShipping(shippingAddress) : {}),
    ...(args.shipping || {}),
  };

  const newOrder: Order = normalizeOrder({
    id: `ORD-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "paid",
    items,
    qty,
    total: typeof args.total === "number" ? args.total : qty * 200,
    currency: args.currency || "฿",
    shipping,
    shippingAddress,
  });

  saveOrders([newOrder, ...existing]);
  return newOrder;
};

export const updateOrderStatus = (orderId: string, status: OrderStatus) => {
  const s = normalizeStatus(status);
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;

  orders[idx] = { ...orders[idx], status: s };
  saveOrders(orders);
  return orders[idx];
};

export const canEdit = (order: { status?: string } | null | undefined) => {
  const s = normalizeStatus(order?.status);
  return s === "paid" || s === "processing";
};

export const cancelOrder = (orderId: string) => {
  const orders = getOrders();
  const o = orders.find((x) => x.id === orderId);
  if (!o || !canEdit(o)) return false;
  return !!updateOrderStatus(orderId, "cancelled");
};

export const updateOrderItems = (orderId: string, items: OrderItem[]) => {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return false;
  if (!canEdit(orders[idx])) return false;

  const safeItems = Array.isArray(items) ? items : [];
  const qty = safeItems.reduce((sum, it) => sum + (Number(it?.qty) || 1), 0);

  orders[idx] = normalizeOrder({
    ...orders[idx],
    items: safeItems,
    qty,
    total: qty * 200,
  });

  saveOrders(orders);
  return orders[idx];
};

/* ---------------- seed ---------------- */
function generateSeedOrders(): Order[] {
  const statuses: OrderStatus[] = [
    "paid",
    "processing",
    "printed",
    "shipping",
    "delivered",
    "cancelled",
  ];

  const customers = [
    {
      name: "John Doe",
      email: "john@example.com",
      phone: "081-111-2222",
      instagram: "@johnny",
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "082-333-4444",
      instagram: "@jane_smith",
    },
    {
      name: "Alice Brown",
      email: "alice@example.com",
      phone: "083-555-6666",
      instagram: "",
    },
    {
      name: "Bob Wilson",
      email: "bob@example.com",
      phone: "084-777-8888",
      instagram: "@bobwilson",
    },
  ];

  const out: Order[] = [];
  for (let i = 1; i <= 8; i++) {
    const customer = customers[i % customers.length];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const tileCount = 3 + (i % 5);

    const shippingAddress: ShippingAddress = {
      fullName: customer.name,
      email: customer.email,
      phone: customer.phone,
      instagram: customer.instagram || undefined,
      address1: `${100 + i} Soi Sukhumvit`,
      address2: "",
      city: "Bangkok",
      state: "",
      postalCode: "10110",
      country: "Thailand",
    };

    out.push(
      normalizeOrder({
        id: `ORD-SEED-${String(i).padStart(3, "0")}`,
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        status,
        items: Array(tileCount)
          .fill(0)
          .map((_, idx) => ({
            id: `img-${i}-${idx}`,
            url: null,
            src: null,
            previewUrl: null,
            filename: `tile-${idx + 1}.jpg`,
            qty: 1,
          })),
        qty: tileCount,
        total: tileCount * 200,
        currency: "฿",
        shippingAddress,
        shipping: toLegacyShipping(shippingAddress),
        meta: { seed: true },
      })
    );
  }
  return out;
}
