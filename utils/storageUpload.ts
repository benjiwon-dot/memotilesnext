// utils/storageUpload.ts
"use client";

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getApps } from "firebase/app";
import { getApp } from "firebase/app";

// ⚠️ 네 프로젝트 구조에 따라 firebase app init이 이미 되어있으면 이대로 OK.
// 만약 lib/firebase.ts에서 storage export 중이면 그걸 쓰는 게 더 좋음.
function getFirebaseStorageSafe() {
  // initializeApp이 이미 되어있다는 전제(네 앱은 이미 auth/firestore 쓰고 있음)
  const app = getApps().length ? getApp() : undefined;
  return getStorage(app);
}

type EnsureStorageUrlArgs = {
  uid: string;
  orderId: string;
  index: number;

  // ✅ NEW: 원본 파일 업로드
  file?: File;
  fileName?: string;

  // ✅ fallback: 기존 로직 호환
  url?: string; // dataURL or http(s) or objectURL
};

// dataURL -> Blob
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, data] = dataUrl.split(",");
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "application/octet-stream";
  const binStr = atob(data);
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// url(objectURL/http/data) -> Blob
async function urlToBlob(url: string): Promise<Blob> {
  if (!url) throw new Error("Missing url");
  if (url.startsWith("data:")) return dataUrlToBlob(url);

  // objectURL or http(s)
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  return await res.blob();
}

function extFromMimeOrName(mime?: string, name?: string) {
  const n = (name || "").toLowerCase();
  if (n.endsWith(".png")) return "png";
  if (n.endsWith(".webp")) return "webp";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "jpg";

  const m = (mime || "").toLowerCase();
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  return "jpg";
}

export async function ensureStorageUrl(args: EnsureStorageUrlArgs): Promise<string> {
  const { uid, orderId, index, file, fileName, url } = args;

  const storage = getFirebaseStorageSafe();

  // ✅ 파일명/확장자
  const chosenExt = extFromMimeOrName(file?.type, fileName);
  const safeNameBase = (fileName || `photo_${String(index).padStart(2, "0")}`).replace(/[\\/:*?"<>|]/g, "_");
  const objectName = safeNameBase.toLowerCase().endsWith(`.${chosenExt}`)
    ? safeNameBase
    : `${safeNameBase}.${chosenExt}`;

  // ✅ 저장 경로 (네가 firebase console에서 본 경로 패턴과 동일하게 유지 가능)
  const path = `orders/${uid}/${orderId}/${objectName}`;

  const storageRef = ref(storage, path);

  // 1) 원본 file 우선 업로드
  if (file instanceof File) {
    const contentType = file.type || (chosenExt === "png" ? "image/png" : chosenExt === "webp" ? "image/webp" : "image/jpeg");
    await uploadBytes(storageRef, file, {
      contentType,
      cacheControl: "public,max-age=31536000,immutable",
    });
    return await getDownloadURL(storageRef);
  }

  // 2) fallback: 기존 url 기반 업로드
  const fallbackUrl = (url || "").trim();
  if (!fallbackUrl) throw new Error("Missing file and url");

  // ✅✅ 핵심 FIX:
  // blob: 는 브라우저 objectURL (대부분 크롭 전 "원본"이다)
  // 우리는 Save Crop 이후의 dataURL(크롭 결과) 또는 http(s)만 업로드하도록 강제
  if (fallbackUrl.startsWith("blob:")) {
    const err: any = new Error(
      "Refusing to upload blob: objectURL (likely original). Expected cropped dataURL or http(s) URL."
    );
    err.code = "memotiles/original_upload_blocked";
    throw err;
  }

  const blob = await urlToBlob(fallbackUrl);
  const contentType =
    blob.type ||
    (chosenExt === "png" ? "image/png" : chosenExt === "webp" ? "image/webp" : "image/jpeg");

  await uploadBytes(storageRef, blob, {
    contentType,
    cacheControl: "public,max-age=31536000,immutable",
  });

  return await getDownloadURL(storageRef);
}
