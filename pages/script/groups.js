"use strict";

import { setWarning, createWarningAfterElement, showModalWindow, createElement, showPassword, } from "./useful.js";

const content = document.querySelector(".content");
const infoBtn = document.querySelector(".header__info-btn");
const infoSidebar = document.querySelector(".profile-info");


const favouriteGroupsContent = content.querySelector(".favourite-groups__groups");
favouriteGroupsContent.innerHTML = '<img src="/img/rounded-blocks.gif" class="loading">';
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
        let everythingIsCorrect = true;
        if (groupNameInput.value.length == 0) {
            createWarningAfterElement(groupNameInput);
            setWarning(groupNameInput.nextElementSibling, "Please, enter the name of the group.", "groupNameInput");
            everythingIsCorrect = false;
        } else if (groupNameInput.value.length > 20) {
            createWarningAfterElement(groupNameInput);
            setWarning(groupNameInput.nextElementSibling, "Name of the group must not exceed 50 characters.", "groupNameInput");
            everythingIsCorrect = false;
        } else {
            setWarning(groupNameInput.nextElementSibling, "");
        }
        if (everythingIsCorrect === false) {
            return;
        }
        console.log(groupNameInput.value);
        // return;
        let response = await fetch(location.href + "/groups/favourite-groups", {
            method: "POST",
            body: groupNameInput.value,
        })
        let result = {};
        if (response.ok) {
            result = await response.json();
            console.log(result);
            // console.log(Date.now());
            if (result.success) {
                event.target.closest(".modal-window").closeWindow();
                await updateFavouriteGroups();
                return;
            }
        }
        result.message = String(result?.message || "Creation error. Please try again.");
        createWarningAfterElement(groupNameInput);
        setWarning(groupNameInput.nextElementSibling, result.message, "groupNameInput");
        console.log(result?.message);
    })
    showModalWindow(document.body, [header, groupNameInput, createNewFavouriteGroupBtn], 
        {className: "new-favourite-group-modal-window", handlers: [{eventName: "click"}]});
}


window.addEventListener("load", async event => {
    await updateFavouriteGroups();
})

async function updateFavouriteGroups() {
    let response = await fetch(location.href + "/groups/favourite-groups");
    let result = {};
    if (response.ok) {
        result = await response.json();
        console.log(result);
        // console.log(Date.now());
        if (result.success && result.groups) {
            // await new Promise((resolve, reject) => {
            //     setTimeout(() => resolve(1), 1000);// to see a job of loading icon
            // })
            favouriteGroupsContent.innerHTML = "";
            if (result.groups.length === 0) {
                favouriteGroupsContent.textContent = "No one favourite group was found.";
            } else {
                result.groups.forEach(group => {
                    let groupElement = createElement({content: String(group.name), class: 'group'});
                    favouriteGroupsContent.append(groupElement);
                })
            }
            return;
        }
    }
    result.message = String(result?.message || "Can not get groups. Please try again.");
    favouriteGroupsContent.textContent = result.message;
    console.log(result?.message);
}