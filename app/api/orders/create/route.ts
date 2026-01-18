function isHttpUrl(u?: string) {
  if (!u) return false;
  return u.startsWith("https://") || u.startsWith("http://");
}
function isBadUrl(u?: string) {
  if (!u) return false;
  return u.startsWith("blob:") || u.startsWith("data:");
}

function sanitizeItems(items?: OrderItem[]) {
  const arr = Array.isArray(items) ? items : [];
  return arr.map((it) => {
    const clean: OrderItem = {
      id: String(it.id || ""),
      qty: typeof it.qty === "number" ? it.qty : 1,
    };

    // ❌ blob/data는 저장 금지
    if (isBadUrl(it.src) || isBadUrl(it.previewUrl)) {
      // 여기서 그냥 비우거나, 에러로 막는 선택
      // 1) 그냥 비움:
      // clean.src = undefined; clean.previewUrl = undefined;
      // 2) 주문 생성 자체를 막음(추천: 운영 안정성):
      throw new Error("Invalid item url (blob/data). Upload image to Storage and send HTTPS URL.");
    }

    // ✅ http(s) 만 허용
    if (isHttpUrl(it.src)) clean.src = it.src;
    if (isHttpUrl(it.previewUrl)) clean.previewUrl = it.previewUrl;

    return clean;
  });
}
