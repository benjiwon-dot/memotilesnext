import React, { Suspense } from "react";
import EditorClient from "./EditorClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EditorClient />
    </Suspense>
  );
}
