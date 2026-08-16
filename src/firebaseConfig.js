// 1. Go to https://console.firebase.google.com, create a free project.
// 2. Inside the project, click the "</>" (Web) icon to register a web app.
// 3. Firebase gives you a config object that looks like the one below — paste
//    your real values in here, replacing every "PASTE_..." placeholder.
// 4. In the Firebase console sidebar, go to Build > Firestore Database >
//    Create database > Start in TEST MODE (fine for a short-lived election).

export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID",
};
