"use strict";
console.log("profile");

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
infoSidebar.addEventListener("click", event => {
    if (event.target.closest(".edit-btn")) {
        // event.target.closest(".edit-btn").previousElementSibling.textContent = "";
        console.log(HTMLElement.prototype);
        event.target.closest(".edit-btn").parentElement.nextElementSibling.style.display = "flex";
    }
})


