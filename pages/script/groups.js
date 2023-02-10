"use strict";

import Group from "./class_Group.js";
import Word from "./class_Word.js";
import { setWarning, createWarningAfterElement, showModalWindow, createElement, } from "./useful.js";


const content = document.querySelector(".content");
const infoBtn = document.querySelector(".header__info-btn");
const infoSidebar = document.querySelector(".profile-info");


const favouriteGroupsContent = content.querySelector(".favourite-groups__groups");
const groupsContent = content.querySelector(".groups__groups");
favouriteGroupsContent.innerHTML = groupsContent.innerHTML = '<img src="/img/rounded-blocks.gif" class="loading">';
content.addEventListener("click", event => {
    if (!event.target.closest(".profile-info.active")) {
        infoBtn.classList.remove("active");
        infoSidebar.classList.remove("active");
    }
    if (event.target.closest(".new-group-btn")) {
        createNewGroup(event);
    }
    if (event.target.closest(".group")) {
        let groupName = event.target.closest(".group")?.textContent;
        Group.viewGroup(groupName, addHandlersToViewGroupBlock);
    }
})
function createNewGroup(event) {
    let header = createElement({name: "header", content: "Enter the name of new group:"},);
    let groupNameInput = createElement({name: "input"});
    groupNameInput.setAttribute("autocomplete", "off");
    let createNewGroupBtn = createElement({content: "Create new group", class: "create-new-group-btn"});
    let addingFavouriteGroup = Boolean(event.target.closest(".favourite-groups"));
    createNewGroupBtn.addEventListener("click", async event => {
        let everythingIsCorrect = true;
        if (groupNameInput.value.length == 0) {
            createWarningAfterElement(groupNameInput);
            setWarning(groupNameInput.nextElementSibling, "Please, enter the name of the group.", "groupNameInput");
            everythingIsCorrect = false;
        } else if (groupNameInput.value.length > 20) {
            createWarningAfterElement(groupNameInput);
            setWarning(groupNameInput.nextElementSibling, "Name of the group must not exceed 20 characters.", "groupNameInput");
            everythingIsCorrect = false;
        } else {
            setWarning(groupNameInput.nextElementSibling, "");
        }
        if (everythingIsCorrect === false) {
            return;
        }
        console.log(groupNameInput.value);
        // return;
        let requestUrl = location.href + "/groups";
        requestUrl += addingFavouriteGroup ? "/favourite-groups" : "";
        let response = await fetch(requestUrl, {
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
                await updateGroups(addingFavouriteGroup);
                return;
            }
        }
        result.message = String(result?.message || "Creation error. Please try again.");
        createWarningAfterElement(groupNameInput);
        setWarning(groupNameInput.nextElementSibling, result.message, "groupNameInput");
        console.log(result?.message);
    })
    showModalWindow(document.body, [header, groupNameInput, createNewGroupBtn], 
        {className: "new-group-modal-window"});
}

window.addEventListener("load", async event => {
    await updateGroups(true);
    await updateGroups();
})

async function updateGroups(updateFavouriteGroups = false) {
    let requestUrl = location.href + '/groups';
    requestUrl += updateFavouriteGroups ? "/favourite-groups" : "";
    let response = await fetch(requestUrl);
    let result = {};
    let groupsElement = updateFavouriteGroups ? favouriteGroupsContent : groupsContent;
    if (response.ok) {
        result = await response.json();
        // console.log(result);
        if (result.success && result.groups) {
            // await new Promise((resolve, reject) => {
            //     setTimeout(() => resolve(1), 1000);// to see how the loading icon works
            // })
            groupsElement.innerHTML = "";
            if (result.groups.length === 0) {
                let message = "No one ";
                message += updateFavouriteGroups ? "favourite " : "";
                groupsElement.textContent = message + "group was found.";
            } else {
                result.groups.forEach(group => {
                    let groupElement = createElement({content: String(group.name), class: 'group'});
                    groupsElement.append(groupElement);
                })
            }
            return;
        }
    }
    result.message = String(result?.message || "Can not get groups. Please try again.");
    groupsElement.textContent = result.message;
    console.log(result?.message);
}

function addHandlersToViewGroupBlock(){
    let viewGroupBlock = document.body.querySelector("#view-group");
    let header = viewGroupBlock.querySelector("#view-group > header");
    let groupNameBlock = header.querySelector("section > .group-name");
    let additionalSection = viewGroupBlock.querySelector(".additional-section");
    let wordsSection = viewGroupBlock.querySelector(".words-section");
    header.addEventListener("click", async event => {
        if (event.target.closest(".back")) {
            
            // ↓ if group info was changed or/and this group was added to / removed from "Favourite groups"
            // ↓ or was deleted, it must be displayed
            await updateGroups(true);
            await updateGroups();
            viewGroupBlock.remove();
        }
        if (event.target.closest(".new-word")) {
            Group.addWord(groupNameBlock.textContent, wordsSection);
        }
        if (event.target.closest(".change-group-name") || event.target.closest(".group-name")) {
            Group.changeGroupName(groupNameBlock);
        }
        if (event.target.closest(".change-status")) {
            await Group.changeGroupStatus(groupNameBlock.textContent, event.target.closest(".change-status"));
        }
        if (event.target.closest(".delete-group")) {
            Group.deleteGroup(groupNameBlock);
        }
    })
    wordsSection.addEventListener("click", event => {
        if (event.target.closest(".edit-word-btn")) {
            Word.changeWord(groupNameBlock.textContent, event.target.closest(".word-container"));
        } else if (event.target.closest(".delete-word-btn")) {
            Word.deleteWord(groupNameBlock.textContent, event.target.closest(".word-container"));
        } else if (event.target.closest(".select-this-word")) {
            event.target.closest(".word-container").classList.toggle("selected-word");
            if (wordsSection.getElementsByClassName("selected-word").length > 0) {
                additionalSection.classList.add("active");
            } else {
                additionalSection.classList.remove("active");
            }
        }
    })
    wordsSection.addEventListener("mousedown", event => {
        // let time = Date.now();
        if (event.target.closest(".word-container")) {
            let timeoutID = setTimeout(() => {
                event.target.closest(".word-container").getElementsByClassName("select-this-word")?.[0]?.click();
            }, 750);
            event.target.closest(".word-container").onmouseup = event.target.closest(".word-container").onmouseleave = function (event) {
                // console.log(this.onmouseup && typeof this.onmouseup, this.onmouseleave && typeof this.onmouseleave);
                clearTimeout(timeoutID);
                this.onmouseup = null;
                this.onmouseleave = null;
                // console.log(this.onmouseup && typeof this.onmouseup, this.onmouseleave && typeof this.onmouseleave);
            }
        }
    })
    wordsSection.addEventListener("focusin", event => {
        if (event.target.closest(".words-number")) {
            let oldNumber = event.target.textContent;
            // console.log(oldNumber);
            event.target.addEventListener("focusout", async event => {
                let message = await Word.changeNumber(groupNameBlock.textContent, event.target, oldNumber);
                if (message?.includes("Number was changed")) {
                    await Group.showWords(groupNameBlock.textContent);
                    // console.log("showed");
                }
            }, {once: true});
        }
    })
}