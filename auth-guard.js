import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import { auth } from "./firebase-config.js";


onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.replace("login.html");

    }

});