window.addEventListener("load", loadFiltr);

function loadFiltr() {  
  var searchField = document.querySelector("[name='searchField']");
  if (searchField) {
    searchField.oninput = UpdateTable;
  }
  SetThSortFunc();
}

var currentSort = document.querySelector(".array-down");
var isDescSort = true;
var indexSortColumn = document.querySelector(".array-down")?.cellIndex;
function SetThSortFunc() {
  let thead = document.querySelector("thead");
  if (thead) {
    thead.onclick = sortTableEvent;
  }
}

function sortTableEvent(event) {
  var thArray = document.querySelectorAll("th");

  if (thArray) {
    thArray.forEach(th => {
      th.removeAttribute("class");
    });

    if (event.target == currentSort) {
      isDescSort = isDescSort ? false : true;
    }
    else {
      currentSort = event.target;
    }
    currentSort.classList.add(isDescSort ? "array-down" : "array-up");
    indexSortColumn = [...thArray].indexOf(currentSort);
    SortTable();
  }
}


function SortTable() {
  let tbody = document.querySelector("tbody");
  if (tbody) {
    let trArray = tbody.querySelectorAll("tr");
    if (trArray) {
      [...trArray].sort((next, first) => {
        let firstTd = first.querySelectorAll("td")[indexSortColumn];
        let nextTd = next.querySelectorAll("td")[indexSortColumn];

        let dataType = firstTd?.getAttribute("data-type");

        let firtstData = null;
        let nextData = null;


        switch (dataType) {
          case "datatime":
            firtstData = parseInt(firstTd?.getAttribute("data-value"));
            nextData = parseInt(nextTd?.getAttribute("data-value"));
            break;
          case "number":
            firtstData = parseInt(firstTd?.innerText);
            nextData = parseInt(nextTd?.innerText);
            break;
          default:
            firtstData = firstTd?.innerText;
            nextData = nextTd?.innerText;
        }

        if (!isDescSort && firtstData > nextData) {
          first.parentNode.insertBefore(next, first);
          return 1;
        }
        if (isDescSort && firtstData < nextData) {
          first.parentNode.insertBefore(next, first);
          return 1;
        }
        return -1;
      });
    }
  }
}

function getValueSearchField() {
  let input = document.querySelector("[name='searchField']");
  if (input) {
    return input.value;
  }
  return "";
}


function UpdateTable() {
  let valueSearchField = getValueSearchField();
  let tbody = document.querySelector("tbody");
  if (tbody) {
    let trArray = tbody.querySelectorAll("tr");
    if (trArray) {
      trArray.forEach(tr => {
        let tdArray = tr.querySelectorAll("td");

        if (tdArray) {
          tdArray.forEach(td => {
            if (td.innerText.includes(valueSearchField)) {
              td.innerHTML = td.innerText.replace(valueSearchField, `<span class="bg-warning">${valueSearchField}</span>`);
            }
            else {
              if (td.querySelector("span")) {
                td.innerHTML = td.innerText;
              }
            }
          });

          if (valueSearchField && !tr.querySelector("span")) {
            tr.classList.add("d-none");
          }
          else {
            tr.classList.remove("d-none");
          }
        }

      });
    }
  }
}