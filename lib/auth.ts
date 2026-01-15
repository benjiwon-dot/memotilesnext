"use client";

// lib/auth.ts
import { GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase.client";

const provider = new GoogleAuthProvider();

export type UserRole = "user" | "admin";

export async function ensureUserDoc(u: User, role: UserRole = "user") {
  const { db } = getFirebaseClient();

  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);

  // 이미 있으면 최소 업데이트만 (role은 기존 값 유지)
  if (snap.exists()) {
    const data = snap.data() as any;
    await setDoc(
      ref,
      {
        email: u.email || null,
        displayName: u.displayName || null,
        photoURL: u.photoURL || null,
        lastLoginAt: serverTimestamp(),
        role: data?.role || role,
      },
      { merge: true }
    );
    return;
  }

  // 없으면 생성
  await setDoc(
    ref,
    {
      uid: u.uid,
      email: u.email || null,
      displayName: u.displayName || null,
      photoURL: u.photoURL || null,
      role,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function signInWithGoogleAndCreateUser() {
  const { auth } = getFirebaseClient();
  const res = await signInWithPopup(auth, provider);
  await ensureUserDoc(res.user, "user");
  return res.user;
}

export async function signOutUser() {
  const { auth } = getFirebaseClient();
  await signOut(auth);
}
