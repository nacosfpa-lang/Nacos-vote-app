import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithEmailAndPassword,
  updatePassword,
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
const EMAIL_KEY = "nacos_email_for_signin";
const MATRIC_KEY = "nacos_matric_for_signin";

// Sends a one-time verification link to the voter's email on file. Clicking it
// brings them back to the app so they can set their own password.
export async function sendVoterSignInLink(email, matric) {
  const actionCodeSettings = {
    url: window.location.origin + "/",
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem(EMAIL_KEY, email);
  window.localStorage.setItem(MATRIC_KEY, matric);
}

// True when the current page URL is a Firebase email-link sign-in link.
export function isEmailSignInLink() {
  return isSignInWithEmailLink(auth, window.location.href);
}

// Completes the email-link sign-in and returns the matric number that
// requested it, so the app knows which voter record to attach the password to.
export async function completeEmailSignIn() {
  const email = window.localStorage.getItem(EMAIL_KEY);
  const matric = window.localStorage.getItem(MATRIC_KEY);
  if (!email) throw new Error("missing-email-for-signin");
  const result = await signInWithEmailLink(auth, email, window.location.href);
  window.localStorage.removeItem(EMAIL_KEY);
  window.localStorage.removeItem(MATRIC_KEY);
  return { user: result.user, matric, email };
}

// Attaches a password to the just-verified account, for all future logins.
export async function setVoterPassword(newPassword) {
  if (!auth.currentUser) throw new Error("not-authenticated");
  await updatePassword(auth.currentUser, newPassword);
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