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
const idInput = document.getElementById('id');
idInput.addEventListener("focus", function (event) {
    if (this.value === "") {
        this.value = "@";
    } else if (!this.value.startsWith("@")){
        this.value = "@" + this.value;
    }
})

// email validation, id urlencoded
const createAccountBtn = document.getElementById("create-account-btn");
createAccountBtn.addEventListener("click", async event => {
    if (!idInput.value.startsWith("@")) {
        let acception = confirm('ID must begin with "@" symbol. Add it before your id?');
        if (!acception) {
            return;
        } else {
            idInput.value = "@" + idInput.value;
        }
    }
    console.log("add user");
    let form = document.querySelector("form");
    let requestBody = {};
    for (const element of form.elements) {
        let id = element.getAttribute("id");
        if (id !== "show-password") {
            if (element.value === "") {
                alert("Please, fill all text inputs.");
                return;
            }
            requestBody[id] = element.value;
        }
    }
    console.log(requestBody);
    let response = await fetch("/create-account/" + requestBody.id, {
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