"use strict";
import { createWarningAfterElement, setWarning } from "./useful.js";

const userNameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const userIdInput = document.getElementById('userId');
const passwordInput = document.getElementById('password');
const showPassword = document.querySelector("input[type='checkbox']");
const createAccountBtn = document.getElementById("create-account-btn");

userNameInput?.addEventListener("blur", userNameIsCorrect);
emailInput?.addEventListener("blur", emailIsCorrect);
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
userIdInput?.addEventListener("blur", userIdIsCorrect);
passwordInput?.addEventListener("blur", passwordIsCorrect);

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
    everythingIsCorrect = userNameIsCorrect(event) && everythingIsCorrect;
    everythingIsCorrect = emailIsCorrect(event) && everythingIsCorrect;
    everythingIsCorrect = passwordIsCorrect(event) && everythingIsCorrect;
    if (!userIdInput.value.startsWith("@")) {
        let acception = confirm('ID must begin with "@" symbol. Add it before your id?');
        if (acception) {
            userIdInput.value = "@" + userIdInput.value;
            setWarning(userIdInput, "");
        }
    }
    everythingIsCorrect = userIdIsCorrect(event) && everythingIsCorrect;
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

function userNameIsCorrect(event) {
    createWarningAfterElement(userNameInput);
    let warningText = "";
    if (userNameInput.value.length > 50) {
        warningText = "Username must not exceed 50 characters.";
    } else if (userNameInput.value.length < 3) {
        warningText = "Username must not be less than 3 characters.";
    }
    setWarning(userNameInput, warningText, "userNameInput");
    return warningText.length > 0 ? false : true;
}
const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+$/;
// console.log("Some-Email@gmail.com".match(emailRegex));
// console.log("wrong@email@gmail.com".match(emailRegex));
function emailIsCorrect(event){
    createWarningAfterElement(emailInput);
    let warningText = "";
    if (emailInput.value.length > 50) {
        warningText = "Email must not exceed 50 characters.";
    } else if (!emailInput.value.match(emailRegex)) {
        warningText = "Incorrect email.";
    }
    setWarning(emailInput, warningText, "emailInput");
    return warningText.length > 0 ? false : true;
}
const userIdRegex = /^@[a-zA-Z0-9_.-]+$/;
function userIdIsCorrect(event){
    createWarningAfterElement(userIdInput);
    let warningText = "";
    if (userIdInput.value.length > 20) {
        warningText = "ID must not exceed 20 characters.";
    } else if (userIdInput.value.length < 5) {
        warningText = "ID must not be less than 5 characters.";
    } else if (!userIdInput.value.startsWith("@")) {
        warningText = 'ID must begin with "@" symbol.';
    } else if (userIdInput.value.match(/@/g).length > 1) {
        warningText = 'ID must include only one "@" symbol.';
    } else if (userIdInput.value.search(/\s/) >= 0) {
        warningText = "ID must not include space symbols.";
    } else if (!userIdInput.value.match(userIdRegex)) {
        warningText = "Incorrect ID.";
    }
    setWarning(userIdInput, warningText, "userIdInput");
    return warningText.length > 0 ? false : true;
}
function passwordIsCorrect(event) {
    createWarningAfterElement(passwordInput);
    let warningText = "";
    if (passwordInput.value.length > 20) {
        warningText = "Password must not exceed 20 characters.";
    } else if (passwordInput.value.length < 4) {
        warningText = "Password must not be less than 4 characters.";
    } else if (passwordInput.value.search(/\s/) >= 0) {
        warningText = "ID must not include space symbols.";
    }
    setWarning(passwordInput, warningText, "passwordInput");
    return warningText.length > 0 ? false : true;
}