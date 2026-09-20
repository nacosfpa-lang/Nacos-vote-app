import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);
const COLLECTION = "nacosElection";

// ---------- Firestore data storage (voters, candidates, ballot, electionStatus) ----------
export async function storageGet(key, _shared) {
  try {
    const snap = await getDoc(doc(db, COLLECTION, key));
    return snap.exists() ? snap.data().payload : null;
  } catch (e) {
    console.error("storage get failed", e);
    return null;
  }
}

export async function storageSet(key, value, _shared) {
  try {
    await setDoc(doc(db, COLLECTION, key), { payload: value });
    return true;
  } catch (e) {
    console.error("storage set failed", e);
    return false;
  }
}

// ---------- Voter email-verification + password auth ----------
// Uses Firebase's "password reset" email, which has a far higher free-plan
// quota (150/day) than "email link sign-in" (5/day). The account is created
// with a random, never-shown password; the voter sets their real one by
// following the reset link.
const MATRIC_KEY = "nacos_matric_for_signin";

export async function requestVoterRegistration(email, matric) {
  try {
    const tempPassword = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await createUserWithEmailAndPassword(auth, email, tempPassword);
    await signOut(auth); // don't leave this device signed in as the voter yet
  } catch (e) {
    if (e.code !== "auth/email-already-in-use") {
      throw e;
    }
    // Account already exists (e.g. they requested a link before) — that's fine,
    // just send them a fresh reset link below.
  }
  await sendPasswordResetEmail(auth, email);
  window.localStorage.setItem(MATRIC_KEY, matric);
}

// Detects a Firebase password-reset link in the current page URL.
export function getPasswordResetCode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") === "resetPassword" && params.get("oobCode")) {
    return params.get("oobCode");
  }
  return null;
}

// Confirms the code is valid and returns the email it belongs to — this works
// even if the link is opened on a different device than it was requested on.
export async function verifyResetCode(oobCode) {
  return await verifyPasswordResetCode(auth, oobCode);
}

export async function confirmNewPassword(oobCode, newPassword) {
  await confirmPasswordReset(auth, oobCode, newPassword);
}

// Normal returning-voter login once a password has been set.
export async function voterPasswordLogin(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function voterSignOut() {
  try {
    await signOut(auth);
  } catch (e) {}
}