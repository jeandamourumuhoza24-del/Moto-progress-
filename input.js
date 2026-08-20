import { renderMarket, renderBusinesses } from "./marketplace.js";

const SERVICE_KEYWORDS = {
  riders: ["motari", "moto", "rider", "shaka motari"],
  mapPage: ["map", "gps", "aho ndi", "inzira"],
  payment: ["kwishyura", "amafaranga", "payment", "money"],
  trips: ["ingendo", "trip", "urugendo"],
  market: ["marketplace", "gura", "gurisha", "igicuruzwa"],
  motorcycles: ["amamoto", "moto igurishwa", "motorcycle"],
  business: ["ubucuruzi", "business", "serivisi"],
  notifications: ["notification", "ubutumwa"]
};

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function setupGlobalSearch() {
  const input = document.getElementById("globalSearch");
  if (!input) return;

  input.addEventListener("input", debounce(() => {
    const q = input.value.trim().toLowerCase();
    if (!q) return;

    const match = Object.entries(SERVICE_KEYWORDS).find(([, keywords]) =>
      keywords.some(k => k.includes(q) || q.includes(k))
    );

    if (match) {
      window.openPage(match[0]);
    }
  }));
}

function setupMarketSearch() {
  const input = document.getElementById("marketSearch");
  if (!input) return;
  input.addEventListener("input", debounce(() => renderMarket(input.value.trim())));
}

function setupBusinessSearch() {
  const input = document.getElementById("businessSearch");
  if (!input) return;
  input.addEventListener("input", debounce(() => renderBusinesses(input.value.trim())));
}

export function setupInputs() {
  setupGlobalSearch();
  setupMarketSearch();
  setupBusinessSearch();
}
