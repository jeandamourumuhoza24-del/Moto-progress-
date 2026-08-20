import { DataStore } from "./firebase.js";
import { renderRiderCards, renderTripCards } from "./render.js";

function toRad(v) { return (v * Math.PI) / 180; }

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function renderRiders() {
  const riders = await DataStore.list("riders");
  window.App.data.riders = riders;
  renderRiderCards(sortByDistanceIfKnown(riders));
}

function sortByDistanceIfKnown(riders) {
  const pos = window.App.lastKnownPosition;
  if (!pos) return riders;
  return riders
    .map(r => ({
      ...r,
      distanceKm: (typeof r.lat === "number" && typeof r.lng === "number")
        ? distanceKm(pos.lat, pos.lng, r.lat, r.lng)
        : undefined
    }))
    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
}

window.findNearbyRiders = async function () {
  const statusEl = document.getElementById("riderStatus");

  if (!navigator.geolocation) {
    statusEl.innerHTML = `<div class="notice error">Iyi terefone ntishoboye kubona aho uri.</div>`;
    await renderRiders();
    return;
  }

  statusEl.innerHTML = `<div class="notice">📍 Turimo dushakisha aho uri...</div>`;

  navigator.geolocation.getCurrentPosition(
    async pos => {
      window.App.lastKnownPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      await renderRiders();
      statusEl.innerHTML = `<div class="notice success">✅ Abamotari bakwegereye babonetse, batondekanijwe uhereye ku wari hafi.</div>`;
    },
    async () => {
      statusEl.innerHTML = `<div class="notice error">Ntibyashobotse kubona aho uri. Reba uruhushya rwa GPS.</div>`;
      await renderRiders();
    }
  );
};

window.requestRide = async function (riderId) {
  window.requireLogin(async () => {
    const rider = (window.App.data.riders || []).find(r => r.id === riderId);
    const from = window.App.lastKnownPosition ? "Aho uri ubu" : "Ahantu hatazwi";

    await DataStore.add("trips", {
      passengerUid: window.App.currentUser.uid,
      riderId,
      riderName: rider?.fullName || "",
      from,
      to: "Aho ugiye",
      status: "pending"
    });

    await DataStore.add("notifications", {
      uid: window.App.currentUser.uid,
      title: "Icyifuzo cyoherejwe",
      body: `Wasabye ${rider?.fullName || "umumotari"} kuguha urugendo. Tegereza ko yemeza.`,
      read: false
    });

    alert("✅ Icyifuzo cyawe cyoherejwe kuri " + (rider?.fullName || "umumotari") + ".");
  });
};

window.quickRide = function () {
  window.requireLogin(async () => {
    window.openPage("riders");
    await window.findNearbyRiders();
  });
};

export async function renderTrips() {
  if (!window.App.currentUser) {
    renderTripCards([]);
    return;
  }
  const trips = await DataStore.list("trips", {
    where: ["passengerUid", "==", window.App.currentUser.uid]
  });
  window.App.data.trips = trips;
  renderTripCards(trips);
}

window.renderRiders = renderRiders;
window.renderTrips = renderTrips;
