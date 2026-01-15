"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
  reload,
  sendPasswordResetEmail,
  type Auth,
} from "firebase/auth";

import { doc, serverTimestamp, setDoc, type Firestore } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase.client";
import { translations } from "@/utils/translations";

type Language = "TH" | "EN";

const LANG_STORAGE_KEY = "MEMOTILES_LANG";
const DEFAULT_LANGUAGE: Language = "TH";

export type CartItem = {
  id: string;
  previewUrl?: string;
  src?: string;
  qty?: number;
  crop?: any;
};

const CART_STORAGE_PREFIX = "MEMOTILES_CART_V1";
const SESSION_CART_KEY = "MYTILE_ORDER_ITEMS";

type AppContextValue = {
  user: User | null;
  authLoading: boolean;

  isLoggedIn: boolean;

  loginWithGoogle: () => Promise<User>;
  registerWithEmail: (email: string, password: string, fullName: string) => Promise<User>;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  resendVerificationEmail: (nextPath?: string) => Promise<void>;
  logout: () => Promise<void>;

  sendPasswordReset: (email: string) => Promise<void>;
  saveLastEmail: (email: string) => void;
  lastEmail: string;

  requireEmailVerified: (u: User | null) => boolean;

  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;

  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  upsertCartItem: (item: CartItem) => void;
  removeCartItem: (id: string) => void;
  clearCart: () => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

function sanitizeLanguage(input: any): Language {
  if (input === "EN") return "EN";
  return "TH";
}

function cartStorageKey(uid?: string | null) {
  return `${CART_STORAGE_PREFIX}:${uid || "guest"}`;
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function sanitizeCartArray(input: any): CartItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((x) => x && typeof x.id === "string")
    .map((x) => ({
      id: String(x.id),
      previewUrl: typeof x.previewUrl === "string" ? x.previewUrl : undefined,
      src: typeof x.src === "string" ? x.src : undefined,
      qty: Number(x.qty) > 0 ? Number(x.qty) : 1,
      crop: x.crop,
    }));
}

export function AppProvider({ children }: { children: ReactNode }) {
  /**
   * ✅ 핵심 수정:
   * - 기존: useMemo(() => getFirebaseClient(), [])  => env 없으면 "렌더 단계에서" 바로 터짐
   * - 변경: useEffect에서 try/catch로 가져오고, 없으면 authLoading을 false로 내려서 앱이 안 죽게
   */
  const [fb, setFb] = useState<null | { auth: Auth; db: Firestore }>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [language, _setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [lastEmail, setLastEmail] = useState<string>("");

  const [cart, setCart] = useState<CartItem[]>([]);

  const ENFORCE_EMAIL_VERIFIED_FOR_PASSWORD_USERS = false;
  const DEFAULT_NEXT_AFTER_VERIFY = "/editor";

  const didRestoreCartRef = useRef(false);

  const isLoggedIn = !!user;

  useEffect(() => {
    // ✅ Firebase는 브라우저에서만 + env 없으면 조용히 비활성화
    try {
      const { auth, db } = getFirebaseClient();
      setFb({ auth, db });
    } catch (e: any) {
      console.warn(e?.message || e);
      setFb(null);
      setAuthLoading(false); // firebase 없으면 로그인 기능은 비활성, 앱은 진행
    }
  }, []);

  useEffect(() => {
    try {
      const v = localStorage.getItem("MEMOTILES_LAST_EMAIL");
      if (v) setLastEmail(v);
    } catch {}
  }, []);

  const saveLastEmail = useCallback((email: string) => {
    const v = (email || "").trim();
    setLastEmail(v);
    try {
      localStorage.setItem("MEMOTILES_LAST_EMAIL", v);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved) _setLanguage(sanitizeLanguage(saved));
      else _setLanguage(DEFAULT_LANGUAGE);
    } catch {
      _setLanguage(DEFAULT_LANGUAGE);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    const next = sanitizeLanguage(lang);
    _setLanguage(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {}
  }, []);

  useEffect(() => {
    if (!fb?.auth) return;

    (async () => {
      try {
        const result = await getRedirectResult(fb.auth);
        if (result?.user?.email) saveLastEmail(result.user.email);
      } catch {}
    })();
  }, [fb?.auth, saveLastEmail]);

  useEffect(() => {
    if (!fb?.auth) return;

    const unsub = onAuthStateChanged(fb.auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [fb?.auth]);

  useEffect(() => {
    const upsertUser = async () => {
      if (!fb?.db) return;
      if (!user) return;

      try {
        await setDoc(
          doc(fb.db, "users", user.uid),
          {
            displayName: user.displayName ?? "",
            email: user.email ?? "",
            photoURL: user.photoURL ?? "",
            updatedAt: new Date().toISOString(),
            updatedAtTs: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.error("[Firestore] users upsert failed:", e);
      }
    };

    upsertUser();
  }, [fb?.db, user]);

  useEffect(() => {
    if (authLoading) return;
    if (didRestoreCartRef.current) return;

    didRestoreCartRef.current = true;

    try {
      const key = cartStorageKey(user?.uid);
      const fromLocal = sanitizeCartArray(safeJsonParse<CartItem[]>(localStorage.getItem(key)));

      if (fromLocal.length > 0) {
        setCart(fromLocal);
        return;
      }

      const fromSession = sanitizeCartArray(
        safeJsonParse<CartItem[]>(sessionStorage.getItem(SESSION_CART_KEY))
      );

      if (fromSession.length > 0) {
        setCart(fromSession);
        try {
          sessionStorage.removeItem(SESSION_CART_KEY);
        } catch {}
        return;
      }

      setCart([]);
    } catch {
      setCart([]);
    }
  }, [user?.uid, authLoading]);

  useEffect(() => {
    if (authLoading) return;

    try {
      const key = cartStorageKey(user?.uid);
      localStorage.setItem(key, JSON.stringify(cart || []));
    } catch {}
  }, [cart, user?.uid, authLoading]);

  const upsertCartItem = useCallback((item: CartItem) => {
    setCart((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const idx = list.findIndex((x) => x.id === item.id);
      if (idx === -1) return [...list, { ...item, qty: item.qty ?? 1 }];
      const next = [...list];
      next[idx] = { ...next[idx], ...item, qty: item.qty ?? next[idx].qty ?? 1 };
      return next;
    });
  }, []);

  const removeCartItem = useCallback((id: string) => {
    setCart((prev) => (Array.isArray(prev) ? prev.filter((x) => x.id !== id) : []));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const requireEmailVerified = useCallback(
    (u: User | null) => {
      if (!u) return false;

      const providerId = u.providerData?.[0]?.providerId || "";
      const isPasswordUser = providerId === "password";

      if (!ENFORCE_EMAIL_VERIFIED_FOR_PASSWORD_USERS) return true;
      if (!isPasswordUser) return true;
      return !!u.emailVerified;
    },
    [ENFORCE_EMAIL_VERIFIED_FOR_PASSWORD_USERS]
  );

  const buildVerifyReturnUrl = useCallback(
    (nextPath?: string) => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const next = nextPath && nextPath.startsWith("/") ? nextPath : DEFAULT_NEXT_AFTER_VERIFY;
      return `${origin}/verify-email?next=${encodeURIComponent(next)}`;
    },
    [DEFAULT_NEXT_AFTER_VERIFY]
  );

  const requireAuth = useCallback(() => {
    if (!fb?.auth) {
      throw new Error("Firebase not configured. Check .env.local and restart dev server.");
    }
    return fb.auth;
  }, [fb?.auth]);

  const loginWithGoogle = useCallback(async () => {
    const auth = requireAuth();
    const provider = new GoogleAuthProvider();

    try {
      const cred = await signInWithPopup(auth, provider);
      if (cred.user?.email) saveLastEmail(cred.user.email);
      return cred.user;
    } catch (e: any) {
      const code = String(e?.code || "");
      const isPopupIssue =
        code.includes("popup-blocked") ||
        code.includes("popup-closed-by-user") ||
        code.includes("cancelled-popup-request");

      if (isPopupIssue) {
        await signInWithRedirect(auth, provider);
        throw new Error("Redirecting to Google sign-in…");
      }
      throw e;
    }
  }, [requireAuth, saveLastEmail]);

  const registerWithEmail = useCallback(
    async (email: string, password: string, fullName: string) => {
      const auth = requireAuth();

      const cleanedEmail = (email || "").trim().toLowerCase();
      const cred = await createUserWithEmailAndPassword(auth, cleanedEmail, password);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: fullName });

        await sendEmailVerification(auth.currentUser, {
          url: buildVerifyReturnUrl(DEFAULT_NEXT_AFTER_VERIFY),
          handleCodeInApp: false,
        });
      }

      if (cred.user?.email) saveLastEmail(cred.user.email);
      return cred.user;
    },
    [requireAuth, buildVerifyReturnUrl, saveLastEmail]
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const auth = requireAuth();

      const cleanedEmail = (email || "").trim().toLowerCase();
      const cred = await signInWithEmailAndPassword(auth, cleanedEmail, password);

      try {
        await reload(cred.user);
      } catch {}

      if (!requireEmailVerified(cred.user)) {
        try {
          await signOut(auth);
        } catch {}
        throw new Error("Please verify your email address before signing in.");
      }

      if (cred.user?.email) saveLastEmail(cred.user.email);
      return cred.user;
    },
    [requireAuth, requireEmailVerified, saveLastEmail]
  );

  const resendVerificationEmail = useCallback(
    async (nextPath?: string) => {
      const auth = requireAuth();
      if (!auth.currentUser) return;

      await sendEmailVerification(auth.currentUser, {
        url: buildVerifyReturnUrl(nextPath || DEFAULT_NEXT_AFTER_VERIFY),
        handleCodeInApp: false,
      });
    },
    [requireAuth, buildVerifyReturnUrl]
  );

  const sendPasswordReset = useCallback(
    async (email: string) => {
      const auth = requireAuth();

      const cleaned = (email || "").trim().toLowerCase();
      if (!cleaned) throw new Error("Email is required.");

      saveLastEmail(cleaned);

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const actionCodeSettings = {
        url: `${origin}/login`,
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, cleaned, actionCodeSettings);
    },
    [requireAuth, saveLastEmail]
  );

  const logout = useCallback(async () => {
    const auth = requireAuth();
    await signOut(auth);
  }, [requireAuth]);

  const t = useCallback(
    (key: string) => {
      const dictTH = (translations as any)["TH"] || {};
      const dictEN = (translations as any)["EN"] || {};
      const langDict = language === "EN" ? dictEN : dictTH;
      return langDict[key] || dictEN[key] || key;
    },
    [language]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authLoading,
      isLoggedIn,
      loginWithGoogle,
      registerWithEmail,
      loginWithEmail,
      resendVerificationEmail,
      logout,
      sendPasswordReset,
      saveLastEmail,
      lastEmail,
      requireEmailVerified,
      language,
      setLanguage,
      t,
      cart,
      setCart,
      upsertCartItem,
      removeCartItem,
      clearCart,
    }),
    [
      user,
      authLoading,
      isLoggedIn,
      loginWithGoogle,
      registerWithEmail,
      loginWithEmail,
      resendVerificationEmail,
      logout,
      sendPasswordReset,
      saveLastEmail,
      lastEmail,
      requireEmailVerified,
      language,
      setLanguage,
      t,
      cart,
      setCart,
      upsertCartItem,
      removeCartItem,
      clearCart,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider />");
  return ctx;
}
