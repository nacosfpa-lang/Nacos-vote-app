import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const COLLECTION = "nacosElection";

// Same shape as the get/set helpers used before (key, shared) so App.jsx
// barely changes — the "shared" flag is ignored since everything here is
// already one shared election dataset.
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
