"use strict";
const userNameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const userIdInput = document.getElementById('userId');
const passwordInput = document.getElementById('password');
const showPassword = document.querySelector("input[type='checkbox']");
const createAccountBtn = document.getElementById("create-account-btn");

userNameInput.addEventListener("blur", userNameIsCorrect);
emailInput.addEventListener("blur", emailIsCorrect);
userIdInput.addEventListener("focus", (event) => {
    if (event.target.value === "") {
        event.target.value = "@";
        setTimeout(() => {
            event.target.selectionStart = event.target.selectionEnd = 1;
        }, 0);// delay 0ms is needed to give the element time to get focus
        
    } else if (!event.target.value.startsWith("@")){
        event.target.value = "@" + event.target.value;
    }
})
userIdInput.addEventListener("blur", idIsCorrect);
passwordInput.addEventListener("blur", passwordIsCorrect);

showPassword.addEventListener("change", event => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
})

// id urlencoded
createAccountBtn.addEventListener("click", async event => {
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
    everythingIsCorrect = idIsCorrect(event) && everythingIsCorrect;
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
    console.log(requestBody);
    let response = await fetch("/create-account/" + requestBody.userId, {
        method: "POST",
        body: JSON.stringify(requestBody),
    });
    if (response.ok) {
        let text = await response.text();
        console.log(text);
    } else {
        console.log("Error " + response.status);
    }
})

function createWarningElementAfter(element){
    // console.log("warning after:");
    // console.log(element);
    for (let i = 0; !element.nextElementSibling.matches('.warning') && i < 10; i++) {
        element.insertAdjacentHTML("afterend", '<b class="warning"></b>');
    }
}
function setWarning(element, warningText, elemName = ""){
    if (element.nextElementSibling.matches('.warning')) {
        element.nextElementSibling.textContent = warningText;
    } else if (warningText) {
        console.log(elemName + ":", warningText);
    }
}

function userNameIsCorrect(event) {
    createWarningElementAfter(userNameInput);
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
    createWarningElementAfter(emailInput);
    let warningText = "";
    if (emailInput.value.length > 50) {
        warningText = "Email must not exceed 50 characters.";
    } else if (!emailInput.value.match(emailRegex)) {
        warningText = "Incorrect email.";
    }
    setWarning(emailInput, warningText, "emailInput");
    return warningText.length > 0 ? false : true;
}
const idRegex = /^@[a-zA-Z0-9_.-]+$/;
function idIsCorrect(event){
    createWarningElementAfter(userIdInput);
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
    } else if (!userIdInput.value.match(idRegex)) {
        warningText = "Incorrect ID.";
    }
    setWarning(userIdInput, warningText, "userIdInput");
    return warningText.length > 0 ? false : true;
}
function passwordIsCorrect(event) {
    createWarningElementAfter(passwordInput);
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