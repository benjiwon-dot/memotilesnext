// app/toss/success/page.tsx
import React, { Suspense } from "react";
import TossSuccessClient from "./TossSuccessClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TossSuccessClient />
    </Suspense>
  );
}
