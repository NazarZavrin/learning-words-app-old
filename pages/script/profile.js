"use strict";
console.log(HTMLElement.prototype);
console.log("add posibitity to delete account");
console.log("change password, enter password to change infoPart");

import { setWarning, userNameIsCorrect, emailIsCorrect, userIdIsCorrect, } from "./useful.js";

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
            console.log("Old and new values coincide.");
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
                // remove json stringify in the end 
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