
window.addEventListener("load", loadWindow);

async function loadWindow() {

  await initLocalization();

  var result = await chrome.storage.local.get(["Fire_ShowMessage"]);
  if (result.Fire_ShowMessage) {
    await WriteData(result.Fire_ShowMessage);
  }

  chrome.storage.onChanged.addListener(async (object, areaName) => {
    try {
      if (areaName == "local") {
        if (object.Fire_ShowMessage && object.Fire_ShowMessage.newValue != object.Fire_ShowMessage.oldValue) {
          await WriteData(object.Fire_ShowMessage.newValue);
        }
      }
    }
    catch (e) {
      console.error("Error change badge ", e);
    }
  });
}
async function WriteData(data) {
  await navigator.locks.request(
    "Fire_ShowMessage",
    { mode: "exclusive" },
    async (lock) => {
      AddStartRow(data);
      await chrome.storage.local.remove(["Fire_ShowMessage"]);
    }
  );
}

function AddStartRow(detailInfo) {
  var tbody = document.querySelector("tbody");
  if (tbody) {
    if (detailInfo) {
      for (var item of detailInfo) {
        if (item.data && item.data.message) {
          let nowTime = Date.now();
          let rowHtml = `<tr class="white-space v-align-top">
                          <td data-type="datatime" data-value="${nowTime}">${new Date(nowTime).toLocaleString()}</td>
                          <td>${item.host}</td>                          
                          <td data-i18n="${!item.data.localizationKey ? "" : item.data.localizationKey}" data-i18n-args="${item.data.localizationArgs?.join('||')}">${localization.getMessage(!item.data.localizationKey ? item.data.message : item.data.localizationKey, item.data.localizationArgs)}</td >
                    </tr>`;
          tbody.insertAdjacentHTML("afterbegin", rowHtml);
        }
      }
      UpdateTable();
      SortTable();
    }
  }
}
