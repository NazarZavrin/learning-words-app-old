export function createWarningAfterElement(element){
    // console.log("warning after:");
    // console.log(element);
    if (!element.nextElementSibling.matches('.warning')) {
        element.insertAdjacentHTML("afterend", '<b class="warning"></b>');
    }
}
export function setWarning(element, warningText, elemName = ""){
    if (element.nextElementSibling.matches('.warning')) {
        element.nextElementSibling.textContent = warningText;
    } else if (warningText) {
        console.log(elemName + ":", warningText);
    }
}