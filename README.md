# Moto Progress Rwanda - Firebase + GitHub Pages

1. Kora Firebase project.
2. Fungura Authentication > Sign-in method > Email/Password.
3. Kora Firestore Database.
4. Firebase Console > Project settings > Your apps > Web app.
5. Kopiya Firebase config uyishyire muri `firebase-config.js`.
6. Shyira files zose muri GitHub repository `Moto-progress-`.
7. GitHub Pages: Settings > Pages > Deploy from branch > `main` > `/ (root)`.
8. Shyira `firestore.rules` muri Firebase Firestore Rules.

Icyitonderwa: Firebase Web config (apiKey n'izindi values za app) si password. Ntushyire muri code passwords cyangwa service-account private keys.
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

// ...

await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
);
