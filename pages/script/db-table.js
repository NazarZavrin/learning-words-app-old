"use strict";
document.body.children[0].insertAdjacentHTML("afterbegin", "<div>w:" + document.documentElement.clientWidth + ", h: " + document.documentElement.clientHeight + "</div>");
let tableElement = document.getElementsByClassName('data-table')[0];
updateTable(tableElement);
async function updateTable(tableElement){
    let data;// will be an array of objects-users
    let response = await fetch("/info", {method: "POST"});
    if (response.ok) {
        data = await response.json();
        console.log("Users' info:", data);
    } else {
        console.log("Error " + response.status);
        alert("Failed to fetch the data.");
        return;
    }
    if (data.length === 0) {
        tableElement.style.gridTemplateColumns = "";
        tableElement.style.gridTemplateRows = "";
        tableElement.innerHTML = "Database is empty.";
        return;
    }
    tableElement.innerHTML = "";
    let headerLabels = Object.keys(data[0]);
    tableElement.style.gridTemplateColumns = "1fr ".repeat(headerLabels.length);
    tableElement.style.gridTemplateRows = "1fr ".repeat(data.length + 1);// +1 for the head of the table
    // ↓ head of the table
    for (const key of headerLabels) {
        tableElement.insertAdjacentHTML("beforeend", 
            "<div>" + key + "</div>"
        );
    }
    // ↓ body of the table (users' data)
    data.forEach(obj => {
        for (const label of headerLabels) {
            let value = obj[label] || " ";
            tableElement.insertAdjacentHTML("beforeend", 
                "<div>" + value + "</div>"
            );
        }
    })
}