// utils/storageUpload.ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

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
  // blob: 은 fetch로 바로 blob 가능
  if (url.startsWith("blob:")) {
    const r = await fetch(url);
    return await r.blob();
  }

  // data: 는 직접 변환
  if (url.startsWith("data:")) {
    return dataUrlToBlob(url);
  }

  // https: 등 일반 url
  const r = await fetch(url);
  return await r.blob();
}

export async function ensureStorageUrl(args: EnsureArgs): Promise<string> {
  const { url, uid, orderId, index } = args;
  if (!url) return "";

  const blob = await urlToBlob(url);

  // 확장자 추정
  const ct = blob.type || "image/jpeg";
  const ext =
    ct.includes("png") ? "png" :
    ct.includes("webp") ? "webp" :
    ct.includes("heic") ? "heic" :
    "jpg";

  // ✅ Storage Rules 경로와 반드시 동일해야 함:
  // orders/{uid}/{orderId}/photo_00.jpg
  const path = `orders/${uid}/${orderId}/photo_${String(index).padStart(2, "0")}.${ext}`;
  const fileRef = ref(storage, path);

  await uploadBytes(fileRef, blob, { contentType: ct });
  return await getDownloadURL(fileRef);
}
