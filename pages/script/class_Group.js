"use strict";
import { setWarning, createWarningAfterElement, showModalWindow, createElement, showPassword} from "./useful.js";

export default class Group {
    constructor(params) {
        // group creation
    }
    static addWord(word, translation) {
        // new Word();
    }
    static changeGroupName(groupNameBlock){
        // console.log("changeGroupName");
        let newGroupNameLabel = createElement({name: "header", content: "Enter new name of group:"},);
        let newGroupNameInput = createElement({name: "input"});
        newGroupNameInput.setAttribute("autocomplete", "off");
        newGroupNameInput.value = groupNameBlock.textContent;
        let passwordLabel = createElement({name: "header", content: "To verify personality enter your password:"},);
        let passwordInput = createElement({name: "input"});
        passwordInput.setAttribute("type", "password");
        passwordInput.setAttribute("autocomplete", "off");
        let passwordBlock = createElement({name: "form", class: "password-block"});
        passwordBlock.innerHTML = `<div class="show-password">
        <input type="checkbox">Show password</div>`;
        passwordBlock.prepend(passwordInput);
        let changeGroupNameBtn = createElement({content: "Change name of group", class: "change-group-name-btn"});
        changeGroupNameBtn.addEventListener("click", async event => {
            createWarningAfterElement(changeGroupNameBtn);
            setWarning(changeGroupNameBtn.nextElementSibling, '');
            let everythingIsCorrect = true;
            if (newGroupNameInput.value.length == 0) {
                createWarningAfterElement(newGroupNameInput);
                setWarning(newGroupNameInput.nextElementSibling, "Please, enter new name of group.", "newGroupNameInput");
                everythingIsCorrect = false;
            } else if (newGroupNameInput.value.length > 20) {
                createWarningAfterElement(newGroupNameInput);
                setWarning(newGroupNameInput.nextElementSibling, "Length of new name must not exceed 20 characters.", "newNameInput");
                everythingIsCorrect = false;
            } else if (newGroupNameInput.value === groupNameBlock.textContent) {
                createWarningAfterElement(newGroupNameInput);
                setWarning(newGroupNameInput.nextElementSibling, "Old and new name of group coincide.", "newNameInput");
                everythingIsCorrect = false;
            } else {
                setWarning(newGroupNameInput.nextElementSibling, "");
            }
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
            // console.log(newGroupNameInput.value);
            let requestBody = {
                oldGroupName: groupNameBlock.textContent,
                newGroupName: newGroupNameInput.value,
                password: passwordInput.value,
            };
            // return;
            let response = await fetch(location.href + "/groups/change/name", {
                method: "PATCH",
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            let result = {};
            if (response.ok) {
                result = await response.json();
                console.log(result);
                // console.log(Date.now());
                if (result.success) {
                    event.target.closest(".modal-window").closeWindow();
                    groupNameBlock.textContent = result.newGroupName;
                    return;
                }
            }
            if (result?.message?.includes("Password don't match")) {
                createWarningAfterElement(passwordInput);
                setWarning(passwordInput.nextElementSibling, result.message, "passwordInput");
                return;
            }
            result.message = String(result?.message || "Updating error. Please try again.");
            createWarningAfterElement(changeGroupNameBtn);
            setWarning(changeGroupNameBtn.nextElementSibling, result.message, "changeGroupNameBtn");
            console.log(result?.message);
        })
        function clickModalWindow(event) {
            if (passwordInput) {
                showPassword([".show-password"], passwordInput, event);
            }
        }
        showModalWindow(document.body, [newGroupNameLabel, newGroupNameInput, passwordLabel, passwordBlock, changeGroupNameBtn], 
            {className: "change-group-name-modal-window", handlers: [{eventName: "click", handler: clickModalWindow}]});
    }
    static async changeGroupStatus(groupName, changeStatusBlock) {
        let response = await fetch(location.href + "/groups/change/status", {
            method: "PATCH",
            body: groupName,
        })
        let result = {};
        if (response.ok) {
            result = await response.json();
            console.log(result);
            // console.log(Date.now());
            if (result.success) {
                let span = changeStatusBlock.querySelector("span");
                let starIcon = changeStatusBlock.querySelector("div.star-icon");
                if (result.groupIsFavoutite === true) {
                    span.textContent = "Remove from favourites";
                    starIcon.classList.add("crossed-out");
                } else {
                    span.textContent = "Add to favourites";
                    starIcon.classList.remove("crossed-out");
                }
                return;
            }
        }
        result.message = String(result?.message || "Updating error. Please try again.");
        alert(result?.message);
    }
    static deleteGroup(groupNameBlock){
        let header = createElement({name: "header", content: "To verify personality enter your password:"},);
        let passwordInput = createElement({name: "input"});
        passwordInput.setAttribute("type", "password");
        passwordInput.setAttribute("autocomplete", "off");
        let passwordBlock = createElement({name: "form", class: "password-block"});
        passwordBlock.innerHTML = `<div class="show-password">
        <input type="checkbox">Show password</div>`;
        passwordBlock.prepend(passwordInput);
        let checkPasswordBtn = createElement({content: "Delete group", class: "check-password-btn"});
        checkPasswordBtn.addEventListener("click", async event => {
            createWarningAfterElement(checkPasswordBtn);
            setWarning(checkPasswordBtn.nextElementSibling, '');
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
            let response = await fetch(location.href + "/groups/delete", {
                method: "DELETE",
                body: JSON.stringify({
                    groupName: groupNameBlock.textContent,
                    password: passwordInput.value
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            let result = {};
            if (response.ok) {
                result = await response.json();
                console.log(result);
                if (result.success) {
                    event.target.closest(".modal-window").closeWindow();
                    // console.log(groupNameBlock);
                    // console.log(groupNameBlock.parentElement);
                    let backBtn = groupNameBlock.parentElement.querySelector(".back");
                    // console.log(backBtn);
                    backBtn.click();
                    return;
                }
            }
            if (result?.message?.includes("Password don't match")) {
                createWarningAfterElement(passwordInput);
                setWarning(passwordInput.nextElementSibling, result.message, "passwordInput");
                return;
            }
            result.message = String(result?.message || "Deletion error. Please try again.");
            createWarningAfterElement(checkPasswordBtn);
            setWarning(checkPasswordBtn.nextElementSibling, result.message, "checkPasswordBtn");
            console.log(result?.message);
        })
        function clickModalWindow(event) {
            if (passwordInput) {
                showPassword([".show-password"], passwordInput, event);
            }
        }
        showModalWindow(document.body, [header, passwordBlock, checkPasswordBtn], 
        {className: "check-password-modal-window", handlers: [{eventName: "click", handler: clickModalWindow}]});
    }
}