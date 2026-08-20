/* =========================================================
   FIREBASE CONFIG
   =========================================================
   === SHYIRAMO FIREBASE CONFIG YAWE HANO ===

   Firebase Console:
   Project settings -> Your apps -> Web app -> SDK setup and configuration

   NTUSHYIREMO GITHUB TOKEN, NTA SECRET KEY Y'UBUCURUZI ISHYIRWA HANO.
   apiKey ya Firebase Web SDK ntabwo ari ibanga (irerekanwa kuri client),
   ariko urugero rwa security rugomba kuba muri Firestore Rules, ntabwo
   ari muri iyi file.
   ========================================================= */

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDEpx3vDn7k6t_3feXrkxm8AIw3Kxxyy90",
  authDomain: "moto-progress-rwanda-3fe64.firebaseapp.com",
  projectId: "moto-progress-rwanda-3fe64",
  storageBucket: "moto-progress-rwanda-3fe64.firebasestorage.app",
  messagingSenderId: "153618291802",
  appId: "1:153618291802:web:b5715ea7391cfb234c0c63"
};

/* =========================================================
   PAYMENT CONFIG
   =========================================================
   === SHYIRAMO PAYMENT PROVIDER/API HANO ===

   NTUGIRE PAYMENT SECRET, SERVER KEY, SERVICE ACCOUNT
   CYANGWA GITHUB TOKEN USHYIRA MURI IYI FILE.

   Payment nyayo (MoMo API, Flutterwave, Stripe, n'ibindi) igomba
   guca kuri backend/provider yemewe — ntabwo ikorwa muri frontend.
   ========================================================= */

export const PAYMENT_CONFIG = {
  provider: "=== SHYIRAMO PAYMENT PROVIDER HANO ===",
  endpoint: "=== SHYIRAMO SECURE PAYMENT ENDPOINT HANO ==="
};

/* =========================================================
   FIREBASE INITIALIZATION (lazy — only if config filled in)
   ========================================================= */

export let auth = null;
export let db = null;
export let firebaseReady = false;

let firebaseModules = null;

async function tryInitFirebase() {
  const valid =
    FIREBASE_CONFIG.apiKey &&
    !FIREBASE_CONFIG.apiKey.startsWith("===") &&
    FIREBASE_CONFIG.projectId &&
    !FIREBASE_CONFIG.projectId.startsWith("===");

  if (!valid) {
    console.log("Firebase: WAITING FOR CONFIG (demo/local mode active)");
    return;
  }

  try {
    const [{ initializeApp }, authMod, storeMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js")
    ]);

    const app = initializeApp(FIREBASE_CONFIG);

    auth = authMod.getAuth(app);
    db = storeMod.getFirestore(app);
    firebaseModules = { ...authMod, ...storeMod };
    firebaseReady = true;

    console.log("Firebase: CONNECTED");
  } catch (error) {
    console.error("Firebase error:", error);
  }
}

export function getFirebaseModules() {
  return firebaseModules;
}

await tryInitFirebase();

/* =========================================================
   LOCAL FALLBACK DATA LAYER
   =========================================================
   Iyo Firebase itaraboneka (cyangwa demo mode), amakuru abikwa
   muri localStorage kugira ngo application ikomeze gukora.
   Iyo ushyizemo Firebase config nyayo hejuru, buri collection
   izahita ikoresha Firestore aho localStorage.
   ========================================================= */

const LOCAL_KEYS = {
  users: "mpr_users",
  riders: "mpr_riders",
  trips: "mpr_trips",
  listings: "mpr_listings",
  motorcycles: "mpr_motorcycles",
  businesses: "mpr_businesses",
  notifications: "mpr_notifications",
  payments: "mpr_payments"
};

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEYS[key]) || "[]");
  } catch {
    return [];
  }
}

function writeLocal(key, arr) {
  localStorage.setItem(LOCAL_KEYS[key], JSON.stringify(arr));
}

function uid(prefix = "id") {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

/* Seed a little demo data on first run so the app isn't empty */
function seedIfEmpty() {
  if (readLocal("riders").length === 0) {
    writeLocal("riders", [
      { id: uid("rider"), fullName: "Jean Bosco", phone: "0788000001", plate: "RAD 123 A", lat: -1.9536, lng: 30.0605, isVerified: true, isAdmin: false, updatedAt: Date.now() },
      { id: uid("rider"), fullName: "Eric Niyonzima", phone: "0788000002", plate: "RAD 456 B", lat: -1.9441, lng: 30.0619, isVerified: false, isAdmin: false, updatedAt: Date.now() },
      { id: uid("rider"), fullName: "Alice Uwase", phone: "0788000003", plate: "RAD 789 C", lat: -1.9605, lng: 30.0944, isVerified: true, isAdmin: false, updatedAt: Date.now() }
    ]);
  }
  if (readLocal("businesses").length === 0) {
    writeLocal("businesses", [
      { id: uid("biz"), name: "Kigali Fast Repair", category: "Ubukanishi bwa moto", phone: "0788111222", location: "Nyabugogo", isVerified: true },
      { id: uid("biz"), name: "Green Moto Wash", category: "Kwoza moto", phone: "0788333444", location: "Remera", isVerified: false }
    ]);
  }
  if (readLocal("motorcycles").length === 0) {
    writeLocal("motorcycles", [
      { id: uid("moto"), title: "TVS HLX 125", price: 1200000, year: 2021, description: "Moto ikora neza, byose bihari.", isVerified: false }
    ]);
  }
}
seedIfEmpty();

/* =========================================================
   Unified data API used by every feature module.
   Automatically uses Firestore when firebaseReady, else
   falls back to the localStorage layer above.
   ========================================================= */

export const DataStore = {
  uid,

  async list(collectionName, { where: whereArgs, orderByField, limitTo } = {}) {
    if (firebaseReady && db) {
      const mods = getFirebaseModules();
      let q = mods.collection(db, collectionName);
      const clauses = [];
      if (whereArgs) clauses.push(mods.where(...whereArgs));
      if (orderByField) clauses.push(mods.orderBy(orderByField, "desc"));
      if (limitTo) clauses.push(mods.limit(limitTo));
      if (clauses.length) q = mods.query(q, ...clauses);
      const snap = await mods.getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    let items = readLocal(collectionName);
    if (whereArgs) {
      const [field, op, value] = whereArgs;
      items = items.filter(i => {
        if (op === "==") return i[field] === value;
        return true;
      });
    }
    return items;
  },

  async add(collectionName, data) {
    if (firebaseReady && db) {
      const mods = getFirebaseModules();
      const ref = await mods.addDoc(mods.collection(db, collectionName), {
        ...data,
        createdAt: mods.serverTimestamp()
      });
      return ref.id;
    }
    const items = readLocal(collectionName);
    const id = uid(collectionName);
    items.unshift({ id, ...data, createdAt: Date.now() });
    writeLocal(collectionName, items);
    return id;
  },

  async setDoc(collectionName, id, data) {
    if (firebaseReady && db) {
      const mods = getFirebaseModules();
      await mods.setDoc(mods.doc(db, collectionName, id), data, { merge: true });
      return;
    }
    const items = readLocal(collectionName);
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) items[idx] = { ...items[idx], ...data };
    else items.unshift({ id, ...data });
    writeLocal(collectionName, items);
  },

  async getDoc(collectionName, id) {
    if (firebaseReady && db) {
      const mods = getFirebaseModules();
      const snap = await mods.getDoc(mods.doc(db, collectionName, id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }
    const items = readLocal(collectionName);
    return items.find(i => i.id === id) || null;
  }
};
