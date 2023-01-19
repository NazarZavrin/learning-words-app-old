"use strict";
import { setWarning, userNameIsCorrect, emailIsCorrect, userIdIsCorrect, passwordIsCorrect } from "./useful.js";

const userNameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const userIdInput = document.getElementById('userId');
const passwordInput = document.getElementById('password');
const showPassword = document.querySelector("input[type='checkbox']");
const createAccountBtn = document.getElementById("create-account-btn");

userNameInput?.addEventListener("blur", userNameIsCorrect.bind(null, userNameInput, null));
emailInput?.addEventListener("blur", emailIsCorrect.bind(null, emailInput, null));
userIdInput?.addEventListener("focus", (event) => {
    if (event.target.value === "") {
        event.target.value = "@";
        setTimeout(() => {
            event.target.selectionStart = event.target.selectionEnd = 1;
        }, 0);// delay 0ms is needed to give the element time to get focus
        
    } else if (!event.target.value.startsWith("@")){
        event.target.value = "@" + event.target.value;
    }
})
userIdInput?.addEventListener("blur", userIdIsCorrect.bind(null, userIdInput, null));
passwordInput?.addEventListener("blur", passwordIsCorrect.bind(null, passwordInput, null));

showPassword?.addEventListener("change", function(event) {
    if (passwordInput.type === "password" && this.checked === true) {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
})

// id urlencoded
createAccountBtn?.addEventListener("click", async event => {
    let everythingIsCorrect = true;
    everythingIsCorrect = userNameIsCorrect(userNameInput, null, event) && everythingIsCorrect;
    everythingIsCorrect = emailIsCorrect(emailInput, null, event) && everythingIsCorrect;
    everythingIsCorrect = passwordIsCorrect(passwordInput, null, event) && everythingIsCorrect;
    if (!userIdInput.value.startsWith("@")) {
        let acception = confirm('ID must begin with "@" symbol. Add it before your id?');
        if (acception) {
            userIdInput.value = "@" + userIdInput.value;
            setWarning(userIdInput, "");
        }
    }
    everythingIsCorrect = userIdIsCorrect(userIdInput, null, event) && everythingIsCorrect;
    if (everythingIsCorrect === false) {
        return;
    }
    let form = document.querySelector("form");
    let requestBody = {};
    for (const element of form.elements) {
        let id = element.getAttribute("id");
        if (id !== "show-password") {
            requestBody[id] = element.value;
        }
    }
    let response = await fetch("/create-account/" + requestBody.userId, {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {"Content-Type": "application/json"}
    });
    if (response.ok) {
        let text = await response.text();
        if (text.endsWith(".")) {
            alert(text);
        } else {
            response = await fetch("/get-log-in-key", {
                method: "PATCH",
                body: JSON.stringify(requestBody),
                headers: {"Content-Type": "application/json"}
            });
            if (response.ok) {
                let passkey = await response.text();
                if (passkey.endsWith(".")) {
                    passkey = passkey[0].toLowerCase() + passkey.substring(1);
                    alert("Failed to log in: " + passkey);
                } else {
                    location.href = "/profile/" + passkey;
                }
            } else {
                console.log("Error " + response.status);
            }
        }
    } else {
        console.log("Error " + response.status);
    }
})

