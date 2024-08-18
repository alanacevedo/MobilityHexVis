import { initializeApp } from "firebase/app"

const firebaseConfig = {

    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,

    authDomain: "od-chile-vis.firebaseapp.com",

    projectId: "od-chile-vis",

    storageBucket: "od-chile-vis.appspot.com",

    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,

    appId: import.meta.env.VITE_FIREBASE_APP_ID,

    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID

};

const app = initializeApp(firebaseConfig)
export { app }

//firebase login
// firebase init
// firebase deploy --only hosting:od-chile-vis
