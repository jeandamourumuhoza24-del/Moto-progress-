let leafletMap = null;
let userMarker = null;
let routeLine = null;

const KIGALI_CENTER = [-1.9536, 30.0605];

export function initMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl || typeof L === "undefined") return;

  if (!leafletMap) {
    leafletMap = L.map("map").setView(KIGALI_CENTER, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(leafletMap);
  } else {
    leafletMap.invalidateSize();
  }

  const pos = window.App.lastKnownPosition;
  if (pos) placeUserMarker(pos.lat, pos.lng);
}

function placeUserMarker(lat, lng) {
  if (!leafletMap) return;
  if (userMarker) leafletMap.removeLayer(userMarker);
  userMarker = L.marker([lat, lng]).addTo(leafletMap).bindPopup("📍 Aho uri").openPopup();
  leafletMap.setView([lat, lng], 15);
}

window.locateMe = function () {
  if (!navigator.geolocation) {
    alert("Iyi terefone ntishoboye kubona aho uri.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      window.App.lastKnownPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      window.openPage("mapPage");
      setTimeout(() => {
        initMap();
        placeUserMarker(pos.coords.latitude, pos.coords.longitude);
      }, 200);
    },
    () => alert("Ntibyashobotse kubona aho uri. Reba uruhushya rwa GPS.")
  );
};

window.findRoute = async function () {
  const destInput = document.getElementById("destination");
  const resultEl = document.getElementById("routeResult");
  const destination = destInput.value.trim();

  if (!destination) {
    resultEl.innerHTML = `<div class="notice error">Andika aho ujya.</div>`;
    return;
  }
  if (!window.App.lastKnownPosition) {
    resultEl.innerHTML = `<div class="notice error">Banza umenye aho uri (📍 Menya aho ndi).</div>`;
    return;
  }

  resultEl.innerHTML = `<div class="notice">🔎 Turashaka "${destination}"...</div>`;

  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(destination)}, Rwanda`
    );
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      resultEl.innerHTML = `<div class="notice error">Nta hantu habonetse hitwa "${destination}".</div>`;
      return;
    }

    const destLat = Number(geoData[0].lat);
    const destLng = Number(geoData[0].lon);
    const { lat, lng } = window.App.lastKnownPosition;

    const routeRes = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${destLng},${destLat}?overview=full&geometries=geojson`
    );
    const routeData = await routeRes.json();

    if (!routeData.routes || routeData.routes.length === 0) {
      resultEl.innerHTML = `<div class="notice error">Ntibyashobotse kubona inzira.</div>`;
      return;
    }

    const route = routeData.routes[0];
    const km = (route.distance / 1000).toFixed(1);
    const minutes = Math.round(route.duration / 60);

    resultEl.innerHTML = `<div class="notice success">🛣️ ${km} km — bizatwara hafi iminota ${minutes}.</div>`;

    if (leafletMap) {
      if (routeLine) leafletMap.removeLayer(routeLine);
      const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
      routeLine = L.polyline(coords, { color: "#087f23", weight: 5 }).addTo(leafletMap);
      leafletMap.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
      L.marker([destLat, destLng]).addTo(leafletMap).bindPopup("🏁 " + destination);
    }
  } catch (error) {
    console.error(error);
    resultEl.innerHTML = `<div class="notice error">Habaye ikibazo mu gushaka inzira. Ongera ugerageze.</div>`;
  }
};

window.initMap = initMap;
