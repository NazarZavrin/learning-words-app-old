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
        viewGroup(event);
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
        console.log(result);
        // console.log(Date.now());
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

function viewGroup(event){
    // console.log("viewGroup");
    let groupName = event.target.closest(".group")?.textContent;
    if (!groupName) {
        console.log("viewGroup() error: groupName is " + groupName);
    }
    // 
    fetch(location.href + '/groups/view', {
        method: 'SEARCH',
        body: groupName,
    })
    .then(response => {
        if (response.ok) {
            return response.text();
        } else {
            return new Error("Couldn't get group " + groupName);
        }
    })
    .then(result => {
        // console.log(result.slice(0, 50));
        if (result.includes("view-group")) {
            document.body.insertAdjacentHTML("afterbegin", result);
            showWords(groupName);
        } else if (result === "failure") {
            return new Error("Couldn't get group " + groupName);
        }
        else {
            return new Error(result);
        }
    })
    .catch(error => {
        alert(error);
        // if (error.message.includes("Couldn't get group")){
        //     alert(error.message);
        // }
    })
}
async function showWords(groupName) {
    let viewGroupBlock = document.body.querySelector("#view-group");
    let wordsSection = viewGroupBlock.querySelector(".words-section");
    // return;
    let response = await fetch(location.href + '/groups/get-words', {
        method: 'SEARCH',
        body: groupName,
    })
    let result = {};
    if (response.ok) {
        result = await response.json();
        console.log(result);
        if (typeof result.words === "string") {
            result.words = JSON.parse(result.words);
            console.log(result.words);
        }
    }
    if (!result.success) {
        result.message = String(result?.message || "Can not get words of group " + groupName);
        wordsSection.textContent = result.message;
        return;
    }
    // await new Promise((resolve, reject) => {
    //     setTimeout(() => resolve(1), 1000);// to see how the loading icon works
    // })
    wordsSection.classList.remove("loading");
    
    if (result.words.length === 0) {
        wordsSection.textContent = "Group doesn't contain any word.";
    } else {
        // console.log(result.words);
        result.words.sort((first, second) => { // mix elements in array
            let num = Math.round(Math.random() * 7) - 4;
            console.log(num);
            return num;
        })
        let clonedArray = result.words.concat();
        console.log(clonedArray);
        result.words.sort((first, second) => {
            return first.number - second.number;
        })
        console.log(result.words);

        for (let i = 0; i < result.words.length; i++) {
            wordsSection.append(new Word(result.words[i]));
        }
    }
    addHandlersToViewGroupBlock(groupName);
}
function addHandlersToViewGroupBlock(){
    let viewGroupBlock = document.body.querySelector("#view-group");
    let header = viewGroupBlock.querySelector("#view-group > header");
    let groupNameBlock = header.querySelector("section > .group-name");
    let wordsSection = viewGroupBlock.querySelector(".words-section");
    header.addEventListener("click", async event => {
        if (event.target.closest(".back")) {
            viewGroupBlock.remove();
            // ↓ if group info was changed or/and this group was added to / removed from "Favourite groups"
            // ↓ or was deleted, it must be displayed
            await updateGroups(true);
            await updateGroups();
        }
        if (event.target.closest(".new-word")) {
            let wordLabel = createElement({name: "header", content: "Enter new word:"},);
            let wordInput = createElement({name: "input"});
            wordInput.setAttribute("autocomplete", "off");
            let translationLabel = createElement({name: "header", content: "Enter the translation of new word:"},);
            let translationInput = createElement({name: "input"});
            translationInput.setAttribute("autocomplete", "off");
            let addNewWordBtn = createElement({content: "Add new word", class: "add-new-word-btn"});
            addNewWordBtn.addEventListener("click", async event => {
                createWarningAfterElement(addNewWordBtn);
                setWarning(addNewWordBtn.nextElementSibling, '');
                let everythingIsCorrect = true;
                if (wordInput.value.length == 0) {
                    createWarningAfterElement(wordInput);
                    setWarning(wordInput.nextElementSibling, "Please, enter new word.", "wordInput");
                    everythingIsCorrect = false;
                } else if (wordInput.value.length > 20) {
                    createWarningAfterElement(wordInput);
                    setWarning(wordInput.nextElementSibling, "Length of new word must not exceed 20 characters.", "wordInput");
                    everythingIsCorrect = false;
                } else {
                    setWarning(wordInput.nextElementSibling, "");
                }
                if (translationInput.value.length == 0) {
                    createWarningAfterElement(translationInput);
                    setWarning(translationInput.nextElementSibling, "Please, enter the translation of new word.", "translationInput");
                    everythingIsCorrect = false;
                } else if (translationInput.value.length > 20) {
                    createWarningAfterElement(translationInput);
                    setWarning(translationInput.nextElementSibling, "Length of translation must not exceed 20 characters.", "translationInput");
                    everythingIsCorrect = false;
                } else {
                    setWarning(translationInput.nextElementSibling, "");
                }
                if (everythingIsCorrect === false) {
                    return;
                }
                console.log(wordInput.value);
                let requestBody = {
                    groupName: groupNameBlock.textContent,
                    word: wordInput.value,
                    translation: translationInput.value,
                };
                // return;
                let response = await fetch(location.href + "/groups/add-word", {
                    method: "PUT",
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
                        let wordsSection = viewGroupBlock.querySelector(".words-section");
                        if (!wordsSection.querySelector(".word-element")) {// if there arent any words in the section...
                            wordsSection.innerHTML = "";// ...erase the message "Group doesn't contain any word."
                        }
                        wordsSection.append(new Word({...requestBody, number: result.number}));
                        return;
                    }
                }
                result.message = String(result?.message || "Creation error. Please try again.");
                createWarningAfterElement(addNewWordBtn);
                setWarning(addNewWordBtn.nextElementSibling, result.message, "addNewWordBtn");
                console.log(result?.message);
            })
            showModalWindow(document.body, [wordLabel, wordInput, translationLabel, translationInput, addNewWordBtn], 
                {className: "new-word-modal-window"});
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
        if (event.target.closest(".delete-word-btn")) {
            Word.deleteWord(groupNameBlock.textContent, event.target.closest(".word-element"));
        }
    })
}