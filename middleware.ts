// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  // ✅ 지금은 Firebase Auth를 "쿠키 세션"으로 운영하지 않으므로
  // middleware에서 보호 라우트를 막으면 항상 /login으로 튕깁니다.
  // 보호는 클라이언트(AuthGate / 각 페이지 가드)에서만 처리하세요.
  return NextResponse.next();
}

// ✅ matcher도 비활성화 (아예 middleware가 보호 라우트에 적용되지 않게)
export const config = {
  matcher: [],
};
