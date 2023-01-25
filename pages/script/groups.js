"use strict";

import { setWarning, createWarningAfterElement, showModalWindow, createElement, showPassword, } from "./useful.js";

const content = document.querySelector(".content");
const infoBtn = document.querySelector(".header__info-btn");
const infoSidebar = document.querySelector(".profile-info");



content.addEventListener("click", event => {
    if (!event.target.closest(".profile-info.active")) {
        infoBtn.classList.remove("active");
        infoSidebar.classList.remove("active");
    }
    if (event.target.closest(".favourite-groups .new-group-btn")) {
        createNewFavouriteGroup(event);
    }
})
function createNewFavouriteGroup(event) {
    let header = createElement({name: "header", content: "Enter the name of new group:"},);
    let groupNameInput = createElement({name: "input"});
    groupNameInput.setAttribute("autocomplete", "off");
    let createNewFavouriteGroupBtn = createElement({content: "OK", class: "new-favourite-group-btn"});
    createNewFavouriteGroupBtn.addEventListener("click", async event => {
        // let everythingIsCorrect = true;
        if (groupNameInput.value.length == 0) {
            createWarningAfterElement(groupNameInput);
            setWarning(groupNameInput.nextElementSibling, "Please, enter the name of the group.", "groupNameInput");
            return;
            // everythingIsCorrect = false;
        } else {
            setWarning(groupNameInput.nextElementSibling, "");
        }
        // if (everythingIsCorrect === false) {
        //     return;
        // }
        console.log(groupNameInput.value);
        // return;
        let response = await fetch(location.href + "/favoutite-group", {
            method: "POST",
            body: groupNameInput.value,
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
        if (result.message.includes("already exists")) {
            createWarningAfterElement(groupNameInput);
            setWarning(groupNameInput.nextElementSibling, result.message, "groupNameInput");
            return;
        }
        console.log(result?.message || "Creation error. Please try again.");
        alert(result?.message || "Creation error. Please try again.");
    })
    showModalWindow(document.body, [header, groupNameInput, createNewFavouriteGroupBtn], 
        {className: "new-favourite-group-modal-window", handlers: [{eventName: "click"}]});
}

