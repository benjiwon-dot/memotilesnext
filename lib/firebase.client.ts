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

let cached: FirebaseClientBundle | null = null;
let warnedMissingEnv = false;

function readEnv(name: string): string | null {
  const v = process.env[name as keyof NodeJS.ProcessEnv];
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function getFirebaseConfigOrNull() {
  const apiKey = readEnv("NEXT_PUBLIC_FIREBASE_API_KEY");
  const authDomain = readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  const projectId = readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const storageBucket = readEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  const messagingSenderId = readEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  const appId = readEnv("NEXT_PUBLIC_FIREBASE_APP_ID");

  // 하나라도 없으면 null (앱 자체는 죽이지 않음)
  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    if (!warnedMissingEnv) {
      warnedMissingEnv = true;
      console.warn(
        "[firebase] Missing NEXT_PUBLIC_FIREBASE_* env. Firebase features disabled on this page load."
      );
    }
    return null;
  }

  return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
}

export function getFirebaseClient(): FirebaseClientBundle {
  if (typeof window === "undefined") {
    throw new Error("getFirebaseClient() must be called in the browser.");
  }
  if (cached) return cached;

  const config = getFirebaseConfigOrNull();
  if (!config) {
    // ✅ 앱을 죽이지 않고, 호출한 쪽에서 try/catch로 처리할 수 있게 에러 메시지는 명확히
    throw new Error("[firebase] Config missing. Check .env.local and restart dev server.");
  }

  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  cached = { app, auth, db, storage };
  return cached;
}
