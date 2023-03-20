"use strict";
import Word from "./class_Word.js";
import { setWarning, createWarningAfterElement, showModalWindow, createElement, showPassword} from "./useful.js";
export default class Group {
    constructor(params) {
        // group creation
    }
    static viewGroup(groupName, ...synchronousCallbacks){
        if (!groupName) {
            console.log("viewGroup() error: groupName is " + groupName);
        }
        fetch(location.href + '/groups/view', {
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
                return Group.showWords(groupName);
                // addHandlersToViewGroupBlock(groupName);
            } else if (result === "failure") {
                throw new Error("Couldn't get group " + groupName);
            }
            else {
                throw new Error(result);
            }
        })
        .then(result => {
            for (const callback of synchronousCallbacks) {
                callback(groupName);
            }
        })
        .catch(error => {
            alert(error);
        })
    }
    static async showWords(groupName) {
        let viewGroupBlock = document.body.querySelector("#view-group");
        let wordsSection = viewGroupBlock.querySelector(".words-section");
        wordsSection.classList.add("loading");
        // return;
        let response = await fetch(location.href + '/groups/get-words', {
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
        wordsSection.classList.remove("loading");
        if (!result.success) {
            result.message = String(result?.message || "Can not get words of group " + groupName);
            wordsSection.textContent = result.message;
            return;
        }
        // await new Promise((resolve, reject) => {
        //     setTimeout(() => resolve(1), 1000);// to see how the loading icon works
        // })
        
        
        if (result.words.length === 0) {
            wordsSection.textContent = "Group doesn't contain any word.";
        } else {
            result.words = result.words.map(wordObject => {
                return new Word(wordObject);
            })
            // console.log(result);
            sortWords(result.words, result.sortOrder);
            wordsSection.innerHTML = "";
            for (let i = 0; i < result.words.length; i++) {
                wordsSection.append(result.words[i]);
            }
            let changeSortOrderBlock = viewGroupBlock.querySelector(".change-sort-order");
            if (result.sortOrder && changeSortOrderBlock) {
                changeSortOrderBlock.dataset.currentSortOrder = result.sortOrder;
            }
            // renderSortedWords
        }
    }
    static addWord(groupName, wordsSection, changeSortOrderBlock) {
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
                if (result.success) {
                    event.target.closest(".modal-window").closeWindow();
                    if (!wordsSection.querySelector(".word-container")) {// if there arent any words in the section...
                        wordsSection.innerHTML = "";// ...erase the message "Group doesn't contain any word."
                    }
                    let wordContainers = [...wordsSection.getElementsByClassName("word-container")];
                    wordContainers.push(new Word({...requestBody, number: result.number}));
                    // console.log(wordContainers.slice(-3));
                    sortWords(wordContainers, changeSortOrderBlock.dataset?.currentSortOrder);
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
    static changeSortOrder(groupName, wordsSection, changeSortOrderBlock) {
        let header = createElement({name: "header", content: "Choose sort order:"},);
        let numericAscending = createElement({class: "1-9 selected"});
        numericAscending.innerHTML = '<img src="/img/sorting.png"><span>Numeric ascending sort order</span>';
        let numericDescending = createElement({class: "9-1"});
        numericDescending.innerHTML = '<img src="/img/sorting.png"><span>Numeric descending sort order</span>';
        let alphabeticAscending = createElement({class: "a-z"});
        alphabeticAscending.innerHTML = '<img src="/img/sorting.png"><span>Alphabetic ascending sort order</span>';
        let alphabeticDescending = createElement({class: "z-a"});
        alphabeticDescending.innerHTML = '<img src="/img/sorting.png"><span>Alphabetic descending sort order</span>';
        let sortOrderBlocks = createElement({class: "sort-order-blocks"});
        sortOrderBlocks.append(numericAscending);
        sortOrderBlocks.append(numericDescending);
        sortOrderBlocks.append(alphabeticAscending);
        sortOrderBlocks.append(alphabeticDescending);
        for (const sortOrderBlock of sortOrderBlocks.children) {
            sortOrderBlock.classList.add("sort-order-block");
            if (sortOrderBlock.classList.contains(changeSortOrderBlock.dataset?.currentSortOrder)) {
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
        let changeSortOrderBtn = createElement({content: "Change sort order", class: "change-sort-order-btn"});
        changeSortOrderBtn.addEventListener("click", event => {
            let selectedSortOrderBlock = sortOrderBlocks.querySelector(".selected");
            let selectedSortOrder = selectedSortOrderBlock?.className?.split(" ")?.find(value => value.length === 3 && value[1] === "-");
            if (!selectedSortOrder || selectedSortOrder === changeSortOrderBlock.dataset?.currentSortOrder) {
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
            changeSortOrderBlock.dataset.currentSortOrder = selectedSortOrder;
            event.target.closest(".modal-window").closeWindow();
            let requestBody = {
                groupName,// groupName: groupName,
                sortOrder: selectedSortOrder,
            };
            fetch(location.href + "/groups/change/sort-order", {
                method: "PATCH",
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            
        })
        showModalWindow(document.body, [header, sortOrderBlocks, changeSortOrderBtn], 
            {className: "change-sort-order-modal-window"});
        
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

function sortWords(wordContainers, sortOrder = "1-9"){
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