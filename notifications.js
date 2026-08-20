import { DataStore } from "./firebase.js";
import { renderNotificationCards } from "./render.js";

export async function renderNotifications() {
  if (!window.App.currentUser) {
    renderNotificationCards([]);
    return;
  }
  const notifications = await DataStore.list("notifications", {
    where: ["uid", "==", window.App.currentUser.uid]
  });
  window.App.data.notifications = notifications;
  renderNotificationCards(notifications);
  markAllRead(notifications);
}

async function markAllRead(notifications) {
  for (const n of notifications) {
    if (!n.read) {
      await DataStore.setDoc("notifications", n.id, { read: true });
    }
  }
}

window.renderNotifications = renderNotifications;
