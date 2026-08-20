import { DataStore } from "./firebase.js";
import { PAYMENT_CONFIG } from "./firebase.js";

window.submitPayment = async function () {
  window.requireLogin(async () => {
    const amountEl = document.getElementById("paymentAmount");
    const purposeEl = document.getElementById("paymentPurpose");
    const referenceEl = document.getElementById("paymentReference");
    const statusEl = document.getElementById("paymentStatus");

    const amount = Number(amountEl.value);
    const purpose = purposeEl.value;
    const reference = referenceEl.value.trim();

    if (!amount || amount < 100) {
      statusEl.innerHTML = `<div class="notice error">Andika amafaranga nibura 100 RWF.</div>`;
      return;
    }
    if (!reference) {
      statusEl.innerHTML = `<div class="notice error">Andika reference ya Mobile Money.</div>`;
      return;
    }

    const providerReady =
      PAYMENT_CONFIG.provider && !PAYMENT_CONFIG.provider.startsWith("===") &&
      PAYMENT_CONFIG.endpoint && !PAYMENT_CONFIG.endpoint.startsWith("===");

    statusEl.innerHTML = `<div class="notice">⏳ Turimo gutunganya ubwishyu...</div>`;

    try {
      if (providerReady) {
        /* Ubwishyu nyabwo bugomba gucishwa kuri backend/payment provider
           yagenwe muri firebase.js -> PAYMENT_CONFIG.endpoint.
           Ntabwo hano hashyirwaho secret keys cyangwa server tokens. */
        const res = await fetch(PAYMENT_CONFIG.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            purpose,
            reference,
            uid: window.App.currentUser.uid
          })
        });
        if (!res.ok) throw new Error("Payment API error");
      }

      await DataStore.add("payments", {
        uid: window.App.currentUser.uid,
        amount,
        purpose,
        reference,
        status: providerReady ? "sent" : "demo-recorded"
      });

      statusEl.innerHTML = `<div class="notice success">✅ Ubwishyu bwoherejwe neza (${amount.toLocaleString("en-US")} RWF).</div>`;
      amountEl.value = "";
      referenceEl.value = "";
    } catch (error) {
      console.error(error);
      statusEl.innerHTML = `<div class="notice error">Habaye ikibazo mu kohereza ubwishyu. Ongera ugerageze.</div>`;
    }
  });
};
