const btn = document.getElementById("themeBtn");

// Load saved theme
if(localStorage.getItem("theme") === "light"){
    document.body.classList.add("light");
    if(btn) btn.innerHTML = "🌞";
}

if(btn){
    btn.onclick = function(){

        document.body.classList.toggle("light");

        if(document.body.classList.contains("light")){

            btn.innerHTML = "🌞";
            localStorage.setItem("theme","light");

        }else{

            btn.innerHTML = "🌙";
            localStorage.setItem("theme","dark");

        }

    }
}