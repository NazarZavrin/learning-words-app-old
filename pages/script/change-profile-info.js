"use strict";

import { setWarning, createWarningAfterElement, userNameIsCorrect, emailIsCorrect, userIdIsCorrect, showModalWindow, createElement, showPassword, } from "./useful.js";

const infoSidebar = document.querySelector(".profile-info");

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
        let result;
        if (response.ok) {
            result = await response.json();
            console.log(result);
            if (result.success) {
                event.target.closest(".edit-block").previousElementSibling.children[0].textContent = result.newValue;
                return;
            }
        }
        console.log(result?.message || "Update error. Please try again.");
        alert(result?.message || "Update error. Please try again.");
    } else if (event.target.closest(".cancel-btn")){
        let editBlock = event.target.closest(".edit-block");
        editBlock.classList.add("hide");
        setWarning(editBlock.lastElementChild, "");
    }

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
    oldPasswordInput.setAttribute("autocomplete", "off");
    let oldPasswordBlock = createElement({name: "form", class: "old-password-block"});
    oldPasswordBlock.innerHTML = `<div class="show-old-password">
    <input type="checkbox">Show old password</div>`;
    oldPasswordBlock.prepend(oldPasswordInput);
    let newPasswordLabel = createElement({name: "label", content: "Enter new password:"},);
    let newPasswordInput = createElement({name: "input"});
    newPasswordInput.setAttribute("type", "password");
    newPasswordInput.setAttribute("autocomplete", "off");
    let newPasswordBlock = createElement({name: "form", class: "new-password-block"});
    newPasswordBlock.innerHTML = `<div class="show-new-password">
    <input type="checkbox" autocomplete="off">Show new password</div>`;
    newPasswordBlock.prepend(newPasswordInput);
    let changePasswordBtnStyles = `
    background-color: dodgerblue; color: white;
    border-radius: 3px;
    padding: 3px;`;
    let changePasswordBtn = createElement({content: "Change password", style: changePasswordBtnStyles});
    changePasswordBtn.addEventListener("click", async event => {
        let everythingIsCorrect = true;
        
        if (oldPasswordInput.value.length < 4) {
            createWarningAfterElement(oldPasswordInput);
            setWarning(oldPasswordInput.nextElementSibling, "Old password must not be less than 4 characters.", "oldPasswordInput");
            everythingIsCorrect = false;
        } else {
            setWarning(oldPasswordInput.nextElementSibling, "");
        }
        if (newPasswordInput.value.length < 4) {
            createWarningAfterElement(newPasswordInput);
            setWarning(newPasswordInput.nextElementSibling, "New password must not be less than 4 characters.", "newPasswordInput");
            everythingIsCorrect = false;
        } else {
            setWarning(newPasswordInput.nextElementSibling, "");
        }
        if (everythingIsCorrect === false) {
            return;
        }
        let requestBody = {
            oldPassword: oldPasswordInput.value,
            newPassword: newPasswordInput.value
        }
        console.log(requestBody);
        let response = await fetch(location.href + "/change/password", {
            method: "PATCH",
            body: JSON.stringify(requestBody),
        })
        let result;
        if (response.ok) {
            result = await response.json();
            console.log(result);
            if (result.success) {
                event.target.closest(".modal-window").closeWindow();
                return;
            }
        }
        if (result.message.includes("password don't match")) {
            createWarningAfterElement(oldPasswordInput);
            setWarning(oldPasswordInput.nextElementSibling, result.message, "oldPasswordInput");
            return;
        }
        console.log(result?.message || "Update error. Please try again.");
        alert(result?.message || "Update error. Please try again.");
    })
    function clickModalWindow(event){
        if (oldPasswordInput) {
            showPassword([".show-old-password"], oldPasswordInput, event);
        }
        if (newPasswordInput) {
            showPassword([".show-new-password"], newPasswordInput, event);
        }        
    }
    showModalWindow(document.body, 
        [header, oldPasswordLabel, oldPasswordBlock, newPasswordLabel, newPasswordBlock, changePasswordBtn], 
    {className: "change-password-modal-window", handlers: [{eventName: "click", handler: clickModalWindow}]});

}