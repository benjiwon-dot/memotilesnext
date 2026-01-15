// lib/firebase.client.ts
"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

type FirebaseClientBundle = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
};

// ✅ IMPORTANT:
// - NEXT_PUBLIC_* 는 클라이언트 번들에 "빌드 타임"에 주입됨
// - 그래서 함수 안에서 process.env를 읽고 throw 하는 방식이 꼬일 수 있음
// - 파일 최상단에서 "한 번" 읽어 config를 만들고, 없으면 null 처리
const firebaseConfig =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    ? {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }
    : null;

let cached: FirebaseClientBundle | null = null;

export function getFirebaseClient(): FirebaseClientBundle {
  if (typeof window === "undefined") {
    throw new Error("getFirebaseClient() must be called in the browser.");
  }

  if (!firebaseConfig) {
    // ✅ 여기서는 '친절한 에러'만 던지고 앱 전체를 죽이지 않게
    // (AppContext에서 try/catch로 핸들링 가능)
    throw new Error("Firebase not configured. Check .env.local and restart dev server.");
  }

  if (cached) return cached;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  cached = { app, auth, db, storage };
  return cached;
}
