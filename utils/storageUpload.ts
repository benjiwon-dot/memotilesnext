// utils/storageUpload.ts
"use client";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseClient } from "@/lib/firebase.client";

type EnsureArgs = {
  url: string;      // blob:... or data:... or https:...
  uid: string;
  orderId: string;  // public order id like ORD-...
  index: number;    // 0,1,2...
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] || "application/octet-stream";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function urlToBlob(url: string): Promise<Blob> {
  if (url.startsWith("blob:")) {
    const r = await fetch(url);
    return await r.blob();
  }
  if (url.startsWith("data:")) {
    return dataUrlToBlob(url);
  }
  const r = await fetch(url);
  return await r.blob();
}

export async function ensureStorageUrl(args: EnsureArgs): Promise<string> {
  const { url, uid, orderId, index } = args;
  if (!url) return "";

  if (typeof window === "undefined") {
    throw new Error("ensureStorageUrl must run in the browser.");
  }

  // ✅ storage는 getFirebaseClient()에서 가져온다
  const { storage } = getFirebaseClient();
  if (!storage) {
    throw new Error(
      "Firebase Storage not configured. Check .env.local (local) / Vercel env (deploy) and restart."
    );
  }

  const blob = await urlToBlob(url);

  // ✅ contentType이 비정상인 경우 대비 (Rules: image/* 요구)
  let ct = (blob.type || "").toLowerCase();
  if (!ct || !ct.startsWith("image/")) {
    ct = "image/jpeg";
  }

  const ext =
    ct.includes("png") ? "png" :
    ct.includes("webp") ? "webp" :
    ct.includes("heic") ? "heic" :
    "jpg";

  // ✅ Rules 경로와 일치
  const path = `orders/${uid}/${orderId}/photo_${String(index).padStart(2, "0")}.${ext}`;
  const fileRef = ref(storage, path);

  await uploadBytes(fileRef, blob, { contentType: ct });
  return await getDownloadURL(fileRef);
}
