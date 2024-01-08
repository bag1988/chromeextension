var SelectArray;
var CurrentUrl;

chrome.runtime.onMessage.addListener((e) => {
  if (e.method == "Fire_StartSessionSubCu") {
    AddStartRow(e.detailInfo);
  }
});

window.onload = async () => {
  var result = await chrome.storage.local.get(["urlConnect"]);
  if (result && result.urlConnect) {
    CurrentUrl = result.urlConnect;
  }
  chrome.storage.onChanged.addListener((object, areaName) => {
    if (areaName == "local") {
      if (object.urlConnect && object.urlConnect.newValue != object.urlConnect.oldValue) {
        CurrentUrl = object.urlConnect.newValue;
      }
    }
  });

  if (document.querySelector(".table-pointer tbody")) {
    document.querySelector(".table-pointer tbody").onclick = SetSelectItem;
  }
  
  if (GetAudioPlayer()) {
    GetAudioPlayer().onerror = (e) => {
      e.currentTarget.classList.add("d-none");
    };
    GetAudioPlayer().oncanplay = (e) => {
      e.currentTarget.classList.remove("d-none");
    };
  }
}

function GetAudioPlayer() {
  return document.body.querySelector("tfoot audio");
}

function GetSubSystemName(systemID) {
  switch (systemID) {
    case 1:
      return "АСО";
    case 2:
      return "УУЗС";
    case 3:
      return "Система управления";
    case 4:
      return "П16x, ПДУ АСО";
    default:
      return "Нет такой подсистемы";
  }
}

function SetSelectItem(event) {

  let tr = event.target;
  if (tr.constructor == HTMLTableCellElement) {
    tr = tr.parentNode;
  }
  if (tr.constructor == HTMLTableRowElement) {
    let msgUrl = tr.getAttribute("data-value");
    if (SelectArray != tr) {
      document.querySelectorAll(".table-pointer tbody tr")?.forEach(e => {
        e.classList.remove("bg-select");
      });
      tr.classList.add("bg-select");
      SelectArray = tr;

      let tfoot = document.querySelector(".table-pointer tfoot");
      if (tfoot) {
        let player = GetAudioPlayer();
        if (player) {
          if (msgUrl) {
            player.src = msgUrl;
            tfoot.classList.remove("d-none");
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
      let rowHtml = `<tr ${detailInfo.msgID.objID > 0 ? `data-value="https://${CurrentUrl}/api/v1/GetSoundServer?MsgId=${detailInfo.msgID.objID}&Staff=${detailInfo.msgID.staffID}&System=33&version=${new Date().getSeconds()}"` : ""}">
                          <td>${detailInfo.staffName}</td>
                          <td>${detailInfo.controlUnitName}</td>
                          <td>${new Date(detailInfo.sessBeg?.seconds * 1000 + Math.round(detailInfo.sessBeg?.nanos / 1000000)).toLocaleString()}</td>
                          <td>${GetSubSystemName(detailInfo.sitID?.subsystemID)}</td>
                          <td>${detailInfo.sitName}</td>
                          <td>${detailInfo.messageName}</td>
                        </tr>`;
      tbody.insertAdjacentHTML("afterbegin", rowHtml);
    }
  }
}
