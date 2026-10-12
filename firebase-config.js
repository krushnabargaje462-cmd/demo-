import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import { getDatabase } from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";


const firebaseConfig = {

    apiKey: "AIzaSyCJK88303Hy1CPGi4HzR8Dx1aG9eDy4Kkw",

    authDomain: "mission-titan.firebaseapp.com",

    projectId: "mission-titan",

    storageBucket: "mission-titan.firebasestorage.app",

    messagingSenderId: "521982175296",

    appId: "1:521982175296:web:ccc97a751aef9355d297a5",

    measurementId: "G-6WBF0YKH5B",

    databaseURL: "https://mission-titan-default-rtdb.asia-southeast1.firebasedatabase.app"

};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);