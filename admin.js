import { DataStore } from "./firebase.js";
import { nameWithBadge, escapeHtml, emptyState } from "./render.js";

/* =========================================================
   ADMIN / OWNER PANEL
   =========================================================
   Ahantu admin/owner ashobora kwemeza (verify) umuntu
   cyangwa ikintu — akamenyetso ✅ Yemejwe kagahita kagaragara
   ahantu hose iryo zina cyangwa icyo gicuruzwa bigaragara.
   ========================================================= */

const SECTIONS = [
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

  container.innerHTML = `<div class="notice">⏳ Turimo gutegura...</div>`;

  const sections = await Promise.all(
    SECTIONS.map(async s => ({ ...s, items: await DataStore.list(s.key) }))
  );

  container.innerHTML = sections.map(s => `
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
