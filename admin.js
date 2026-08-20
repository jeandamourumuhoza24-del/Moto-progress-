import { DataStore } from "./firebase.js";
import { nameWithBadge, escapeHtml, emptyState, formatRWF } from "./render.js";

/* =========================================================
   👑 OWNER DASHBOARD
   =========================================================
   Ahantu admin/owner abona incamake y'ibyabaye byose (stats),
   hanyuma agakemeza (verify) umuntu cyangwa ikintu — akamenyetso
   ✅ Yemejwe kagahita kagaragara ahantu hose iryo zina cyangwa
   icyo gicuruzwa bigaragara. Iyi paji igaragara/ikorwa gusa ku
   bafite isAdmin === true.
   ========================================================= */

const VERIFY_SECTIONS = [
  { key: "riders", label: "🏍️ Abamotari", nameField: "fullName" },
  { key: "businesses", label: "🏪 Ubucuruzi", nameField: "name" },
  { key: "listings", label: "🛒 Ibicuruzwa", nameField: "title" },
  { key: "motorcycles", label: "🏍️ Amamoto agurishwa", nameField: "title" }
];

export async function renderAdmin() {
  const container = document.getElementById("adminContent");
  if (!container) return;

  if (!window.App.currentUser || !window.App.currentUser.isAdmin) {
    container.innerHTML = `
      <div class="notice error">
        Iyi paji ni iy'abakoresha admin/owner gusa.
      </div>`;
    return;
  }

  container.innerHTML = `<div class="notice">⏳ Turimo gutegura dashboard...</div>`;

  const [users, riders, trips, payments, listings, motorcycles, businesses] = await Promise.all([
    DataStore.list("users"),
    DataStore.list("riders"),
    DataStore.list("trips"),
    DataStore.list("payments"),
    DataStore.list("listings"),
    DataStore.list("motorcycles"),
    DataStore.list("businesses")
  ]);

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingTrips = trips.filter(t => t.status === "pending").length;
  const unverifiedCount =
    riders.filter(r => !r.isVerified).length +
    businesses.filter(b => !b.isVerified).length +
    listings.filter(l => !l.isVerified).length +
    motorcycles.filter(m => !m.isVerified).length;

  container.innerHTML = `
    <div class="grid" style="margin-bottom:6px">
      ${statCard("👥", "Abakoresha", users.length)}
      ${statCard("🏍️", "Abamotari", riders.length)}
      ${statCard("🛣️", "Ingendo (birategerejwe)", pendingTrips + " / " + trips.length)}
      ${statCard("💰", "Ubwishyu bwose", formatRWF(totalPaid))}
      ${statCard("🛒", "Ibicuruzwa", listings.length)}
      ${statCard("🏍️", "Amamoto agurishwa", motorcycles.length)}
      ${statCard("🏪", "Ubucuruzi", businesses.length)}
      ${statCard("⏳", "Bitaremezwa (✅)", unverifiedCount)}
    </div>
  `;

  const sections = await Promise.all(
    VERIFY_SECTIONS.map(async s => ({
      ...s,
      items: { riders, businesses, listings, motorcycles }[s.key]
    }))
  );

  container.innerHTML += sections.map(s => `
    <div class="card">
      <h3>${s.label}</h3>
      ${s.items.length === 0 ? emptyState("Nta bimazemo.") : s.items.map(item => `
        <div class="list">
          <div class="list-row">
            ${nameWithBadge(item[s.nameField] || "—", item)}
            <div style="display:flex;gap:6px">
              <button class="secondary" style="width:auto" onclick="window.toggleVerify('${s.key}','${item.id}',${!item.isVerified})">
                ${item.isVerified ? "Kuraho ✅" : "Emeza ✅"}
              </button>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `).join("");
}

function statCard(icon, label, value) {
  return `
    <div class="service" style="min-height:auto;padding:16px 10px">
      <span class="ico" style="font-size:26px">${icon}</span>
      <b style="font-size:19px">${escapeHtml(String(value))}</b>
      <small>${escapeHtml(label)}</small>
    </div>
  `;
}

window.toggleVerify = async function (collectionName, id, nextValue) {
  await DataStore.setDoc(collectionName, id, { isVerified: nextValue });
  await renderAdmin();

  /* Keep every already-rendered list in sync with the new badge state */
  if (collectionName === "riders" && typeof window.renderRiders === "function") window.renderRiders();
  if (collectionName === "businesses" && typeof window.renderBusinesses === "function") window.renderBusinesses();
  if (collectionName === "listings" && typeof window.renderMarket === "function") window.renderMarket();
  if (collectionName === "motorcycles" && typeof window.renderMotorcycles === "function") window.renderMotorcycles();
};

window.renderAdmin = renderAdmin;
