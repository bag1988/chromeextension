let SelectArray;

window.addEventListener("load", loadWindow);

async function loadWindow() {

  await initLocalization();

  var result = await chrome.storage.local.get(["Fire_StartSessionSubCu"]);
  if (result.Fire_StartSessionSubCu) {
    await WriteData(result.Fire_StartSessionSubCu);
  }
  chrome.storage.onChanged.addListener(async (object, areaName) => {
    try {
      if (areaName == "local") {
        if (object.Fire_StartSessionSubCu && object.Fire_StartSessionSubCu.newValue != object.Fire_StartSessionSubCu.oldValue) {
          await WriteData(object.Fire_StartSessionSubCu.newValue);
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
    "Fire_StartSessionSubCu",
    { mode: "exclusive" },
    async (lock) => {
      AddStartRow(data);
      await chrome.storage.local.remove(["Fire_StartSessionSubCu"]);
    }
  );
}

function GetAudioPlayer() {
  return document.body.querySelector("tfoot audio");
}

function SetSelectItem(event) {

  let tr = event.target;
  if (tr.constructor == HTMLTableCellElement) {
    tr = tr.parentNode;
  }
  if (tr.constructor == HTMLTableRowElement) {
    let msgUrl = tr.getAttribute("data-value");
    if (SelectArray != tr) {
      document.querySelectorAll(".table tbody tr")?.forEach(e => {
        e.classList.remove("bg-select");
      });
      tr.classList.add("bg-select");
      SelectArray = tr;

      let tfoot = document.querySelector(".table tfoot");
      if (tfoot) {
        let player = GetAudioPlayer();
        if (player) {
          if (msgUrl) {
            player.src = msgUrl;
            tfoot.classList.remove("d-none");
            player.load();
          }
          else {
            player.src = '';
            tfoot.classList.add("d-none");
          }
        }
      }
    }
  }
}

function AddStartRow(detailInfo) {
  var tbody = document.querySelector("tbody");
  if (tbody) {
    if (detailInfo) {
      for (var item of detailInfo) {
        if (item && item.data) {
          let tr = document.createElement("tr");
          let nowTime = Date.now();
          let otherTime = item.data.sessBeg?.seconds * 1000 + Math.round(item.data.sessBeg?.nanos / 1000000);
          tr.insertAdjacentHTML("afterbegin", `<td  data-type="datatime" data-value="${nowTime}">${new Date(nowTime).toLocaleString()}</td>
                                            <td>${item.host}</td>                         
                                            <td>${item.data.staffName}</td>
                                            <td>${item.data.controlUnitName}</td>
                                            <td data-type="datatime" data-value="${otherTime}">${new Date(otherTime).toLocaleString()}</td>
                                            <td data-i18n="${localization.getSubSystemKey(item.data.sitID?.subsystemID)}">${localization.getMessage(localization.getSubSystemKey(item.data.sitID?.subsystemID))}</td>
                                            <td>${item.data.sitName}</td>
                                            <td>${item.data.messageName}</td>`);
          if (item.data.msgID.objID > 0) {
            tr.setAttribute("data-value", `https://${item.host}/api/v1/GetSoundServer?MsgId=${item.data.msgID.objID}&Staff=${item.data.msgID.staffID}&System=33&version=${new Date().getSeconds()}`);
            tr.addEventListener("click", SetSelectItem);
            tr.classList.add("pointer");
          }
          tbody.appendChild(tr);
        }
      }
      UpdateTable();
      SortTable();
    }
  }
}
