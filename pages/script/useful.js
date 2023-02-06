export function showModalWindow(bodyElement, elementsArray, {showCross = true, style = "", className = "", attributes = [], handlers: eventHandlers = []} = {}){
    // options: className(string), showCross(boolean)
    let modalWindow = createElement({name: "div", class: "modal-window " + className, style: style});
    elementsArray.forEach(element => {
        modalWindow.append(element);
    });
    if (showCross == true) {
        let cross = createElement({name: "div", class: "modal-window-cross"});
        cross.innerHTML = '<img src="/img/cross.png" alt="Close">';
        modalWindow.append(cross);
        cross.addEventListener("click", event => {
            background.remove();
            background = null;
        });
    }
    eventHandlers.forEach(({eventName, handler, options = {}}) => modalWindow.addEventListener(eventName, handler, options));
    modalWindow.closeWindow = function () {
        background.remove();
        background = null;
    }
    let background = createElement({name: "div", class: "background"});
    background.append(modalWindow);
    bodyElement.prepend(background);
    background.addEventListener("mousedown", event => {
        if (!event.target.closest(".modal-window")) {
            background.children[0].closeWindow();
        }
    });
}
export function createElement({name: elemName = "div", style = "", content = "", class: className = ""} = {}){
    let element = document.createElement(elemName);
    if (elemName == "input") {
        element.value = content;
    } else {
        element.textContent = content;
    }
    if (className) element.className = className;
    if (style) element.style.cssText = style;
    return element;
}
export function showPassword(parentsToShowSelectors, passwordInput, event){
    if (!parentsToShowSelectors) {
        console.warn("parentsToShowSelectors is", parentsToShowSelectors);
        return;
    } else if (!passwordInput){
        console.warn("passwordInput is", passwordInput);
        return;
    } else if (!event){
        console.warn("event is", event);
        return;
    }
    let showPasswordElement;
    for (let i = 0; i < parentsToShowSelectors.length; i++) {
        if (event.target.closest(parentsToShowSelectors[i])) {
            showPasswordElement = event.target.closest(parentsToShowSelectors[i]);
            break;
        }
    }
    // console.log(showPasswordElement);
    if (showPasswordElement) {
        let checkboxElement = showPasswordElement.querySelector('input[type="checkbox"]');
        // console.log(checkboxElement);
        // console.log(passwordInput);
        // console.log(event.target);
        if (event.target !== checkboxElement) checkboxElement.checked = !checkboxElement.checked;
        // console.log(checkboxElement.checked);
        if (passwordInput.type === "password" && checkboxElement.checked) {
            passwordInput.type = "text";
        } else {
            passwordInput.type = "password";
        }
    }
}
export function createWarningAfterElement(element){
    // console.log(element);
    // console.log("warning after:");
    // console.log(element);
    if (!element.nextElementSibling?.matches('.warning')) {
        element.insertAdjacentHTML("afterend", '<b class="warning"></b>');
    }
}
export function setWarning(element, warningText, description = ""){
    if (element?.matches('.warning')) {
        element.textContent = warningText;
    } else if (warningText) {
        console.log(description + ":", warningText);
    }
}
export function userNameIsCorrect(inputElement, elementForWarning = null, event = {}) {
    elementForWarning = elementForWarning || inputElement;
    // console.log(arguments);
    createWarningAfterElement(elementForWarning);
    let warningText = "";
    if (inputElement.value.length > 50) {
        warningText = "Username must not exceed 50 characters.";
    } else if (inputElement.value.length < 3) {
        warningText = "Username must not be less than 3 characters.";
    }
    setWarning(elementForWarning.nextElementSibling, warningText, "username");
    return warningText.length > 0 ? false : true;
}
const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+$/;
// console.log("Some-Email@gmail.com".match(emailRegex));
// console.log("wrong@email@gmail.com".match(emailRegex));
export function emailIsCorrect(inputElement, elementForWarning = null, event = {}){
    elementForWarning = elementForWarning || inputElement;
    createWarningAfterElement(elementForWarning);
    let warningText = "";
    if (inputElement.value.length > 50) {
        warningText = "Email must not exceed 50 characters.";
    } else if (!inputElement.value.match(emailRegex)) {
        warningText = "Incorrect email.";
    }
    setWarning(elementForWarning.nextElementSibling, warningText, "email");
    return warningText.length > 0 ? false : true;
}
const userIdRegex = /^@[a-zA-Z0-9_.-]+$/;
export function userIdIsCorrect(inputElement, elementForWarning = null, event = {}){
    elementForWarning = elementForWarning || inputElement;
    createWarningAfterElement(elementForWarning);
    let warningText = "";
    if (inputElement.value.length > 20) {
        warningText = "ID must not exceed 20 characters.";
    } else if (inputElement.value.length < 5) {
        warningText = "ID must not be less than 5 characters.";
    } else if (!inputElement.value.startsWith("@")) {
        warningText = 'ID must begin with "@" symbol.';
    } else if (inputElement.value.match(/@/g).length > 1) {
        warningText = 'ID must include only one "@" symbol.';
    } else if (inputElement.value.search(/\s/) >= 0) {
        warningText = "ID must not include space symbols.";
    } else if (!inputElement.value.match(userIdRegex)) {
        warningText = "Incorrect ID.";
    }
    setWarning(elementForWarning.nextElementSibling, warningText, "userId");
    return warningText.length > 0 ? false : true;
}
export function passwordIsCorrect(inputElement, elementForWarning = null, event = {}) {
    elementForWarning = elementForWarning || inputElement;
    createWarningAfterElement(elementForWarning);
    let warningText = "";
    if (inputElement.value.length > 20) {
        warningText = "Password must not exceed 20 characters.";
    } else if (inputElement.value.length < 4) {
        warningText = "Password must not be less than 4 characters.";
    } else if (inputElement.value.search(/\s/) >= 0) {
        warningText = "ID must not include space symbols.";
    }
    setWarning(elementForWarning.nextElementSibling, warningText, "password");
    return warningText.length > 0 ? false : true;
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