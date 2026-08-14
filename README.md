# Moto Progress Rwanda — Web

Iyi ni web/PWA version ya Moto Progress. Ikoresha localStorage ku gikoresho; nta server/database ikenera kugira ngo igeragezwe.

## Kuyitangaza kuri Firebase Hosting
1. Shyiramo Firebase CLI kuri mudasobwa: `npm install -g firebase-tools`
2. Injira: `firebase login`
3. Injira muri folder: `cd moto-web`
4. `firebase init hosting` (hitamo project ya Firebase, public directory `.`; ntuhindure index.html)
5. `firebase deploy`

Ibi bizaguha URL ya `PROJECT_ID.web.app`.

## Icyitonderwa
Version iyi ni working prototype/web app ifite data ibikwa muri browser. Niba ushaka users benshi, login na database ihuriweho na Android app, hakenerwa Firebase Authentication + Firestore.
