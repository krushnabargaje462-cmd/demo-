import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import { auth } from "./firebase-config.js";


const form = document.getElementById("loginForm");

const password = document.getElementById("password");

const showPassword = document.getElementById("showPassword");

const message = document.getElementById("loginMessage");


/* SHOW / HIDE PASSWORD */

showPassword.addEventListener("click", () => {

    if (password.type === "password") {

        password.type = "text";
        showPassword.innerHTML = "🙈";

    } else {

        password.type = "password";
        showPassword.innerHTML = "👁";

    }

});


/* LOGIN */

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email =
        document.getElementById("userId").value.trim();

    const userPassword = password.value;


    if (!email || !userPassword) {

        message.innerHTML =
            "Please enter your email and password.";

        message.style.color = "#ff6b6b";

        return;
    }


    message.innerHTML = "Authenticating...";
    message.style.color = "#00bfff";


    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                userPassword
            );


        console.log(
            "Logged in:",
            userCredential.user.email
        );


        message.innerHTML =
            "✓ Authentication successful";

        message.style.color = "#00ff88";


        setTimeout(() => {

           window.location.href = "index.html";

        }, 700);


    }  catch (error) {

    console.log("CODE:", error.code);
    console.log("MESSAGE:", error.message);

    message.innerHTML = error.code;
    message.style.color = "#ff4d4d";

}


});