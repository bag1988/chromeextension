
window.onload = () => {
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
            urlConnects.push({ url: url, enabled: enabled});
          }
        });
      }
      chrome.storage.local.set({ urlConnects: urlConnects });
    }
  }
  SetStateConnect();

  chrome.storage.onChanged.addListener((object, areaName) => {
    let tbody = document.querySelector("tbody");
    if (tbody) {
      if (areaName == "local") {
        if (object.hubStates && object.hubStates.newValue != object.hubStates.oldValue) {
          let hubStates = object.hubStates.newValue;
          for (let item of hubStates) {
            let tr = tbody.querySelector(`tr:has(input[value="${item.url}"])`);
            if (tr) {
              let td = tr.querySelector("td[name='state']");
              if (td) {
                td.innerHTML = GetState(item.state);
              }
            }
          }
        }
      }
    }
  });

  if (document.querySelector("footer small")) {
    document.querySelector("footer small").innerHTML = `Версия: ${chrome.runtime.getManifest().version}`;
  }
}

async function SetStateConnect() {
  let tbody = document.querySelector("tbody");
  if (tbody) {
    tbody.innerHTML = "";
  }

  let result = await chrome.storage.local.get();

  let hubStates = result.hubStates;
  let urlConnects = result.urlConnects;
  if (urlConnects) {
    for (let item of urlConnects) {
      AddRow(item.url, hubStates?.find(x => x.url == item.url)?.state, item.enabled);
    }
  }
  AddRow("", "", false);
}
function AddRow(url, state, enabled) {
  let tbody = document.querySelector("tbody");
  if (tbody) {
    console.info({ url: url, enabled: enabled });
    let rowHtml = `<tr class="white-space v-align-top">
                          <td><input type="text" pattern="^((\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.){3}(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5]):\\d{3,5}$" placeholder="xxx.xxx.xxx.xxx:xxxx" value="${url}" /></td>
                          <td name="state">${GetState(state)}</td>
                          <td><input type="checkbox" ${enabled ? "checked" : ""} /></td>
                    </tr>`;
    tbody.insertAdjacentHTML("beforeend", rowHtml);
  }
}
function GetState(hubState) {
  let text = "";
  let color = "";
  if (hubState) {
    if (hubState == "Connected") {
      text = "Подключено";
      color = 'green';
    }
    else if (hubState == "Connecting" || hubState == "Reconnecting") {
      text = "Идет подключение";
      color = 'yellow';
    }
    else {
      text = "Отключено";
      color = 'red';
    }
  }
  return `<span data-value="${hubState}" style="color:${color};">${text}</span>`;
}