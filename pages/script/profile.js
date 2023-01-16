"use strict";
console.log("profile");

const infoBtn = document.querySelector(".header__info-btn");
const profileLabel = document.querySelector(".header__profile-label");
const infoSidebar = document.querySelector(".profile-info");
infoBtn.classList.remove("active");// when page loads
infoSidebar.classList.remove("active");// when page loads
infoBtn.addEventListener("click", event => {
    infoBtn.classList.toggle("active");
    infoSidebar.classList.toggle("active");
})
profileLabel.addEventListener("click", event => {
    event.preventDefault();
    infoBtn.click();
})
