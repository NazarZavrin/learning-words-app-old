"use strict";
import { setWarning, createWarningAfterElement, showModalWindow, createElement, showPassword} from "./useful.js";


export default class Word {
    constructor(wordObj) {
        let wordContainer = createElement({class: "word-container"});
        let wordElement = createElement({content: wordObj.word, class: "word-container__word"});
        let translationElement = createElement({content: wordObj.translation, class: "word-container__translation"});
        wordContainer.append(wordElement);
        wordContainer.append(translationElement);
        let buttons1 = createElement({class: "word-container__btns"});// delete or edit word
        let editWordBtn = createElement({class: "edit-word-btn"});
        editWordBtn.innerHTML = "<img src='/img/edit.png'>";
        let deleteWordBtn = createElement({class: "delete-word-btn"});
        deleteWordBtn.innerHTML = "<img src='/img/trash-can.png'>";
        buttons1.append(editWordBtn);
        buttons1.append(deleteWordBtn);
        wordContainer.prepend(buttons1);
        let buttons2 = createElement({class: "word-container__auxiliary"});
        let select = createElement({class: "select-this-word"});
        let wordsNumber = createElement({class: "words-number"});
        wordsNumber.textContent = wordObj.number;
        wordsNumber.setAttribute("contenteditable", "true");
        buttons2.append(select);
        buttons2.append(wordsNumber);
        wordContainer.append(buttons2);
        return wordContainer;
    }
    static changeWord(groupName, wordContainer) {
        let wordObject = {}, wordElement, translationElement;
        for (const element of wordContainer.children) {
            if (element.className?.includes("__word")) {
                wordObject.word = element.textContent;
                wordElement = element;
            }
            if (element.className?.includes("__translation")) {
                wordObject.translation = element.textContent;
                translationElement = element;
            }
        }
        let newWordLabel = createElement({name: "header", content: "Enter changed word:"},);
        let newWordInput = createElement({name: "input"});
        newWordInput.setAttribute("autocomplete", "off");
        newWordInput.value = wordObject.word;
        let newTranslationLabel = createElement({name: "header", content: "Enter changed translation:"},);
        let newTranslationInput = createElement({name: "input"});
        newTranslationInput.setAttribute("autocomplete", "off");
        newTranslationInput.value = wordObject.translation;
        let passwordLabel = createElement({name: "header", content: "To verify personality enter your password:"},);
        let passwordInput = createElement({name: "input"});
        passwordInput.setAttribute("type", "password");
        passwordInput.setAttribute("autocomplete", "off");
        let passwordBlock = createElement({name: "form", class: "password-block"});
        passwordBlock.innerHTML = `<div class="show-password">
        <input type="checkbox">Show password</div>`;
        passwordBlock.prepend(passwordInput);
        let changeWordBtn = createElement({content: "Change name of group", class: "change-group-name-btn"});
        changeWordBtn.addEventListener("click", async event => {
            createWarningAfterElement(changeWordBtn);
            setWarning(changeWordBtn.nextElementSibling, '');
            let everythingIsCorrect = true;
            // ↓ checking new word 
            if (newWordInput.value.length == 0) {
                createWarningAfterElement(newWordInput);
                setWarning(newWordInput.nextElementSibling, "Please, enter changed word.", "newWordInput");
                everythingIsCorrect = false;
            } else if (newWordInput.value.length > 20) {
                createWarningAfterElement(newWordInput);
                setWarning(newWordInput.nextElementSibling, "Length of changed word must not exceed 20 characters.", "newNameInput");
                everythingIsCorrect = false;
            } else {
                setWarning(newWordInput.nextElementSibling, "");
            }
            // ↓ checking new translation 
            if (newTranslationInput.value.length == 0) {
                createWarningAfterElement(newTranslationInput);
                setWarning(newTranslationInput.nextElementSibling, "Please, enter changed translation.", "newTranslationInput");
                everythingIsCorrect = false;
            } else if (newTranslationInput.value.length > 20) {
                createWarningAfterElement(newTranslationInput);
                setWarning(newTranslationInput.nextElementSibling, "Length of changed translation must not exceed 20 characters.", "newNameInput");
                everythingIsCorrect = false;
            } else {
                setWarning(newTranslationInput.nextElementSibling, "");
            }
            if (passwordInput.value.length === 0) {
                createWarningAfterElement(passwordInput);
                setWarning(passwordInput.nextElementSibling, "Please, enter password.", "passwordInput");
                everythingIsCorrect = false;
            } else {
                setWarning(passwordInput.nextElementSibling, "");
            }
            if (newWordInput.value === wordObject.word && newTranslationInput.value === wordObject.translation) {
                createWarningAfterElement(changeWordBtn);
                setWarning(changeWordBtn.nextElementSibling, "Old and new word and translation coincide.");
                everythingIsCorrect = false;
            }
            if (everythingIsCorrect === false) {
                return;
            }
            // console.log(newGroupNameInput.value);
            let requestBody = {
                oldWord: wordObject,
                newWord: {
                    word: newWordInput.value,
                    translation: newTranslationInput.value
                },
                groupName,// groupName: groupName,
                password: passwordInput.value,
            };
            // return;
            let response = await fetch(location.href + "/words/change", {
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
                if (result.success) {
                    event.target.closest(".modal-window").closeWindow();
                    wordElement.textContent = result.newWord;
                    translationElement.textContent = result.newTranslation;
                    return;
                }
            }
            if (result?.message?.includes("Password don't match")) {
                createWarningAfterElement(passwordInput);
                setWarning(passwordInput.nextElementSibling, result.message, "passwordInput");
                return;
            }
            result.message = String(result?.message || "Updating error. Please try again.");
            createWarningAfterElement(changeWordBtn);
            setWarning(changeWordBtn.nextElementSibling, result.message, "changeWordBtn");
            console.log(result?.message);
        })
        function clickModalWindow(event) {
            if (passwordInput) {
                showPassword([".show-password"], passwordInput, event);
            }
        }
        showModalWindow(document.body, [newWordLabel, newWordInput, newTranslationLabel, newTranslationInput, passwordLabel, passwordBlock, changeWordBtn], 
            {className: "change-word-modal-window", handlers: [{eventName: "click", handler: clickModalWindow}]});
    }
    static async changeNumber(groupName, numberInput, oldNumber) {
        let newNumber = getNormalNumber(numberInput.textContent);
        if (Number.isNaN(newNumber)) {
            numberInput.textContent = oldNumber;
            return;
        }
        numberInput.textContent = newNumber;
        let wordObject = {}, wordContainer = numberInput.closest(".word-container");
        for (const element of wordContainer.children) {
            if (element.className?.includes("__word")) {
                wordObject.word = element.textContent;
            }
            if (element.className?.includes("__translation")) {
                wordObject.translation = element.textContent;
            }
        }
        let requestBody = {
            ...wordObject,// add here entries of wordObject
            groupName,// groupName: groupName,
        };
        // return;
        let response = await fetch(location.href + "/words/change-number", {
            method: "PATCH",
            body: JSON.stringify(requestBody),
            headers: {
                "New-Number": numberInput.textContent,
                'Content-Type': 'application/json',
            }
        })
        let result = {};
        if (response.ok) {
            result = await response.json();
            console.log(result);
            // console.log(Date.now());
            if (result.success && result.newNumber) {
                numberInput.textContent = result.newNumber;
                return "number was changed";
            } else {
                numberInput.textContent = oldNumber;
            }
        }
    }
    static deleteWord(groupName, wordContainer){
        let wordObject = {};
        for (const element of wordContainer.children) {
            if (element.className?.includes("__word")) {
                wordObject.word = element.textContent;
            }
            if (element.className?.includes("__translation")) {
                wordObject.translation = element.textContent;
            }
        }
        // console.log(wordObject);
        let header = createElement({name: "header", content: "To verify personality enter your password:"},);
        let passwordInput = createElement({name: "input"});
        passwordInput.setAttribute("type", "password");
        passwordInput.setAttribute("autocomplete", "off");
        let passwordBlock = createElement({name: "form", class: "password-block"});
        passwordBlock.innerHTML = `<div class="show-password">
        <input type="checkbox">Show password</div>`;
        passwordBlock.prepend(passwordInput);
        let checkPasswordBtn = createElement({content: "Delete word", class: "check-password-btn"});
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
            let requestBody = Object.assign({
                groupName,// groupName: groupName,
                password: passwordInput.value
            }, wordObject);
            let response = {}, result = {};
            try {
                response = await fetch(location.href + "/words/delete", {
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
                console.log(result);
                if (result.success) {
                    event.target.closest(".modal-window").closeWindow();
                    let wordsSection = wordContainer.parentElement;
                    wordContainer.remove();
                    if (!wordsSection.querySelector(".word-container")) {
                        wordsSection.textContent = "Group doesn't contain any word."
                    }
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

function getNormalNumber(numberInString){
    let numParts = numberInString?.split(",");
    let newNumber = Number(numParts?.join("."));
    if (Number.isNaN(newNumber) || newNumber <= 0) {
        return Number.NaN;
    } else {
        numParts = String(newNumber).split(".");
        // number must have 5 digits before the decimal point and 3 after it
        if (numParts[0].length > 5) {
            return Number.NaN;
        } else if (numParts[1]?.length > 3){
            numParts[1] = numParts[1].slice(0, 3);
            console.log(numParts[1]);
            return numParts.join(".");
        } else {
            return newNumber;
        }
    }
}