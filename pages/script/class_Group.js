"use strict";
import Word from "./class_Word.js";
import { setWarning, createWarningAfterElement, showModalWindow, createElement, showPassword, normalizeUrl} from "./useful.js";
export default class Group {
    constructor(addingFavouriteGroup = false, updateGroupsFunc) {
        let header = createElement({name: "header", content: "Enter the name of new group:"},);
        let groupNameInput = createElement({name: "input"});
        groupNameInput.setAttribute("autocomplete", "off");
        let createNewGroupBtn = createElement({content: "Create new group", class: "create-new-group-btn"});
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
            let requestUrl = normalizeUrl(location.href) + "/groups";
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
                    await updateGroupsFunc(addingFavouriteGroup);
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
    static viewGroup(groupName, ...synchronousCallbacks){
        if (!groupName) {
            console.log("viewGroup() error: groupName is " + groupName);
        }
        fetch(normalizeUrl(location.href) + '/groups/view', {
            method: 'PROPFIND',
            body: groupName,
        })
        .then(response => {
            if (response.ok) {
                return response.text();
            } else {
                throw new Error("Couldn't get group " + groupName);
            }
        })
        .then(result => {
            // console.log(result.slice(0, 50));
            if (result.includes("view-group")) {
                document.body.insertAdjacentHTML("afterbegin", result);
                let viewGroupBlock = document.body.querySelector("#view-group");
                let styles = viewGroupBlock.querySelector('link[href*="view-group.css"]');
                styles?.addEventListener("load", event => {
                    viewGroupBlock.classList.remove("hide");
                }, {once: true});
                return Group.showWords(groupName, viewGroupBlock);
                // addHandlersToViewGroupBlock(groupName);
            } else if (result === "failure") {
                throw new Error("Couldn't get group " + groupName);
            }
            else {
                throw new Error(result);
            }
        })
        .catch(error => {
            alert(error);
        })
        .finally(() => {
            for (const callback of synchronousCallbacks) {
                callback(groupName);
            }
        })
    }
    static async showWords(groupName, viewGroupBlock) {
        let wordsSection = viewGroupBlock.querySelector(".words-section");
        wordsSection.classList.add("loading");
        // return;
        let response = await fetch(normalizeUrl(location.href) + '/groups/get-words', {
            method: 'PROPFIND',
            body: groupName,
        })
        let result = {};
        if (response.ok) {
            result = await response.json();
            // console.log(result);
            if (typeof result.words === "string") {
                result.words = JSON.parse(result.words);
                // console.log(result.words);
            }
        }
        viewGroupBlock.classList.remove("hide");
        // ↑ if styles.addEventListener("load", event => {...}) didn't remove this class for some reason
        
        if (!result.success) {
            result.message = String(result?.message || "Can not get words of group " + groupName);
            wordsSection.textContent = result.message;
            wordsSection.classList.remove("loading");
            return;
        }
        // await new Promise((resolve, reject) => {
        //     setTimeout(() => resolve(1), 1000);// to see how the loading icon works
        // })
        
        
        if (result.words.length === 0) {
            wordsSection.textContent = "Group doesn't contain any word.";
        } else {
            result.words = result.words.map(wordInfo => {
                let wordContainer = new Word(wordInfo);
                if (wordInfo.hideTranslation) {
                    wordContainer.classList.add("hide-translation");
                } else if (wordInfo.hideWord) {
                    wordContainer.classList.add("hide-word");
                }
                return wordContainer;
            })
            // console.log(result);
            // renderSortedWords
            sortWords(result.words, result.sortOrder);
            wordsSection.innerHTML = "";
            for (let i = 0; i < result.words.length; i++) {
                wordsSection.append(result.words[i]);
            }
            let changeSortOrderBtn = viewGroupBlock.querySelector(".change-sort-order");
            if (result.sortOrder && changeSortOrderBtn) {
                changeSortOrderBtn.dataset.currentSortOrder = result.sortOrder;
            }
        }
        wordsSection.classList.remove("loading");
    }
    static addWord(groupName, wordsSection, changeSortOrderBtn) {
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
                groupName,// groupName: groupName,
                word: wordInput.value,
                translation: translationInput.value,
            };
            // return;
            let response = await fetch(normalizeUrl(location.href) + "/groups/add-word", {
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
                if (result.success) {
                    event.target.closest(".modal-window").closeWindow();
                    if (!wordsSection.querySelector(".word-container")) {// if there arent any words in the section...
                        wordsSection.innerHTML = "";// ...erase the message "Group doesn't contain any word."
                    }
                    let wordContainers = [...wordsSection.getElementsByClassName("word-container")];
                    wordContainers.push(new Word({...requestBody, number: result.number}));
                    // console.log(wordContainers.slice(-3));
                    sortWords(wordContainers, changeSortOrderBtn.dataset?.currentSortOrder);
                    // renderSortedWords
                    wordsSection.innerHTML = "";
                    for (let i = 0; i < wordContainers.length; i++) {
                        wordsSection.append(wordContainers[i]);
                    }
                    
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
            let response = await fetch(normalizeUrl(location.href) + "/groups/change/name", {
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
    static async changeGroupStatus(groupName, changeStatusBtn) {
        let response = await fetch(normalizeUrl(location.href) + "/groups/change/status", {
            method: "PATCH",
            body: groupName,
        })
        let result = {};
        if (response.ok) {
            result = await response.json();
            console.log(result);
            // console.log(Date.now());
            if (result.success) {
                let span = changeStatusBtn.querySelector("span");
                let starIcon = changeStatusBtn.querySelector("div.star-icon");
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
    static changeSortOrder(groupName, wordsSection, changeSortOrderBtn) {
        let header = createElement({name: "header", content: "Choose sort order:"},);
        let numericAscending = createElement({class: "1-9 selected"});
        numericAscending.innerHTML = '<div class="sorting-icon"></div><span>Numeric ascending sort order</span>';
        let numericDescending = createElement({class: "9-1"});
        numericDescending.innerHTML = '<div class="sorting-icon"></div><span>Numeric descending sort order</span>';
        let alphabeticAscending = createElement({class: "a-z"});
        alphabeticAscending.innerHTML = '<div class="sorting-icon"></div><span>Alphabetic ascending sort order</span>';
        let alphabeticDescending = createElement({class: "z-a"});
        alphabeticDescending.innerHTML = '<div class="sorting-icon"></div><span>Alphabetic descending sort order</span>';
        let sortOrderBlocks = createElement({class: "sort-order-blocks"});
        sortOrderBlocks.append(numericAscending);
        sortOrderBlocks.append(numericDescending);
        sortOrderBlocks.append(alphabeticAscending);
        sortOrderBlocks.append(alphabeticDescending);
        for (const sortOrderBlock of sortOrderBlocks.children) {
            sortOrderBlock.classList.add("sort-order-block");
            if (sortOrderBlock.classList.contains(changeSortOrderBtn.dataset?.currentSortOrder)) {
                numericAscending.classList.remove("selected");
                sortOrderBlock.classList.add("selected");
            }
        }
        sortOrderBlocks.addEventListener('click', event => {
            let sortOrderBlock = event.target.closest(".sort-order-block");
            if (!sortOrderBlock) {
                return;
            }
            sortOrderBlocks.querySelector(".selected")?.classList?.remove("selected");
            sortOrderBlock.classList.add("selected");
        })
        let confirmChangeOfSortOrderBtn = createElement({content: "Change sort order", class: "change-sort-order-btn"});
        confirmChangeOfSortOrderBtn.addEventListener("click", event => {
            let selectedSortOrderBlock = sortOrderBlocks.querySelector(".selected");
            let selectedSortOrder = selectedSortOrderBlock?.className?.split(" ")?.find(value => value.length === 3 && value[1] === "-");
            if (!selectedSortOrder || selectedSortOrder === changeSortOrderBtn.dataset?.currentSortOrder) {
                event.target.closest(".modal-window").closeWindow();
                return;
            }
            let wordContainers = [...wordsSection.getElementsByClassName("word-container")];
        
            sortWords(wordContainers, selectedSortOrder);
            // renderSortedWords
            wordsSection.innerHTML = "";
            for (let i = 0; i < wordContainers.length; i++) {
                wordsSection.append(wordContainers[i]);
            }
            changeSortOrderBtn.dataset.currentSortOrder = selectedSortOrder;
            event.target.closest(".modal-window").closeWindow();
            let requestBody = {
                groupName,// groupName: groupName,
                sortOrder: selectedSortOrder,
            };
            fetch(normalizeUrl(location.href) + "/groups/change/sort-order", {
                method: "PATCH",
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json',
                }
            })
        })
        showModalWindow(document.body, [header, sortOrderBlocks, confirmChangeOfSortOrderBtn], 
            {className: "change-sort-order-modal-window"});
        
    }
    static searchWords(wordsSection, searchWordsBtn) {
        let searchInput = searchWordsBtn.previousElementSibling;
        if (!searchInput || searchInput?.tagName?.toLowerCase() !== "input") {
            return;
        }
        if (searchWordsBtn.classList.contains("cancel") || searchInput.value === "") {
            searchWordsBtn.classList.remove("cancel");
            for (const wordContainer of wordsSection.querySelectorAll(".word-container")) {
                wordContainer.classList.remove("hide");
            }
        } else {
            searchWordsBtn.classList.add("cancel");
            for (const wordContainer of wordsSection.querySelectorAll(".word-container")) {
                let currentWord = wordContainer.querySelector(".word-container__word")?.textContent?.toLocaleLowerCase?.();
                let currentTranslation = wordContainer.querySelector(".word-container__translation")?.textContent?.toLocaleLowerCase?.();
                if (!currentWord.includes(searchInput.value?.toLocaleLowerCase?.()) && !currentTranslation.includes(searchInput.value?.toLocaleLowerCase?.())) {
                    wordContainer.classList.add("hide");
                }
            }
        }
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
            let response = await fetch(normalizeUrl(location.href) + "/groups/delete", {
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
    static changeSelection(wordsSection, changeSelectionBtn){
        
        let action = changeSelectionBtn.querySelector("span")?.textContent;
        console.log(action);
        if (action?.startsWith("Select")) {
            for (const wordContainer of wordsSection.querySelectorAll(".word-container:not(.selected-word)")) {
                wordContainer.querySelector(".select-this-word")?.click();
            }
        } else if (action?.startsWith("Deselect")) {
            for (const wordContainer of wordsSection.querySelectorAll(".word-container.selected-word")) {
                wordContainer.querySelector(".select-this-word")?.click();
            }
        }
    }
    static changeDisplayOfSelectedWords(groupName, wordsSection, changeDisplayBtn){
        let selectDisplayWindow = changeDisplayBtn.querySelector(".select-display");
        if (selectDisplayWindow.classList.contains("active")) {
            return;
        }
        selectDisplayWindow.classList.add("active");
        let checkboxForWord = selectDisplayWindow.querySelector("#checkbox-for-word");
        let checkboxForTranslation = selectDisplayWindow.querySelector("#checkbox-for-translation");
        checkboxForWord.checked = checkboxForTranslation.checked = false;
        let deleteClickHandler;
        setTimeout(() => {
            deleteClickHandler = document.addEventListenerN("click", async event => {
                if (event.target.closest(".select-display")) {
                    if (event.target.closest(".select-display__btns__apply")) {
                        for (const wordContainer of wordsSection.getElementsByClassName("selected-word")) {
                            if (checkboxForWord?.checked) {
                                wordContainer.classList.remove("hide-translation");
                                wordContainer.classList.add("hide-word");
                            } else {
                                wordContainer.classList.remove("hide-word");
                            }
                            if (checkboxForTranslation?.checked) {
                                wordContainer.classList.remove("hide-word");
                                wordContainer.classList.add("hide-translation");
                            } else {
                                wordContainer.classList.remove("hide-translation");
                            }
                            
                            
                        }
                        selectDisplayWindow.classList.remove("active");
                        let selectedWords = wordsSection.getElementsByClassName("selected-word");
                        let hideTranslation = checkboxForTranslation?.checked;
                        let hideWord = hideTranslation ? false : checkboxForWord?.checked;
                        // console.log(hideWord, hideTranslation);
                        for (const wordContainer of selectedWords) {
                            await Word.changeDisplay(groupName, wordContainer, {hideWord, hideTranslation});
                        }
                        deleteClickHandler();// remove this event listener
                    } else if (event.target.closest(".select-display__btns__cancel")){
                        selectDisplayWindow.classList.remove("active");
                        deleteClickHandler();// remove this event listener
                    }
                } else {
                    selectDisplayWindow.classList.remove("active");
                    deleteClickHandler();// remove this event listener
                }
            })
        }, 0);
        
        
        
        
    }
    static copyWordsToAnotherGroup(wordsSection, groupsParent){
        let selectedWords = Array.from(wordsSection.getElementsByClassName("selected-word"))
        .map(wordContainer => {
            let wordInfo = {
                word: wordContainer.querySelector(".word-container__word")?.textContent,
                translation: wordContainer.querySelector(".word-container__translation")?.textContent,
            }
            return wordInfo;
        })
        let header = createElement({name: "header", content: "Enter and choose the name of the group to copy the words to:"},);
        let groupNameInput = createElement({name: "input"});
        groupNameInput.setAttribute("autocomplete", "off");
        let selectGroupSection = createElement({name: "section", class: "select-group-section"});
        let indexesOfEntriesInGroupNames = {};
        for (const groupsContainer of groupsParent?.querySelectorAll(".group")) {
            indexesOfEntriesInGroupNames[groupsContainer.textContent] = -1;
        }
        groupNameInput.addEventListener("input", event => {
            selectGroupSection.innerHTML = "";
            for (const groupName in indexesOfEntriesInGroupNames) {
                indexesOfEntriesInGroupNames[groupName] = groupName?.toLocaleLowerCase().indexOf(groupNameInput.value?.toLocaleLowerCase().trim());
            }
            Object.entries(indexesOfEntriesInGroupNames)
            .filter(([key, value]) => value >= 0)
            ?.sort((entry1, entry2) => entry1[1] - entry2[1])
            .forEach(([groupName,]) => selectGroupSection.insertAdjacentHTML("beforeend", `<div>${groupName}</div>`));

        })
        groupNameInput.dispatchEvent(new Event("input"));
        selectGroupSection.addEventListener("click", event => {
            if (event.target.closest(".select-group-section > div")) {
                groupNameInput.value = event.target.closest(".select-group-section > div").textContent;
                groupNameInput.dispatchEvent(new Event("input"));
            }
        })
        let confirmCopyingBtn = createElement({content: "Copy selected words", class: "copy-words-btn"});
        confirmCopyingBtn.addEventListener("click", async event => {
            if (!Object.keys(indexesOfEntriesInGroupNames).includes(groupNameInput.value)) {
                createWarningAfterElement(groupNameInput);
                setWarning(groupNameInput.nextElementSibling, "Enter the name of an existing group.", "groupNameInput");
                return;
            } else {
                setWarning(groupNameInput.nextElementSibling, "");
            }
            event.target.closest(".modal-window").closeWindow();
            for (const wordInfo of selectedWords) {
                let requestBody = Object.assign({
                    groupName: groupNameInput.value,
                }, wordInfo);
                try {
                    await fetch(normalizeUrl(location.href) + "/groups/add-word", {
                        method: "PUT",
                        body: JSON.stringify(requestBody),
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    })
                } catch (error) {
                    console.log(error.message);
                }
            }
        })
        showModalWindow(document.body, [header, groupNameInput, selectGroupSection, confirmCopyingBtn], 
            {className: "copy-words-to-another-group-modal-window"});
    }
    static deleteManyWords(groupName, wordsSection) {
        let selectedWords = Array.from(wordsSection.getElementsByClassName("selected-word"))
        .map(wordContainer => {
            let wordInfo = {
                word: wordContainer.querySelector(".word-container__word")?.textContent,
                translation: wordContainer.querySelector(".word-container__translation")?.textContent,
            }
            return wordInfo;
        })
        let header = createElement({name: "header", content: "To verify personality enter your password:"},);
        let passwordInput = createElement({name: "input"});
        passwordInput.setAttribute("type", "password");
        passwordInput.setAttribute("autocomplete", "off");
        let passwordBlock = createElement({name: "form", class: "password-block"});
        passwordBlock.innerHTML = `<div class="show-password">
        <input type="checkbox">Show password</div>`;
        passwordBlock.prepend(passwordInput);
        let checkPasswordBtn = createElement({content: "Delete words", class: "check-password-btn"});
        checkPasswordBtn.addEventListener("click", async event => {
            if (checkPasswordBtn.classList.contains("loading")) {
                return;
            }
            createWarningAfterElement(checkPasswordBtn);
            setWarning(checkPasswordBtn.nextElementSibling, '');
            if (passwordInput.value.length === 0) {
                createWarningAfterElement(passwordInput);
                setWarning(passwordInput.nextElementSibling, "Please, enter password.", "passwordInput");
                return;
            } else {
                setWarning(passwordInput.nextElementSibling, "");
            }
            // console.log(passwordInput.value);
            // return;
            //checkPasswordBtn.textContent = "-";// space to remain the button visible
            checkPasswordBtn.classList.add("loading");
            let deletionSuccessful = true;
            for (const wordInfo of selectedWords) {
                let requestBody = Object.assign({
                    groupName,// groupName: groupName,
                    password: passwordInput.value
                }, wordInfo);
                let response = {}, result = {};
                try {
                    response = await fetch(normalizeUrl(location.href) + "/words/delete", {
                        method: "DELETE",
                        body: JSON.stringify(requestBody),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                } catch (error) {
                    console.log(error.message);
                    if (error?.message?.includes("Failed to fetch")) {
                        result.message = "Server error.";
                    }
                }
                if (response.ok) {
                    result = await response.json();
                    if (result.success) {
                        for (const wordContainer of wordsSection.querySelectorAll(".selected-word")) {
                            let currentWord = wordContainer.querySelector(".word-container__word")?.textContent;
                            let currentTranslation = wordContainer.querySelector(".word-container__translation")?.textContent;
                            if (currentWord === wordInfo.word && currentTranslation === wordInfo.translation) {
                                wordContainer.remove();
                                break;
                            }
                        }
                        continue;
                    }
                }
                if (result?.message?.includes("Password don't match")) {
                    createWarningAfterElement(passwordInput);
                    setWarning(passwordInput.nextElementSibling, result.message, "passwordInput");
                    checkPasswordBtn.classList.remove("loading");
                    deletionSuccessful = false;
                    break;
                }
                result.message = String(result?.message || "Deletion error. Please try again.");
                createWarningAfterElement(checkPasswordBtn);
                setWarning(checkPasswordBtn.nextElementSibling, result.message, "checkPasswordBtn");
                console.log(result?.message);
                deletionSuccessful = false;
            }// end of for (const wordInfo of selectedWords)

            if (deletionSuccessful === false) {
                return;
            }
            if (!wordsSection.querySelector(".word-container")) {
                wordsSection.textContent = "Group doesn't contain any word.";
            }
            checkPasswordBtn.classList.remove("loading");
            event.target.closest(".modal-window").closeWindow();
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

export function sortWords(wordContainers, sortOrder = "1-9"){
    // console.log(wordContainers);
    // console.log(wordContainers.slice(0, 2));
    if (!wordContainers) {
        return;
    }
    if (sortOrder === "9-1") {
        wordContainers.sort((first, second) => {
            first = first.querySelector(".words-number").textContent.toLocaleLowerCase();
            second = second.querySelector(".words-number").textContent.toLocaleLowerCase();
            return second - first;
        })
    } else if (sortOrder === "a-z") {
        wordContainers.sort((first, second) => {
            first = first.querySelector(".word-container__word").textContent.toLocaleLowerCase();
            second = second.querySelector(".word-container__word").textContent.toLocaleLowerCase();
            return first.localeCompare(second);
        })
        
    } else if (sortOrder === "z-a") {
        wordContainers.sort((first, second) => {
            first = first.querySelector(".word-container__word").textContent;
            second = second.querySelector(".word-container__word").textContent;
            return -first.localeCompare(second);
        })
    } else {
        wordContainers.sort((first, second) => {
            first = first.querySelector(".words-number").textContent;
            second = second.querySelector(".words-number").textContent;
            return first - second;
        })
    }
}
/* 
result.words.sort((first, second) => { // mix elements in array
    let num = Math.round(Math.random() * 7) - 4;
    console.log(num);
    return num;
})
let clonedArray = result.words.concat();// this is required to avoid printing array, sorted by next sorting
console.log(clonedArray);
result.words.sort((first, second) => {
    return first.number - second.number;
})
console.log(result.words);
*/