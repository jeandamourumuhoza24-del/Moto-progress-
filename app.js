import { renderRiders, renderTrips } from "./rides.js";
import { renderMarket, renderMotorcycles, renderBusinesses } from "./marketplace.js";
import { renderNotifications } from "./notifications.js";
import { renderAdmin } from "./admin.js";
import { renderProfile } from "./render.js";
import { initMap } from "./map.js";
import { refreshHeader } from "./auth.js";
import { setupInputs } from "./input.js";

/* =========================================================
   NAVIGATION
   ========================================================= */

window.openPage = function (id) {
  document.querySelectorAll(".container > section").forEach(x => x.classList.add("hidden"));

  const page = document.getElementById(id);
  if (page) {
    page.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (id === "riders") renderRiders();
  if (id === "trips") renderTrips();
  if (id === "market") renderMarket();
  if (id === "motorcycles") renderMotorcycles();
  if (id === "business") renderBusinesses();
  if (id === "notifications") renderNotifications();
  if (id === "profile") renderProfile(window.App.currentUser);
  if (id === "admin") renderAdmin();
  if (id === "mapPage") setTimeout(initMap, 200);
};

window.goHome = function () {
  document.querySelectorAll(".container > section").forEach(x => x.classList.add("hidden"));
  document.getElementById("home").classList.remove("hidden");
};

window.openProfile = function () {
  window.openPage("profile");
};

/* =========================================================
   BOOTSTRAP
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupInputs();
  refreshHeader();
  window.goHome();
});
