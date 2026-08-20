# 🏍️ Moto Progress Rwanda

Igikoresho (web app) gifasha abanyarwanda:
- **Gushaka motari** bakwegereye (GPS)
- **Kureba map n'inzira** (Map & GPS)
- **Kwishyura** (Mobile Money reference)
- **Kureba ingendo zawe** (Trips)
- **Marketplace** — kugura/kugurisha ibintu
- **Amamoto** ari kugurishwa
- **Ubucuruzi** bukwegereye
- **Notifications**
- **Profile** n'**Admin panel** (kwemeza abakoresho ✅)

---

## 📁 Uko umushinga ugizwe

```
moto-progress/
├── index.html          → Igishushanyo cy'ibanze (HTML shell)
├── style.css            → Imisusire (CSS) yose
├── manifest.json         → PWA manifest (kugira ngo app ishobore kwinjizwa nk'iyindi app)
├── icon-192.png, icon-512.png  → Amashusho ya PWA
│
├── firebase.js           → Firebase config + payment config + uburyo bwo kubika amakuru
│                            (Firestore niba Firebase yashyizweho, cyangwa localStorage
│                            niba nta Firebase iracyashyizweho — "demo mode")
├── auth.js               → Kwinjira / Kwiyandikisha / Gusohoka muri konti
├── render.js              → Uburyo bwo kwerekana urutonde (riders, market, n'ibindi)
│                            harimo n'akamenyetso ✅ Yemejwe
├── rides.js               → Gushaka abamotari bakwegereye + gusaba urugendo
├── payment.js             → Kohereza ubwishyu
├── map.js                 → Leaflet map + GPS + gushaka inzira (OSRM)
├── marketplace.js          → Kongeraho/kureba ibicuruzwa, amamoto, ubucuruzi
├── notifications.js        → Kwerekana ubutumwa bw'umukoresha
├── admin.js                → Admin panel (kwemeza abantu/ibintu — badge ✅)
├── input.js                → Guhuza search bars (global search, market, business)
└── app.js                  → Aho byose bihurira: navigation (openPage/goHome) + bootstrap
```

---

## 🔥 Gushyiraho Firebase

1. Fungura [Firebase Console](https://console.firebase.google.com) → hitamo project yawe.
2. **Authentication** → *Sign-in method* → fungura **Email/Password**.
3. **Firestore Database** → *Create database* (production mode).
4. Muri **Firestore Rules**, shyiramo urugero rw'itangira (uzabihindura nyuma kugira ngo birusheho kuba byizewe):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

5. Config ya Firebase (apiKey, projectId, n'ibindi) isanzwe muri `firebase.js` — niba uhindura project, yisimbuze aho biri hejuru muri iyo file (`FIREBASE_CONFIG`).

> ⚠️ Nta ho ushyira payment secret keys, service account keys cyangwa GitHub tokens muri iyi file cyangwa ahandi muri frontend. `PAYMENT_CONFIG` muri `firebase.js` igenewe gusa endpoint ya backend/payment provider yawe (izakora ubwishyu nyabwo hakoreshejwe backend, atari frontend).

---

## 🌐 Kuyishyira kuri interineti (deploy)

### Uburyo A — GitHub Pages (bworoshye, ntibisaba terminal)
1. Kora repository kuri GitHub, ushyiremo amafile yose y'uyu mushinga.
2. Muri repository → **Settings** → **Pages** → *Deploy from a branch* → `main` / `root` → **Save**.
3. Uzahabwa link nka `https://izina-ryawe.github.io/izina-rya-repo/`.
4. Muri Firebase Console → **Authentication** → **Settings** → **Authorized domains**, ongeraho iyo domain (`izina-ryawe.github.io`) kugira ngo login ikore.

### Uburyo B — Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 🧪 Demo mode (nta Firebase ikenewe)

Niba `FIREBASE_CONFIG` muri `firebase.js` itarahinduka (iracyanditse `=== SHYIRAMO ... ===`), app ikoresha **localStorage** aho gukoresha Firebase, kugira ngo ushobore kwipimisha ako kanya nta interineti cyangwa konti ya Firebase bisabwa. Amakuru y'icyo gihe abikwa gusa kuri terefone/mudasobwa wakoresheje.

---

## ✅ Akamenyetso k'uwemejwe (Verified badge)

Umuntu (umumotari, ubucuruzi, cyangwa igicuruzwa) agira akamenyetso **✅ Yemejwe** iyo umukoresha ufite uburenganzira bwa **Admin** amwemeje muri **Admin Panel** (Profile → 👑 Admin, igaragara gusa ku bafite `isAdmin: true`).

Kugira ngo umuntu abe Admin bwa mbere, muri Firestore (cyangwa localStorage niba uri muri demo mode), shakisha inyandiko (document) ye muri `users` cyangwa `mpr_user`, uhindure:
```json
"isAdmin": true
```

---

## 🛠️ Gukorera kuri terefone (Spck Editor cyangwa ahandi)

Uyu mushinga ni **static site** isanzwe (HTML/CSS/JS ya module), nta build step (Webpack/Vite/Node) ikenewe. Ushobora kuyifungura ako kanya muri browser cyangwa Spck Editor preview.
