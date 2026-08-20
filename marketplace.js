import { DataStore } from "./firebase.js";
import {
  renderMarketCards,
  renderMotorcycleCards,
  renderBusinessCards,
  escapeHtml
} from "./render.js";

export async function renderMarket(filterText = "") {
  let listings = await DataStore.list("listings");
  window.App.data.listings = listings;
  if (filterText) {
    const q = filterText.toLowerCase();
    listings = listings.filter(l => (l.title || "").toLowerCase().includes(q));
  }
  renderMarketCards(listings);
}

export async function renderMotorcycles() {
  const motorcycles = await DataStore.list("motorcycles");
  window.App.data.motorcycles = motorcycles;
  renderMotorcycleCards(motorcycles);
}

export async function renderBusinesses(filterText = "") {
  let businesses = await DataStore.list("businesses");
  window.App.data.businesses = businesses;
  if (filterText) {
    const q = filterText.toLowerCase();
    businesses = businesses.filter(
      b => (b.name || "").toLowerCase().includes(q) || (b.category || "").toLowerCase().includes(q)
    );
  }
  renderBusinessCards(businesses);
}

/* =========================================================
   ADD LISTING / MOTORCYCLE / BUSINESS (via generic modal)
   ========================================================= */

window.openAddListing = function () {
  showFormModal({
    title: "+ Shyiraho igicuruzwa",
    fields: [
      { id: "title", label: "Izina ry'igicuruzwa", type: "text" },
      { id: "category", label: "Ubwoko", type: "text" },
      { id: "price", label: "Igiciro (RWF)", type: "number" }
    ],
    onSubmit: async values => {
      await DataStore.add("listings", {
        title: values.title,
        category: values.category,
        price: Number(values.price) || 0,
        uid: window.App.currentUser.uid,
        isVerified: window.App.currentUser.isVerified || false
      });
      window.closeModal();
      await renderMarket();
      window.openPage("market");
    }
  });
};

window.openAddMotorcycle = function () {
  showFormModal({
    title: "+ Shyiraho Moto",
    fields: [
      { id: "title", label: "Ubwoko bwa moto (urugero: TVS HLX)", type: "text" },
      { id: "year", label: "Umwaka", type: "number" },
      { id: "price", label: "Igiciro (RWF)", type: "number" },
      { id: "description", label: "Ibisobanuro", type: "text" }
    ],
    onSubmit: async values => {
      await DataStore.add("motorcycles", {
        title: values.title,
        year: Number(values.year) || null,
        price: Number(values.price) || 0,
        description: values.description,
        uid: window.App.currentUser.uid,
        isVerified: window.App.currentUser.isVerified || false
      });
      window.closeModal();
      await renderMotorcycles();
      window.openPage("motorcycles");
    }
  });
};

window.openAddBusiness = function () {
  showFormModal({
    title: "+ Shyiraho Ubucuruzi",
    fields: [
      { id: "name", label: "Izina ry'ubucuruzi", type: "text" },
      { id: "category", label: "Ubwoko bw'ubucuruzi", type: "text" },
      { id: "phone", label: "Telefone", type: "text" },
      { id: "location", label: "Aho buherereye", type: "text" }
    ],
    onSubmit: async values => {
      await DataStore.add("businesses", {
        name: values.name,
        category: values.category,
        phone: values.phone,
        location: values.location,
        uid: window.App.currentUser.uid,
        isVerified: window.App.currentUser.isVerified || false
      });
      window.closeModal();
      await renderBusinesses();
      window.openPage("business");
    }
  });
};

function showFormModal({ title, fields, onSubmit }) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");

  content.innerHTML = `
    <h2>${escapeHtml(title)}</h2>
    ${fields.map(f => `
      <label>${escapeHtml(f.label)}</label>
      <input id="field_${f.id}" type="${f.type}">
    `).join("")}
    <button class="primary" id="submitFormBtn">Bika</button>
  `;

  modal.classList.remove("hidden");

  document.getElementById("submitFormBtn").onclick = async () => {
    const values = {};
    for (const f of fields) {
      values[f.id] = document.getElementById(`field_${f.id}`).value.trim();
    }
    await onSubmit(values);
  };
}

window.closeModal = function () {
  document.getElementById("modal").classList.add("hidden");
};

window.renderMarket = renderMarket;
window.renderMotorcycles = renderMotorcycles;
window.renderBusinesses = renderBusinesses;
