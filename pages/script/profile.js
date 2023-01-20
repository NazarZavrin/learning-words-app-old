"use strict";
console.log(HTMLElement.prototype);
console.log("add posibitity to delete account");
console.log("change password, enter password to change infoPart");
console.log("add modals");

import { setWarning, userNameIsCorrect, emailIsCorrect, userIdIsCorrect, showModalWindow, createElement, } from "./useful.js";

const infoBtn = document.querySelector(".header__info-btn");
const profileLabel = document.querySelector(".header__profile-label");
const infoSidebar = document.querySelector(".profile-info");
infoBtn.classList.add("active");// when page loads remove
infoSidebar.classList.add("active");// when page loads remove
infoBtn.addEventListener("click", event => {
    infoBtn.classList.toggle("active");
    infoSidebar.classList.toggle("active");
})
profileLabel.addEventListener("click", event => {
    event.preventDefault();
    infoBtn.click();
})
infoSidebar.addEventListener("click", async event => {
    if (event.target.closest(".edit-btn")) {
        if (event.target.closest(".edit-btn")?.previousElementSibling?.textContent?.includes("password")) {
            changePassword(event);
            return;
        }
        let editBlock = event.target.closest(".edit-btn").parentElement.nextElementSibling;
        editBlock.classList.toggle("hide");
        if (!editBlock.classList.contains("hide")) {
            let currentValue = editBlock.previousElementSibling.children[0].textContent;
            let input = editBlock.querySelector("input");
            input.value = currentValue;
            setWarning(editBlock.lastElementChild, "");
        }
        
    } else if (event.target.closest(".save-btn")){
        let editBlock = event.target.closest(".edit-block");
        let infoPart = editBlock.previousElementSibling.className.split(" ").shift();
        let infoPartInput = event.target.closest(".save-btn").previousElementSibling;
        let newValue = infoPartInput.value;
        let currentValue = editBlock.previousElementSibling.children[0].textContent;
        if (newValue === currentValue) {
            alert("Old and new values coincide.");
            return;
        }
        if (infoPartIsCorrect(infoPart, infoPartInput) === false) {
            return;
        }
        editBlock.classList.add("hide");
        infoPartInput.value = "";
        let response = await fetch(location.href + "/change/" + infoPart, {
            method: "PATCH",
            body: newValue,
        })
        let result = "Update error. Please try again.";
        if (response.ok) {
            result = await response.json();
            console.log(result);
            if (result.success) {
                event.target.closest(".edit-block").previousElementSibling.children[0].textContent = result.newValue;
                return;
            }
        }
        console.log(result.message || result);
        alert(result.message || result);
    } else if (event.target.closest(".cancel-btn")){
        let editBlock = event.target.closest(".edit-block");
        editBlock.classList.add("hide");
        setWarning(editBlock.lastElementChild, "");
    }

})
const logOutBtn = document.getElementById("log-out-btn");
logOutBtn.addEventListener("click", event => {
    // fetch register log out
    location.href = "/";
})

function infoPartIsCorrect(infoPart, infoPartInput){
    if (infoPart === "username") {
        return userNameIsCorrect(infoPartInput, infoPartInput.parentElement);
    } else if (infoPart === "userId"){
        return userIdIsCorrect(infoPartInput, infoPartInput.parentElement);
    } else if (infoPart === "email") {
        return emailIsCorrect(infoPartInput, infoPartInput.parentElement);
    }
}
function changePassword(event){
    let header = createElement({name: "header", content: "Changing password"},);
    let oldPasswordLabel = createElement({name: "label", content: "Enter old password:"},);
    let oldPasswordInput = createElement({name: "input"});
    oldPasswordInput.setAttribute("type", "password");
    let oldPasswordBlock = createElement({name: "form", class: "old-password-block"});
    oldPasswordBlock.innerHTML = `<div class="show-old-password">
    <input type="checkbox">Show old password</div>`;
    oldPasswordBlock.prepend(oldPasswordInput);
    let newPasswordLabel = createElement({name: "label", content: "Enter new password:"},);
    let newPasswordInput = createElement({name: "input"});
    newPasswordInput.setAttribute("type", "password");
    let newPasswordBlock = createElement({name: "form", class: "new-password-block"});
    newPasswordBlock.innerHTML = `<div class="show-new-password">
    <input type="checkbox">Show new password</div>`;
    newPasswordBlock.prepend(newPasswordInput);
    let changePasswordBtnStyles = `
    background-color: dodgerblue; color: white;
    border-radius: 3px;
    padding: 0 3px;`;
    let changePasswordBtn = createElement({content: "Change password", style: changePasswordBtnStyles});
    showModalWindow(document.body, 
        [header, oldPasswordLabel, oldPasswordBlock, newPasswordLabel, newPasswordBlock, changePasswordBtn], 
    changePasswordBtn, {className: "change-password-modal-window"});
}
