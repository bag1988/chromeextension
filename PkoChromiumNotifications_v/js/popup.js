var currentUrl;
window.onload = () => {
  var form = document.querySelector("form");
  if (form) {
    form.onsubmit = () => {
      let ipAddress = document.getElementById("ipAddress");
      chrome.storage.local.set({ urlConnect: ipAddress.value });
    }
  }
  SetStateConnect();
  chrome.storage.local.get(["urlConnect"]).then((result) => {
    currentUrl = result.urlConnect ?? "";
    var ipAddress = document.getElementById("ipAddress");
    if (ipAddress) {
      ipAddress.value = currentUrl;
    }
  });

  chrome.storage.onChanged.addListener((object, areaName) => {
    if (areaName == "local") {
      if (object.hubState && object.hubState.newValue != object.hubState.oldValue) {
        SetStateConnect();
      }
    }
  });

  let historyView = document.querySelector("#viewHistory");
  if (historyView) {
    historyView.onclick = async () => {
      await chrome.runtime.sendMessage({ method: "showWindow", forIp: chrome.runtime.id, forPage: "index.html" });
      window.close();
    };
  }

  if (document.querySelector("footer small")) {
    document.querySelector("footer small").innerHTML = `Версия: ${chrome.runtime.getManifest().version}`;
  }
}

function SetStateConnect() {
  chrome.storage.local.get(["hubState"]).then((result) => {
    let hubState = document.getElementById("stateConnect");
    let historyView = document.querySelector("#viewHistory");
    historyView.classList.add("d-none");
    if (hubState) {
      if (result.hubState == "Connected") {
        hubState.innerText = "Подключено";
        hubState.style.color = 'green';
        historyView.classList.remove("d-none");
      }
      else if (result.hubState == "Connecting" || result.hubState == "Reconnecting") {
        hubState.innerText = "Идет подключение";
        hubState.style.color = 'yellow';
      }
      else {
        hubState.innerText = "Отключено";
        hubState.style.color = 'red';

      }
    }
  });
}