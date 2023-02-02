"use strict";
import { setWarning, createWarningAfterElement, showModalWindow, createElement, showPassword} from "./useful.js";


export default class Group {
    constructor(params) {
        // group creation
    }
    static addWord(word, translation) {
        
    }
    static changeGroupName(groupNameBlock){
        // console.log("changeGroupName");
        let newGroupNameLabel = createElement({name: "header", content: "Enter new name of group:"},);
        let newGroupNameInput = createElement({name: "input"});
        newGroupNameInput.setAttribute("autocomplete", "off");
        newGroupNameInput.value = groupNameBlock.textContent;
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
                setWarning(newGroupNameInput.nextElementSibling, "Length of new name of group not exceed 20 characters.", "newNameInput");
                everythingIsCorrect = false;
            } else {
                setWarning(newGroupNameInput.nextElementSibling, "");
            }
            if (everythingIsCorrect === false) {
                return;
            }
            // console.log(newGroupNameInput.value);
            let requestBody = {
                newGroupName: newGroupNameInput.value,
            };
            // return;
            let response = await fetch(location.href + "/groups/change/name", {
                method: "PATCH",
                body: JSON.stringify(requestBody),
                headers: {
                    "Group-Name": groupNameBlock.textContent,
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
            result.message = String(result?.message || "Updating error. Please try again.");
            createWarningAfterElement(changeGroupNameBtn);
            setWarning(changeGroupNameBtn.nextElementSibling, result.message, "changeGroupNameBtn");
            console.log(result?.message);
        })
        showModalWindow(document.body, [newGroupNameLabel, newGroupNameInput, changeGroupNameBtn], 
            {className: "change-group-name-modal-window"});
    }
    static async changeGroupStatus(groupName, changeStatusBlock) {
        let response = await fetch(location.href + "/groups/change/status", {
            method: "PATCH",
            headers: {
                "Group-Name": groupName,
                'Content-Type': 'application/json',
            }
        })
        let result = {};
        if (response.ok) {
            result = await response.json();
            console.log(result);
            // console.log(Date.now());
            if (result.success) {
                let span = changeStatusBlock.querySelector("span");
                let image = changeStatusBlock.querySelector("img");
                if (result.groupIsFavoutite === true) {
                    span.textContent = "Add to favourites";
                    image.className = "";
                } else {
                    span.textContent = "Remove from favourites";
                    image.className = "crossed-out";
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
                body: JSON.stringify({password: passwordInput.value}),
                headers: {
                    "Group-Name": groupNameBlock.textContent,
                    'Content-Type': 'application/json'
                }
            })
            let result;
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
    }
}