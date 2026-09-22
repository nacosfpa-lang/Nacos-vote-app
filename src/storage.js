import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

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


// ======================================================
// FIREBASE INITIALIZATION
// ======================================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export const auth = getAuth(app);

const COLLECTION = "nacosElection";


// ======================================================
// HELPER FUNCTIONS
// ======================================================

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}


// ======================================================
// FIRESTORE DATA STORAGE
// ======================================================

export async function storageGet(key, _shared) {
  try {
    const snap = await getDoc(
      doc(db, COLLECTION, key)
    );

    if (!snap.exists()) {
      return null;
    }

    return snap.data().payload ?? null;

  } catch (e) {
    console.error("Firestore storageGet failed:", e);
    return null;
  }
}


export async function storageSet(key, value, _shared) {
  try {
    await setDoc(
      doc(db, COLLECTION, key),
      {
        payload: value,
      }
    );

    return true;

  } catch (e) {
    console.error("Firestore storageSet failed:", e);
    return false;
  }
}


// ======================================================
// VOTER EMAIL + PASSWORD AUTHENTICATION
// ======================================================
//
// We use Firebase Password Reset emails as the verification
// mechanism.
//
// Flow:
//
// 1. Student enters matric number.
// 2. App finds their registered email.
// 3. Firebase account is created if necessary.
// 4. Firebase sends password-reset email.
// 5. Student opens the link.
// 6. Student creates their own password.
// 7. App marks the voter as registered.
// 8. Student can now log in normally with:
//       Matric Number + Password
//
// ======================================================

const MATRIC_KEY = "nacos_matric_for_signin";


// ======================================================
// REQUEST FIRST-TIME VOTER PASSWORD SETUP
// ======================================================

export async function requestVoterRegistration(email, matric) {

  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail) {
    throw new Error("A valid email address is required.");
  }

  try {

    const tempPassword =
      Math.random().toString(36).slice(2) +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2);

    await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      tempPassword
    );

    // Make sure the newly-created voter account is not
    // left signed in on this device.
    await signOut(auth);

  } catch (e) {

    // If the Firebase account already exists, we don't
    // need to create it again.
    //
    // We can simply send another password-reset email.

    if (e.code !== "auth/email-already-in-use") {
      console.error(
        "Could not create voter Firebase account:",
        e
      );

      throw e;
    }
  }


  // Send the password setup/reset email.
  await sendPasswordResetEmail(
    auth,
    cleanEmail
  );


  // Save matric number locally in case it is needed
  // after the email link is opened.
  window.localStorage.setItem(
    MATRIC_KEY,
    String(matric || "").trim().toUpperCase()
  );
}


// ======================================================
// DETECT FIREBASE PASSWORD RESET LINK
// ======================================================

export function getPasswordResetCode() {

  const params = new URLSearchParams(
    window.location.search
  );

  const mode = params.get("mode");

  const oobCode = params.get("oobCode");

  if (
    mode === "resetPassword" &&
    oobCode
  ) {
    return oobCode;
  }

  return null;
}


// ======================================================
// VERIFY PASSWORD RESET CODE
// ======================================================
//
// Firebase returns the email address connected to the
// reset link.
//
// ======================================================

export async function verifyResetCode(oobCode) {

  if (!oobCode) {
    throw new Error("Missing password reset code.");
  }

  const email = await verifyPasswordResetCode(
    auth,
    oobCode
  );

  return normalizeEmail(email);
}


// ======================================================
// CONFIRM NEW PASSWORD
// ======================================================

export async function confirmNewPassword(
  oobCode,
  newPassword
) {

  if (!oobCode) {
    throw new Error("Missing password reset code.");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error(
      "Password must contain at least 6 characters."
    );
  }

  await confirmPasswordReset(
    auth,
    oobCode,
    newPassword
  );

  return true;
}


// ======================================================
// NORMAL VOTER LOGIN
// ======================================================

export async function voterPasswordLogin(
  email,
  password
) {

  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail) {
    throw new Error("Invalid email address.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  const result =
    await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

  return result.user;
}


// ======================================================
// VOTER SIGN OUT
// ======================================================

export async function voterSignOut() {

  try {

    await signOut(auth);

  } catch (e) {

    console.error(
      "Voter sign out failed:",
      e
    );

  }
}