// lib/firebase.client.ts
"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// (선택) Analytics는 브라우저에서만, 그리고 measurementId 있을 때만
// import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

type FirebaseClientBundle = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  // analytics?: Analytics;
};

// ✅ env 검증: 빌드/런타임에서 값이 비어 있으면 바로 원인 알 수 있게 에러 메시지 개선
function assertEnv(name: string) {
  const v = process.env[name as keyof NodeJS.ProcessEnv];
  if (!v || String(v).trim().length === 0) {
    throw new Error(`[firebase] Missing env: ${name}`);
  }
  return v;
}

const firebaseConfig = {
  apiKey: assertEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: assertEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: assertEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: assertEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: assertEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: assertEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // 있으면 사용 가능
};

// ✅ 싱글톤 캐시 (HMR/리렌더에서도 한 번만 생성)
let cached: FirebaseClientBundle | null = null;

export function getFirebaseClient(): FirebaseClientBundle {
  // ✅ 서버에서 호출되면 즉시 차단 (SSR/Prerender 방지)
  if (typeof window === "undefined") {
    throw new Error("getFirebaseClient() must be called in the browser.");
  }

  if (cached) return cached;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  cached = { app, auth, db, storage };

  // (선택) Analytics까지 쓰고 싶으면 아래 주석 해제해서 사용
  // (async () => {
  //   try {
  //     if (firebaseConfig.measurementId && (await isSupported())) {
  //       const analytics = getAnalytics(app);
  //       cached = { ...cached!, analytics };
  //     }
  //   } catch {
  //     // analytics는 실패해도 앱 동작에 영향 없게 무시
  //   }
  // })();

  return cached;
}
