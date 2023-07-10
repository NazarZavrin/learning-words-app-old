"use strict";

import Group, { sortWords } from "./class_Group.js";
import Word from "./class_Word.js";
import { setWarning, createWarningAfterElement, showModalWindow, createElement, normalizeUrl, } from "./useful.js";


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
        new Group(Boolean(event.target.closest(".favourite-groups")), updateGroups);
    }
    if (event.target.closest(".group")) {
        let groupName = event.target.closest(".group")?.textContent;
        Group.viewGroup(groupName, addHandlersToViewGroupBlock);
    }
})

window.addEventListener("load", async event => {
    await updateGroups(true);
    await updateGroups();
})

async function updateGroups(updateFavouriteGroups = false) {
    let requestUrl = normalizeUrl(location.href) + '/groups';
    requestUrl += updateFavouriteGroups ? "/favourite-groups" : "";
    let groupsParent = updateFavouriteGroups ? favouriteGroupsContent : groupsContent;
    let response = {}, result = {};
    try {
        response = await fetch(requestUrl);
        if (response.ok) {
            result = await response.json();
            // console.log(result);
            if (result.success && result.groups) {
                // await new Promise((resolve, reject) => {
                //     setTimeout(() => resolve(1), 1000);// to see how the loading icon works
                // })
                groupsParent.innerHTML = "";
                if (result.groups.length === 0) {
                    let message = "No one ";
                    message += updateFavouriteGroups ? "favourite " : "";
                    groupsParent.textContent = message + "group was found.";
                } else {
                    result.groups.forEach(group => {
                        let groupContainer = createElement({ content: String(group.name), class: 'group' });
                        groupsParent.append(groupContainer);
                    })
                }
                return;
            }
        }
    } catch (error) {
        console.error(error);
    }
    result.message = String(result?.message || "Can not get groups. Please try again.");
    groupsParent.textContent = result.message;
    console.log(result?.message);
}

function addHandlersToViewGroupBlock() {
    let viewGroupBlock = document.body.querySelector("#view-group");
    let header = viewGroupBlock.querySelector("#view-group > header");
    let groupNameBlock = header.querySelector("section > .group-name");
    let changeSortOrderBtn = header.querySelector(".change-sort-order");
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
            Group.addWord(groupNameBlock.textContent, wordsSection, changeSortOrderBtn);
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
        if (event.target.closest(".change-sort-order")) {
            Group.changeSortOrder(groupNameBlock.textContent, wordsSection, changeSortOrderBtn);
        }
        if (event.target.closest(".search-words-btn")) {
            Group.searchWords(wordsSection, event.target.closest(".search-words-btn"));
        }
    })
    additionalSection.addEventListener("click", event => {
        if (event.target.closest(".selection")) {
            Group.changeSelection(wordsSection, event.target.closest(".selection"));
        } else if (event.target.closest(".change-display")) {
            Group.changeDisplayOfSelectedWords(groupNameBlock.textContent, wordsSection, event.target.closest(".change-display"));
        } else if (event.target.closest(".copy-words-to-another-group")) {
            Group.copyWordsToAnotherGroup(wordsSection, content);
        } else if (event.target.closest(".training")) {
            alert("Coming soon...");
        } else if (event.target.closest(".delete-words")) {
            Group.deleteManyWords(groupNameBlock.textContent, wordsSection);
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
                if (wordsSection.querySelector(".word-container:not(.selected-word)")) {
                    additionalSection.querySelector(".selection > span").textContent = "Select all";
                } else {
                    additionalSection.querySelector(".selection > span").textContent = "Deselect all";
                }
            } else {
                additionalSection.classList.remove("active");
            }
        }
    })
    wordsSection.addEventListener("pointerdown", event => {
        // let time = Date.now();
        if (event.target.closest(".word-container")) {
            let timeoutID = setTimeout(() => {
                event.target.closest(".word-container").getElementsByClassName("select-this-word")?.[0]?.click();
            }, 750);
            event.target.closest(".word-container").onpointerup = event.target.closest(".word-container").onpointerleave = function (event) {
                // console.log(this.onpointerup && typeof this.onpointerup, this.onpointerleave && typeof this.onpointerleave);
                clearTimeout(timeoutID);
                this.onpointerup = null;
                this.onpointerleave = null;
                // console.log(this.onpointerup && typeof this.onpointerup, this.onpointerleave && typeof this.onpointerleave);
            }
        }
    })
    wordsSection.addEventListener("focusin", event => {
        if (event.target.closest(".words-number")) {
            let oldNumber = event.target.textContent;
            // console.log(oldNumber);
            event.target.closest(".words-number").addEventListener("focusout", async event => {
                let message = await Word.changeNumber(groupNameBlock.textContent, event.target.closest(".words-number"), oldNumber);
                if (message?.includes("Number was changed")) {
                    // await Group.showWords(groupNameBlock.textContent, viewGroupBlock);
                    /* ↑ if you use that, then all words will be displayed, even those, 
                    which do not match the search string */
                    let wordContainers = [...wordsSection.getElementsByClassName("word-container")];
                    sortWords(wordContainers, changeSortOrderBtn.dataset?.currentSortOrder);
                    wordsSection.innerHTML = "";
                    for (let i = 0; i < wordContainers.length; i++) {
                        wordsSection.append(wordContainers[i]);
                    }
                    // console.log("showed");
                }
            }, { once: true });
        }
    })
}