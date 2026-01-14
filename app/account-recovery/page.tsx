// app/account-recovery/page.tsx ✅ 통코드 (그대로 교체 OK)
import React, { Suspense } from "react";
import AppLayout from "@/components/AppLayout";
import AccountRecoveryClient from "./AccountRecoveryClient";

function LoadingFallback() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F3F4F6",
        padding: "24px 16px",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 460,
          padding: 28,
          boxShadow: "var(--shadow-lg)",
          borderRadius: 16,
        }}
      >
        <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 700 }}>
          Loading…
        </div>
      </div>
    </div>
  );
}

export default function AccountRecoveryPage() {
  return (
    <AppLayout>
      {/* ✅ useSearchParams()가 있는 Client 컴포넌트를 page 레벨 Suspense로 감싸야 빌드 통과 */}
      <Suspense fallback={<LoadingFallback />}>
        <AccountRecoveryClient />
      </Suspense>
    </AppLayout>
  );
}
