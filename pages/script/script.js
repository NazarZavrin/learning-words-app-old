"use strict";
import { createWarningAfterElement, setWarning } from "./useful.js";


const passwordInput = document.getElementById('password');
const showPassword = document.querySelector("input[type='checkbox']");
showPassword.addEventListener("change", function(event) {
    if (passwordInput.type === "password" && this.checked === true) {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
})
const infoInput = document.getElementById("info");
infoInput?.addEventListener("blur", infoIsCorrect);
passwordInput?.addEventListener("blur", passwordEntered);

const logInBtn = document.getElementById("log-in-btn");
logInBtn.addEventListener("click", async event => {
    if (passwordEntered(event) === false) {
        return;
    }
    let requestBody = {
        "password": passwordInput.value,
    }
    if (infoIsCorrect(event, requestBody) === false) {
        return;
    }
    let response = await fetch("/get-log-in-key", {
        method: "PATCH",
        body: JSON.stringify(requestBody),
    });
    if (response.ok) {
        let passkey = await response.text();
        if (passkey.endsWith(".")) {
            alert(passkey);
        } else {
            location.href = "/profile/" + passkey;
        }
    } else {
        console.log("Error " + response.status);
    }
})

const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+$/;
// console.log("Some-Email@gmail.com".match(emailRegex));
// console.log("wrong@email@gmail.com".match(emailRegex));
const userIdRegex = /^@[a-zA-Z0-9_.-]+$/;
function infoIsCorrect(event, requestBody = {}){
    createWarningAfterElement(infoInput);
    let warningText = "";
    if (!infoInput.value.includes("@")) {
        warningText = 'ID must begin with "@" symbol.';
    } else if (infoInput.value.startsWith("@")) {
        // ↓ userId validation
        if (infoInput.value.length > 20) {
            warningText = "ID must not exceed 20 characters.";
        } else if (infoInput.value.length < 5) {
            warningText = "ID must not be less than 5 characters.";
        } else if (infoInput.value.match(/@/g).length > 1) {
            warningText = 'ID must include only one "@" symbol.';
        } else if (infoInput.value.search(/\s/) >= 0) {
            warningText = "ID must not include space symbols.";
        } else if (!infoInput.value.match(userIdRegex)) {
            warningText = "Incorrect ID.";
        } else {
            requestBody.userId = infoInput.value;
        }
    } else {
        // ↓ email validation
        if (infoInput.value.length > 50) {
            warningText = "Email must not exceed 50 characters.";
        } else if (!infoInput.value.match(emailRegex)) {
            warningText = "Incorrect email.";
        } else {
            requestBody.email = infoInput.value;
        }
    }
    setWarning(infoInput, warningText, "infoInput");
    return warningText.length > 0 ? false : true;
}
function passwordEntered(event){
    if (passwordInput.value === "") {
        createWarningAfterElement(passwordInput);
        setWarning(passwordInput, "Please, enter password.", "passwordInput");
        return false;
    } else {
        createWarningAfterElement(passwordInput);
        setWarning(passwordInput, "");
        return true;
    }
}