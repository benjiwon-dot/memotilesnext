"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { translations } from "../utils/translations";

// ✅ Firebase는 "있으면 쓰고, 없으면 안 쓰는" 형태로 안전하게
import type { User } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase.client";

type Language = "EN" | "TH";

type CartItem = any;

type AppContextType = {
  // Auth
  user: User | null;
  authLoading: boolean;
  isLoggedIn: boolean;

  loginWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;

  // Cart
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  tilesReadyCount: number;
  addTileToCart: (tile: CartItem) => void;

  // Debug
  firebaseEnabled: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function sanitizeLanguage(x: any): Language {
  return x === "TH" ? "TH" : "EN";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // ✅ Firebase 핸들 (없어도 앱이 죽지 않게)
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);
  const [fbAuth, setFbAuth] = useState<null | ReturnType<typeof getFirebaseClient>["auth"]>(null);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App state
  const [isLoggedIn, setIsLoggedIn] = useState(false); // mock fallback
  const [language, setLanguageState] = useState<Language>("EN");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tilesReadyCount, setTilesReadyCount] = useState(0);

  // ✅ Firebase 초기화: env 없으면 여기서 catch 되고 "mock 모드"로 진행
  useEffect(() => {
    try {
      const { auth } = getFirebaseClient();
      setFbAuth(auth);
      setFirebaseEnabled(true);
    } catch (e: any) {
      console.warn(e?.message || e);
      setFbAuth(null);
      setFirebaseEnabled(false);
      setAuthLoading(false); // firebase 없으니 auth loading 종료
    }
  }, []);

  // ✅ Firebase auth state listener (enabled일 때만)
  useEffect(() => {
    if (!fbAuth) return;

    const unsub = onAuthStateChanged(fbAuth, (u) => {
      setUser(u);
      setIsLoggedIn(!!u);
      setAuthLoading(false);
    });

    return () => unsub();
  }, [fbAuth]);

  // ✅ Mock login (firebase 없을 때만 의미)
  const loginWithGoogle = useCallback(async () => {
    if (!fbAuth) {
      // firebase가 없으면 mock login
      setIsLoggedIn(true);
      return null;
    }

    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(fbAuth, provider);
    // onAuthStateChanged가 상태 업데이트함
    return cred.user;
  }, [fbAuth]);

  const logout = useCallback(async () => {
    if (!fbAuth) {
      // mock logout
      setIsLoggedIn(false);
      setUser(null);
      return;
    }
    await fbSignOut(fbAuth);
  }, [fbAuth]);

  // Cart
  const addTileToCart = useCallback((tile: CartItem) => {
    setCart((prev) => [...prev, tile]);
    setTilesReadyCount((prev) => prev + 1);
  }, []);

  // Language (필요하면 localStorage 저장까지 추가 가능)
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(sanitizeLanguage(lang));
  }, []);

  // Translation helper
  const t = useCallback(
    (key: string) => {
      const dict = (translations as any)?.[language] || {};
      const fallback = (translations as any)?.["EN"] || {};
      return dict[key] || fallback[key] || key;
    },
    [language]
  );

  const value = useMemo<AppContextType>(
    () => ({
      user,
      authLoading,
      isLoggedIn: firebaseEnabled ? !!user : isLoggedIn,

      loginWithGoogle,
      logout,

      language,
      setLanguage,
      t,

      cart,
      setCart,
      tilesReadyCount,
      addTileToCart,

      firebaseEnabled,
    }),
    [
      user,
      authLoading,
      isLoggedIn,
      firebaseEnabled,
      loginWithGoogle,
      logout,
      language,
      setLanguage,
      t,
      cart,
      setCart,
      tilesReadyCount,
      addTileToCart,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider />");
  return ctx;
}
