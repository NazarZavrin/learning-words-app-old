"use strict";
console.log(HTMLElement.prototype);
console.log("check userinput (while updating profile characteristics) with functions userIdIsCorrect and similar (create-account.js)");
console.log("/profile router");

const infoBtn = document.querySelector(".header__info-btn");
const profileLabel = document.querySelector(".header__profile-label");
const infoSidebar = document.querySelector(".profile-info");
infoBtn.classList.add("active");// when page loads remove
infoSidebar.classList.add("active");// when page loads remove
infoBtn.addEventListener("click", event => {
    infoBtn.classList.toggle("active");
    infoSidebar.classList.toggle("active");
})
profileLabel.addEventListener("click", event => {
    event.preventDefault();
    infoBtn.click();
})
infoSidebar.addEventListener("click", async event => {
    if (event.target.closest(".edit-btn")) {
        let editBlock = event.target.closest(".edit-btn").parentElement.nextElementSibling;
        editBlock.classList.toggle("hide");
        if (!editBlock.classList.contains("hide")) {
            let currentValue = editBlock.previousElementSibling.children[0].textContent;
            let input = editBlock.querySelector("input");
            input.value = currentValue;
        }
        
    } else if (event.target.closest(".save-btn")){
        let editBlock = event.target.closest(".edit-block");
        editBlock.classList.add("hide");
        let infoPart = editBlock.previousElementSibling.className.split(" ").shift();
        let infoPartInput = event.target.closest(".save-btn").previousElementSibling;
        let newValue = infoPartInput.value;
        let currentValue = editBlock.previousElementSibling.children[0].textContent;
        if (newValue === currentValue) {
            console.log("Values coincide.");
            return;
        }
        // console.log(newValue);
        infoPartInput.value = "";
        let response = await fetch(location.href + "/change/" + infoPart, {
            method: "PATCH",
            body: newValue,
        })
        let result = "Update error. Please try again.";
        if (response.ok) {
            result = await response.json();
            console.log(result);
            if (result.success) {
                // remove json stringify in the end 
                event.target.closest(".edit-block").previousElementSibling.children[0].textContent = result.newValue;
                return;
            }
        }
        console.log(result.message || result);
        alert(result.message || result);
    } else if (event.target.closest(".cancel-btn")){
        event.target.closest(".edit-block").classList.add("hide");
    }

})
const logOutBtn = document.getElementById("log-out-btn");
logOutBtn.addEventListener("click", event => {
    // fetch register log out
    location.href = "/";
})

