"use strict";
console.log(HTMLElement.prototype);
console.log("now:");
// console.log("add posibitity to delete account");
// console.log("delete groups of the user after deletion of the user");
console.log("group creation in class Group");
console.log("copy (duplicate) selected word to another group");
console.log('<section class="checkboxes"></section> to hide word/translation using height: 0');
console.log("groups.js: fetch(location.href + '/groups/view/' + groupName) groupName might be in russian, send it in headers/body");
console.log("during studying at college:");
console.log("как отправлять запросы (например пост) в node js? (study node-fetch)");
console.log("make a route, which checks if password is correct and returns correct/incorrect. use it while changing profile's info and delete account");
console.log("at the end of developping:");
console.log("forgot password? we will email you with temp password (node-emailer or smth else).");
console.log("enter password to change infoPart");
console.log("add modals instead of alert()");

import { setWarning, createWarningAfterElement, showModalWindow, createElement, showPassword, } from "./useful.js";
import "./change-profile-info.js";
import "./groups.js";

const infoBtn = document.querySelector(".header__info-btn");
const profileLabel = document.querySelector(".header__profile-label");
const infoSidebar = document.querySelector(".profile-info");

infoBtn.classList.remove("active");// when page loads remove
infoSidebar.classList.remove("active");// when page loads remove
infoBtn.addEventListener("click", event => {
    infoBtn.classList.toggle("active");
    infoSidebar.classList.toggle("active");
})
profileLabel.addEventListener("click", event => {
    event.preventDefault();
    infoBtn.click();
})


const logOutBtn = document.getElementById("log-out-btn");
logOutBtn.addEventListener("click", async event => {
    // fetch register log out
    location.href = "/";
})
const deleteAccountBtn = document.getElementById("delete-account-btn");
deleteAccountBtn.addEventListener("click", async event => {
    let header = createElement({name: "header", content: "To verify personality enter your password:"},);
    let passwordInput = createElement({name: "input"});
    passwordInput.setAttribute("type", "password");
    passwordInput.setAttribute("autocomplete", "off");
    let passwordBlock = createElement({name: "form", class: "password-block"});
    passwordBlock.innerHTML = `<div class="show-password">
    <input type="checkbox">Show password</div>`;
    passwordBlock.prepend(passwordInput);
    let checkPasswordBtnStyles = `
    background-color: dodgerblue; color: white;
    border-radius: 3px;
    padding: 1px 3px;`;
    let checkPasswordBtn = createElement({content: "OK", style: checkPasswordBtnStyles});
    checkPasswordBtn.addEventListener("click", async event => {
        let everythingIsCorrect = true;
        if (passwordInput.value.length === 0) {
            createWarningAfterElement(passwordInput);
            setWarning(passwordInput.nextElementSibling, "Please, enter password.", "passwordInput");
            everythingIsCorrect = false;
        } else {
            setWarning(passwordInput.nextElementSibling, "");
        }
        if (everythingIsCorrect === false) {
            return;
        }
        // console.log(passwordInput.value);
        // return;
        let response = await fetch(location.href + "/delete", {
            method: "DELETE",
            body: JSON.stringify({password: passwordInput.value}),
            headers: {'Content-Type': 'application/json'}
        })
        let result;
        if (response.ok) {
            result = await response.json();
            console.log(result);
            if (result.success) {
                event.target.closest(".modal-window").closeWindow();
                location.href = "/";
                return;
            }
        }
        if (result.message.includes("Password don't match")) {
            createWarningAfterElement(passwordInput);
            setWarning(passwordInput.nextElementSibling, result.message, "passwordInput");
            return;
        }
        console.log(result?.message || "Deletion error. Please try again.");
        alert(result?.message || "Deletion error. Please try again.");
    })
    function clickModalWindow(event) {
        if (passwordInput) {
            showPassword([".show-password"], passwordInput, event);
        }
    }
    showModalWindow(document.body, [header, passwordBlock, checkPasswordBtn], 
    {className: "check-password-modal-window", handlers: [{eventName: "click", handler: clickModalWindow}]});
    
})

