"use strict";
import { setWarning, createWarningAfterElement, showModalWindow, createElement, showPassword} from "./useful.js";

export default class Word {
    constructor(params) {
        // create a new instance
    }
    static changeWord(){
        
    }
    static deleteWord(groupName, wordElement){
        let wordObject = {};
        for (const element of wordElement.children) {
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
                    let wordsSection = wordElement.parentElement;
                    wordElement.remove();
                    if (!wordsSection.querySelector(".word-element")) {
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