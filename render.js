import { DataStore } from "./firebase.js";

/* =========================================================
   VERIFIED / ADMIN BADGE
   =========================================================
   Umuntu wemejwe (isVerified === true) agaragara afite
   akamenyetso ✅ Yemejwe. Owner/Admin (isAdmin === true)
   agaragara afite akamenyetso 👑 Admin. Iyi badge igaragara
   ahantu hose izina ry'umuntu rigaragara: abamotari, profile,
   marketplace, amamoto, ubucuruzi.
   ========================================================= */

export function nameWithBadge(name, person = {}) {
  const badges = [];
  if (person.isAdmin) {
    badges.push(`<span class="badge admin">👑 Admin</span>`);
  }
  if (person.isVerified) {
    badges.push(`<span class="badge verified">✅ Yemejwe</span>`);
  }
  return `<span class="name-row"><b>${escapeHtml(name)}</b>${badges.join("")}</span>`;
}

export function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatRWF(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString("en-US") + " RWF";
}

export function emptyState(message) {
  return `<div class="empty">${escapeHtml(message)}</div>`;
}

/* =========================================================
   RIDERS
   ========================================================= */

export function renderRiderCards(riders) {
  const el = document.getElementById("riderList");
  if (!el) return;

  if (!riders || riders.length === 0) {
    el.innerHTML = emptyState("Nta bamotari babonetse kuri ubu.");
    return;
  }

  el.innerHTML = riders.map(r => `
    <div class="list">
      <div class="list-row">
        <div class="userbox">
          <div class="avatar">🏍️</div>
          <div>
            ${nameWithBadge(r.fullName || "Umumotari", r)}
            <div><small>${escapeHtml(r.plate || "")}</small></div>
            ${typeof r.distanceKm === "number" ? `<small>${r.distanceKm.toFixed(1)} km uvuye aho uri</small>` : ""}
          </div>
        </div>
        <button class="secondary" style="width:auto" onclick="window.requestRide('${r.id}')">Saba</button>
      </div>
    </div>
  `).join("");
}

/* =========================================================
   TRIPS
   ========================================================= */

export function renderTripCards(trips) {
  const el = document.getElementById("tripList");
  if (!el) return;

  if (!trips || trips.length === 0) {
    el.innerHTML = emptyState("Nta ngendo ufite kugeza ubu.");
    return;
  }

  const statusLabel = {
    pending: "Birategerejwe",
    accepted: "Byemejwe",
    completed: "Byarangiye",
    cancelled: "Byahagaritswe"
  };

  el.innerHTML = trips.map(t => `
    <div class="list">
      <div class="list-row">
        <div>
          <b>${escapeHtml(t.from || "—")} → ${escapeHtml(t.to || "—")}</b>
          <div><small>${new Date(t.createdAt?.seconds ? t.createdAt.seconds * 1000 : t.createdAt).toLocaleString("rw-RW")}</small></div>
        </div>
        <span class="badge">${statusLabel[t.status] || t.status}</span>
      </div>
    </div>
  `).join("");
}

/* =========================================================
   MARKETPLACE
   ========================================================= */

export function renderMarketCards(listings) {
  const el = document.getElementById("marketList");
  if (!el) return;

  if (!listings || listings.length === 0) {
    el.innerHTML = emptyState("Nta bicuruzwa bibonetse.");
    return;
  }

  el.innerHTML = listings.map(l => `
    <div class="list">
      <div class="list-row">
        <div>
          ${nameWithBadge(l.title || "Igicuruzwa", l)}
          <div><small>${escapeHtml(l.category || "")}</small></div>
        </div>
        <div class="price">${formatRWF(l.price)}</div>
      </div>
    </div>
  `).join("");
}

export function renderMotorcycleCards(motorcycles) {
  const el = document.getElementById("motorcycleList");
  if (!el) return;

  if (!motorcycles || motorcycles.length === 0) {
    el.innerHTML = emptyState("Nta mamoto ari kugurishwa kuri ubu.");
    return;
  }

  el.innerHTML = motorcycles.map(m => `
    <div class="list">
      <div class="list-row">
        <div>
          ${nameWithBadge(m.title || "Moto", m)}
          <div><small>${escapeHtml(String(m.year || ""))} · ${escapeHtml(m.description || "")}</small></div>
        </div>
        <div class="price">${formatRWF(m.price)}</div>
      </div>
    </div>
  `).join("");
}

export function renderBusinessCards(businesses) {
  const el = document.getElementById("businessList");
  if (!el) return;

  if (!businesses || businesses.length === 0) {
    el.innerHTML = emptyState("Nta bucuruzi bubonetse.");
    return;
  }

  el.innerHTML = businesses.map(b => `
    <div class="list">
      <div class="list-row">
        <div>
          ${nameWithBadge(b.name || "Ubucuruzi", b)}
          <div><small>${escapeHtml(b.category || "")} · ${escapeHtml(b.location || "")}</small></div>
        </div>
        <a class="secondary" style="width:auto;text-decoration:none;padding:10px 14px" href="tel:${escapeHtml(b.phone || "")}">📞</a>
      </div>
    </div>
  `).join("");
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

export function renderNotificationCards(notifications) {
  const el = document.getElementById("notificationList");
  if (!el) return;

  if (!notifications || notifications.length === 0) {
    el.innerHTML = emptyState("Nta butumwa ufite.");
    return;
  }

  el.innerHTML = notifications.map(n => `
    <div class="list" style="${n.read ? "opacity:.65" : ""}">
      <div class="list-row">
        <div>
          <b>${escapeHtml(n.title || "")}</b>
          <div><small>${escapeHtml(n.body || "")}</small></div>
        </div>
        ${n.read ? "" : `<span class="badge">Gishya</span>`}
      </div>
    </div>
  `).join("");
}

/* =========================================================
   PROFILE
   ========================================================= */

export function renderProfile(user) {
  const el = document.getElementById("profileContent");
  if (!el) return;

  if (!user) {
    el.innerHTML = `
      <div class="card" style="text-align:center">
        <div class="auth-logo">👤</div>
        <p>Ntabwo winjiye muri konti.</p>
        <button class="primary" onclick="window.openAuth()">Injira / Iyandikishe</button>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="card">
      <div class="userbox">
        <div class="avatar">${(user.fullName || user.displayName || "U")[0].toUpperCase()}</div>
        <div>
          ${nameWithBadge(user.fullName || user.displayName || "Umukoresha", user)}
          <div><small>${escapeHtml(user.email || "")}</small></div>
        </div>
      </div>
    </div>
    <div class="card">
      <p><b>Uruhare:</b> ${escapeHtml(user.role || "passenger")}</p>
      ${user.isAdmin ? `<button class="secondary" onclick="window.openPage('admin')">👑 Fungura Admin Panel</button>` : ""}
      <button class="danger" style="width:100%;border-radius:11px" onclick="window.logout()">Sohoka muri konti</button>
    </div>
  `;
}
