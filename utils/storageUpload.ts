// utils/storageUpload.ts
"use client";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

type EnsureArgs = {
  url: string;      // blob:..., data:..., https:...
  uid: string;
  orderId: string;
  index: number;
};

function isHttpUrl(u: string) {
  return /^https?:\/\//i.test(u);
}

function isDataUrl(u: string) {
  return /^data:/i.test(u);
}

function isBlobUrl(u: string) {
  return /^blob:/i.test(u);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

async function fetchToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  return await res.blob();
}

/**
 * ✅ blob/data url이면 Storage에 업로드 후 downloadURL 반환
 * ✅ 이미 http(s)면 그대로 반환
 */
export async function ensureStorageUrl({ url, uid, orderId, index }: EnsureArgs): Promise<string> {
  const u = (url || "").trim();
  if (!u) return "";

  // 이미 영구 URL이면 그대로
  if (isHttpUrl(u) && u.includes("firebasestorage")) return u;
  if (isHttpUrl(u) && !isBlobUrl(u) && !isDataUrl(u)) return u;

  // blob/data -> Blob 만들기
  let blob: Blob;
  if (isDataUrl(u)) blob = await dataUrlToBlob(u);
  else if (isBlobUrl(u)) blob = await fetchToBlob(u);
  else blob = await fetchToBlob(u); // 혹시 다른 형태면 fallback

  // 업로드 경로 (rules와 반드시 일치해야 함)
  const filename = `photo_${String(index).padStart(2, "0")}.jpg`;
  const path = `orders/${uid}/${orderId}/${filename}`;

  const storageRef = ref(storage, path);

  // 업로드
  await uploadBytes(storageRef, blob, {
    contentType: blob.type || "image/jpeg",
    cacheControl: "public,max-age=31536000",
  });

  // 다운로드 URL
  return await getDownloadURL(storageRef);
}
