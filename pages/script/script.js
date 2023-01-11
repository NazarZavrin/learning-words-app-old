"use strict";
const passwordInput = document.getElementById('password');
const showPassword = document.querySelector("input[type='checkbox']");
showPassword.addEventListener("change", event => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
})
const logInBtn = document.getElementById("log-in-btn");
const infoInput = document.getElementById("info");
logInBtn.addEventListener("click", async event => {
    if (infoInput.value === "" || passwordInput.value === "") {
        alert("Please, fill all text inputs.");
        return;
    }
    let requestBody = {
        "password": passwordInput.value,
    }
    if (infoInput.value.startsWith("@")) {
        requestBody.userId = infoInput.value;
    } else {
        // email validation
        requestBody.email = infoInput.value;
    }
    
    
    let response = await fetch("/get-log-in-key", {
        method: "PATCH",
        body: JSON.stringify(requestBody),
    });
    if (response.ok) {
        let passkey = await response.text();
        if (passkey === "Wrong password") {
            console.log("Wrong password. Try again.");
        } else {
            location.href = "/profile/" + passkey;
        }
    } else {
        console.log("Error " + response.status);
        return;
    }
})


