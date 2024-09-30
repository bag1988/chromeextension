
window.addEventListener("load", loadPopUp);

async function loadPopUp() {
  await initLocalization();
  var form = document.querySelector("form");
  if (form) {
    form.onsubmit = () => {
      let tbody = document.querySelector("tbody");
      let arrayTr = tbody.querySelectorAll("tr");
      let urlConnects = [];
      if (arrayTr) {
        [...arrayTr].forEach(item => {
          let url = item.querySelector("input[type='text']")?.value;
          let enabled = item.querySelector("input[type='checkbox']")?.checked;
          if (url) {
            urlConnects.push({ url: url, enabled: enabled });
          }
        });
      }
      chrome.storage.local.set({ urlConnects: urlConnects });
    }
  }
  chrome.runtime.sendMessage(null, { method: "getAllState" }, null, SetStateConnect);

  if (document.querySelector("[name='changeLanguage']")) {
    document.querySelector("[name='changeLanguage']").value = localization.currentLocalization ?? "";
    document.querySelector("[name='changeLanguage']").onchange = async (e) => {
      if (e.target.value == "") {
        await chrome.storage.local.remove(["language"]);
      }
      else {
        await chrome.storage.local.set({ language: e.target.value });
      }
    };
  }
  chrome.runtime.onMessage.addListener((e) => {
    if (e.method == "changeHubState") {
      let tbody = document.querySelector("tbody");
      if (tbody) {
        let tr = tbody.querySelector(`tr:has(input[value="${e.url}"])`);
        if (tr) {
          let td = tr.querySelector("td[name='state']");
          if (td) {
            td.innerHTML = localization.getMessage(e.state.toLowerCase());
            td.setAttribute("data-color", e.state.toLowerCase());
            td.setAttribute("data-i18n", e.state.toLowerCase());
          }
        }
      }
    }
  });

  WriteHeaderPKO();
}

/*

buildNumber: "7.18.0-dev"
companyName: "sensor"
productName: "pko"

*/

async function WriteHeaderPKO() {
  let companyName = await GetPKOVersion();
  
  let poText = companyName == "sensorm" ? "" : "poName";
  let poName = "";
  switch (companyName) {
    case "kae":
      poName = "poNameKAE";
      break;
    case "sensor":
      poName = "poNameSensor";
      break;
    case "sensorm":
      poName = "poNameSensorM";
      break;
  }

  let headerHTML = `<text data-i18n="${poText}">${localization.getMessage(poText)}</text>
                   <br><text data-i18n="${poName}">${localization.getMessage(poName)}</text>
                   <br><small data-i18n="moduleNotification">${localization.getMessage("moduleNotification")}</small>`;


  if (document.querySelector("[name='header']")) {
    document.querySelector("[name='header']").innerHTML = headerHTML;
  }
}

async function GetPKOVersion() {
  let companyName = "";
  try {
    companyName = (await chrome.storage.local.get("companyName"))?.companyName;    
    if (!companyName) {
      let update_url = new URL(chrome.runtime.getManifest().update_url);
      if (update_url.origin) {
        let result = await fetch(`${update_url.origin}/api/v1/allow/PVersionFull`, {
          method: "post", headers: {
            "Content-Type": "application/json"
          }
        }).catch((e) => {
          console.error(`Метод "PVersionFull" не найден или не доступен!`, e.message);
        });
        if (result) {
          let PVersion = await result?.json();
          if (PVersion?.companyName) {
            companyName = PVersion.companyName;
            chrome.storage.local.set({ companyName: companyName });
          }
        }
      }
    }
  }
  catch (e) {
    console.error("Ошибка получения версии", e.message);
  }
  return companyName ?? "sensor";
}

async function SetStateConnect(hubStates) {
  let tbody = document.querySelector("tbody");
  if (tbody) {
    tbody.innerHTML = "";
  }

  let result = await chrome.storage.local.get();

  let urlConnects = result.urlConnects;
  if (urlConnects) {
    for (let item of urlConnects) {
      AddRow(item.url, hubStates.find(x => x.url == item.url)?.state, item.enabled);
    }
  }
  AddRow("", "", false);
}
function AddRow(url, state, enabled) {
  let tbody = document.querySelector("tbody");
  if (tbody) {
    let rowHtml = `<tr class="white-space v-align-top">
                          <td><input class="form-input" type="text" pattern="^((\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.){3}(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5]):\\d{3,5}$" placeholder="xxx.xxx.xxx.xxx:xxxx" value="${url}" /></td>
                          <td name="state" data-color="${state.toLowerCase()}" data-i18n="${state.toLowerCase()}">${localization.getMessage(state.toLowerCase())}</td>
                          <td><input type="checkbox" ${enabled ? "checked" : ""} /></td>
                    </tr>`;
    tbody.insertAdjacentHTML("beforeend", rowHtml);
  }
}