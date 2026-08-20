import { auth, db, firebaseReady, getFirebaseModules, DataStore } from "./firebase.js";
import { renderProfile } from "./render.js";

let authRegisterMode = false;
let pendingAction = null;

/* =========================================================
   SESSION RESTORE ON LOAD
   =========================================================
   IMPORTANT: auth.js imports firebase.js, so by the time this
   file's own top-level code runs, firebase.js has ALREADY
   finished initializing (its top-level await is guaranteed by
   the ES module spec to resolve before any importer executes).
   That means `firebaseReady`, `auth`, `db` below are already
   correct — we don't need to wait for any extra event, and
   doing so previously caused a bug where the login/register
   result never updated window.App.currentUser (it kept
   whatever stale account was last saved in this browser).
   ========================================================= */

if (firebaseReady) {
  // Real Firebase project: never trust a leftover demo/local
  // account — always defer to Firebase's own session.
  localStorage.removeItem("mpr_user");
  window.App.currentUser = null;

  const mods = getFirebaseModules();
  mods.onAuthStateChanged(auth, async user => {
    if (user) {
      window.App.currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || ""
      };
      await loadUserProfile();
    } else {
      window.App.currentUser = null;
    }
    refreshHeader();
  });
} else {
  // Demo/local mode (no Firebase config yet): restore whatever
  // was saved locally so the demo session survives a reload.
  try {
    const saved = JSON.parse(localStorage.getItem("mpr_user") || "null");
    if (saved) window.App.currentUser = saved;
  } catch {
    window.App.currentUser = null;
  }
}

async function loadUserProfile() {
  if (!window.App.currentUser) return;
  const profile = await DataStore.getDoc("users", window.App.currentUser.uid);
  if (profile) {
    window.App.currentUser = { ...window.App.currentUser, ...profile };
  }
}

/* =========================================================
   AUTH MODAL UI
   ========================================================= */

window.openAuth = function () {
  document.getElementById("authModal").classList.remove("hidden");
};

window.closeAuth = function () {
  document.getElementById("authModal").classList.add("hidden");
};

window.requireLogin = function (action) {
  if (window.App.currentUser) {
    action();
    return;
  }
  pendingAction = action;
  window.openAuth();
};

window.toggleAuthMode = function () {
  authRegisterMode = !authRegisterMode;
  document.getElementById("authTitle").textContent = authRegisterMode ? "Fungura konti" : "Injira muri konti";
  document.getElementById("authButton").textContent = authRegisterMode ? "Iyandikishe" : "Injira";
  document.getElementById("authSwitch").textContent = authRegisterMode ? "Mfite konti — Injira" : "Nta konti mfite — Iyandikishe";
  document.getElementById("authName").style.display = authRegisterMode ? "block" : "none";
};

window.handleAuth = async function () {
  const name = document.getElementById("authName").value.trim();
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const msg = document.getElementById("authMessage");

  if (!email || !password) {
    msg.innerHTML = `<div class="notice error">Uzuza email na password.</div>`;
    return;
  }
  if (password.length < 6) {
    msg.innerHTML = `<div class="notice error">Password igomba kuba nibura inyuguti 6.</div>`;
    return;
  }

  try {
    if (firebaseReady) {
      const mods = getFirebaseModules();

      if (authRegisterMode) {
        const result = await mods.createUserWithEmailAndPassword(auth, email, password);
        await mods.setDoc(mods.doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          fullName: name,
          email,
          role: "passenger",
          isVerified: false,
          isAdmin: false,
          createdAt: mods.serverTimestamp()
        });
        window.App.currentUser = {
          uid: result.user.uid,
          email,
          fullName: name,
          role: "passenger",
          isVerified: false,
          isAdmin: false
        };
        msg.innerHTML = `<div class="notice success">Konti yakozwe neza.</div>`;
      } else {
        const result = await mods.signInWithEmailAndPassword(auth, email, password);
        window.App.currentUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || ""
        };
        await loadUserProfile();
        msg.innerHTML = `<div class="notice success">Winjiye neza.</div>`;
      }

      refreshHeader();
      setTimeout(finishAuthSuccess, 800);
    } else {
      if (authRegisterMode) {
        const localUser = {
          uid: "local_" + Date.now(),
          fullName: name,
          displayName: name,
          email,
          role: "passenger",
          isVerified: false,
          isAdmin: false
        };
        localStorage.setItem("mpr_user", JSON.stringify(localUser));
        window.App.currentUser = localUser;

        msg.innerHTML = `
          <div class="notice success">
            Konti ya demo yakozwe.
            Iyo Firebase imaze gushyirwamo, izaba konti nyayo.
          </div>`;
      } else {
        const saved = JSON.parse(localStorage.getItem("mpr_user") || "null");
        if (saved && saved.email === email) {
          window.App.currentUser = saved;
          msg.innerHTML = `<div class="notice success">Winjiye.</div>`;
        } else {
          msg.innerHTML = `<div class="notice error">Nta konti yabonetse kuri iyi email.</div>`;
          return;
        }
      }

      refreshHeader();
      setTimeout(finishAuthSuccess, 900);
    }
  } catch (error) {
    console.error(error);
    msg.innerHTML = `<div class="notice error">${friendlyAuthError(error)}</div>`;
  }
};

function finishAuthSuccess() {
  window.closeAuth();
  if (pendingAction) {
    const action = pendingAction;
    pendingAction = null;
    action();
  }
  refreshHeader();
}

window.logout = async function () {
  if (firebaseReady) {
    const mods = getFirebaseModules();
    await mods.signOut(auth); // onAuthStateChanged listener clears currentUser + refreshes header
  } else {
    window.App.currentUser = null;
    localStorage.removeItem("mpr_user");
    refreshHeader();
  }
  window.goHome();
};

function friendlyAuthError(error) {
  const code = error.code || "";
  if (code.includes("email-already-in-use")) return "Iyi email isanzwe ifite konti.";
  if (code.includes("invalid-credential")) return "Email cyangwa password ntabwo ari byo.";
  if (code.includes("invalid-email")) return "Email ntabwo imeze neza.";
  if (code.includes("weak-password")) return "Password iroroshye cyane.";
  return "Habaye ikibazo. Ongera ugerageze.";
}

/* =========================================================
   HEADER
   ========================================================= */

export function refreshHeader() {
  const el = document.getElementById("headerUser");
  if (!el) return;

  const user = window.App.currentUser;
  if (user) {
    const name = user.fullName || user.displayName || user.email || "Umukoresha";
    el.textContent = "Muraho, " + name + (user.isVerified ? " ✅" : "");
  } else {
    el.textContent = "Murakaza neza";
  }

  const profileSection = document.getElementById("profile");
  if (profileSection && !profileSection.classList.contains("hidden")) {
    renderProfile(user);
  }
}
window.refreshHeader = refreshHeader;
