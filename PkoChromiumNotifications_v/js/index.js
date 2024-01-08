var getItemRequest =
{
  objID: { staffID: 0, subsystemID: 0, objID: 0 },
  lFrom: 0,
  lSortOrder: 0,
  bFlagDirection: 1,
  bstrFilter: "",
  numberPage: 0,
  countData: 200,
  nObjType: 0,
  skipItems: 0
};
var OBJ_ID = {
  StaffID: 0,
  SubsystemID: 0,
  ObjID: 0
}
var Timestamp = {
  seconds: 0,
  nanos: 0
}
var ServiceMessage =
{
  Id: 0,
  Date: new Date(),
  Message: "",
  Info: ""
};
const options = {
  // родитель целевого элемента - область просмотра
  root: null,
  // без отступов
  rootMargin: '0px',
  // процент пересечения - половина изображения
  threshold: 0.5
}
var DetailInfo;
// создаем наблюдатель
const observer = new IntersectionObserver((entries, observer) => {
  // для каждой записи-целевого элемента
  entries.forEach(entry => {
    // если элемент является наблюдаемым
    if (entry.isIntersecting) {
      let trLoad = entry.target;
      // прекращаем наблюдение
      observer.unobserve(trLoad);
      LoadData();
    }
  })
}, options);

var CUStartSitInfo =
{
  //насколько актуально
  StaffID: 0,  // ID ПУ от которого пришло сообщение о запуске оповещения
  UnitID: OBJ_ID,   // ID инициатора оповещения
  SessID: 0,   // ID сеанса оповещения
  SitID: OBJ_ID,    // ID запущеного сценария
  //end

  MsgID: OBJ_ID,    // ID сообщения, используемого в сценарии
  SessBeg: Timestamp,      // Время начала сеанса оповещения
  Info: "",             // Дополнительная информация для отображения
  StaffName: "",        // Наименование ПУ, на котором производится запуск оповещения
  ControlUnitName: "",  // Наименование инициатора исполняемого оповещения
  SitName: "",          // Наименование исполняемого сценария оповещения
  MessageName: "",      // Наименование сообщения
  MessageText: ""      // Текст сообщения (для текстовых сообщений)
};
var CurrentArray = [];
var SelectArray = [];
var CurrentUrl;

window.onload = async () => {
  var result = await chrome.storage.local.get(["urlConnect"]);
  if (result && result.urlConnect) {
    CurrentUrl = result.urlConnect;
    document.title = `Журнал системных уведомлений ПКО: ${result.urlConnect}`;
  }
  chrome.storage.onChanged.addListener((object, areaName) => {
    if (areaName == "local") {
      if (object.urlConnect && object.urlConnect.newValue != object.urlConnect.oldValue) {
        ReloadPage();
      }
    }
  });
  await LoadData();
  if (document.querySelector("[name=ClearAll]")) {
    document.querySelector("[name=ClearAll]").onclick = ClearAll;
  }
  if (document.querySelector("[name=deleteSelect]")) {
    document.querySelector("[name=deleteSelect]").onclick = DeleteSelectItems;
  }

  if (document.querySelector(".table-pointer tbody")) {
    document.querySelector(".table-pointer tbody").onclick = SetSelectItem;
    document.querySelector(".table-pointer tbody").ondblclick = ViewDetailDialog;
  }
  if (document.querySelector("button[name=detail]")) {
    document.querySelector("button[name=detail]").onclick = ViewDetailDialog;
  }
}

function ViewDetailDialog() {
  try {
    if (SelectArray.length == 1 && DetailInfo) {
      document.getSelection().removeAllRanges();
      CreateDialog(SelectArray[0]?.Message, `
      <div class="p-4 grid">
              <div class="grid-col-5"><b>Подконтрольный ПУ</b></div>  
              <div class="grid-col-7">${DetailInfo.StaffName}</div>  
                       
              <div class="grid-col-5"><b>Инициатор запуска</b></div>  
              <div class="grid-col-7">${DetailInfo.ControlUnitName}</div>
  
              <div class="grid-col-5"><b>Начало оповещения</b></div>  
              <div class="grid-col-7">${new Date(DetailInfo.SessBeg?.seconds * 1000 + Math.round(DetailInfo.SessBeg?.nanos / 1000000)).toLocaleString()}</div>
  
              <div class="grid-col-5"><b>Подсистема</b></div>  
              <div class="grid-col-7">${GetSubSystemName(DetailInfo.SitID?.SubsystemID)}</div>
  
              <div class="grid-col-5"><b>Наименование сценария</b></div>  
              <div class="grid-col-7">${DetailInfo.SitName}</div>
              
              <div class="grid-col-5"><b>Наименование сообщения</b></div>  
              <div class="grid-col-7">${DetailInfo.MessageName}</div>
  
              <div class="grid-col-12">
                  <p>
                      <audio controls="controls" class="d-none" preload="metadata" title="${DetailInfo.MessageName}" src="https://${CurrentUrl}/api/v1/GetSoundServer?MsgId=${DetailInfo.MsgID.ObjID}&Staff=${DetailInfo.MsgID.StaffID}&System=33&version=${new Date().getSeconds()}" type="audio/wav"/>       
                  </p> 
              </div>      
       </div>           
      `);
    }
  }
  catch (e) {
    console.log(e);
  }
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

async function DeleteSelectItems(e) {
  try {
    e.currentTarget.insertAdjacentHTML("afterbegin", `<span class="spinner-border spinner-border-sm me-2"></span>`);
    if (SelectArray.length > 0) {
      let listIntID = [];
      for (var item of SelectArray) {
        listIntID.push({ id: item.Id });
      }
      let result = await fetch(`https://${CurrentUrl}/api/v1/DeleteServiceLogs`, {
        method: "post", headers: {
          "Content-Type": "application/json"
        }, body: JSON.stringify(listIntID)
      });
      ReloadPage();
    }
  }
  catch (e) {
    console.log(e);
  }
}

function CreateDialog(title, bodyHtml) {
  let body = `<dialog class="dialog">
                <div class="content-dialog">
                <h3 class="header-top b-radius"><span title="Закрыть" style="cursor: pointer;color: rgb(150 0 0); float:right;">X</span>${title}</h3>
                ${bodyHtml}
                </div>
                <div class="buttons-group p-4">
                    <button name="cancel" type="reset" class="form-button btn-outline-primary">Закрыть</button>
                </div>
              </dialog>`;
  document.body.insertAdjacentHTML("beforeend", body);
  let dialog = document.body.querySelector("dialog");
  if (dialog) {
    dialog.showModal();
    if (dialog.querySelector("button[name=cancel]")) {
      dialog.querySelector("button[name=cancel]").onclick = CloseDialog;
    }
    if (dialog.querySelector("h3>span")) {
      dialog.querySelector("h3>span").onclick = CloseDialog;
    }
    if (dialog.querySelector("audio")) {
      dialog.querySelector("audio").onerror = (e) => {
        e.currentTarget.parentNode.removeChild(e.currentTarget);
      };
      dialog.querySelector("audio").oncanplay = (e) => {
        e.currentTarget.classList.remove("d-none");
      };      
    }
  }
}

function CloseDialog(e) {
  let d = e.currentTarget.closest("dialog");
  if (d) {
    d.close();
    document.body.removeChild(d);
  }
}

function RemoveDialog() {
  let currentDialog = document.body.querySelector(".dialog");
  if (currentDialog) {
    document.body.removeChild(currentDialog);
  }
}
function SetSelectItem(event) {
  if (event.shiftKey) {
    document.getSelection().removeAllRanges();
  }
  if (!event.ctrlKey && !event.shiftKey) {
    document.querySelectorAll(".table-pointer tbody tr")?.forEach(e => {
      e.classList.remove("bg-select");
    });
    SelectArray = [];
  }
  let tr = event.target;
  if (tr.constructor == HTMLTableCellElement) {
    tr = tr.parentNode;
  }
  if (tr.constructor == HTMLTableRowElement) {
    let id = tr.getAttribute("data-value");
    let findElem = CurrentArray.find(e => e.Id == id);
    if (findElem) {
      if (!SelectArray.includes(findElem)) {
        if (!event.shiftKey) {
          tr.classList.add("bg-select");
          SelectArray.push(findElem);
        }
        else {
          try {
            var trArray = document.querySelectorAll(".table-pointer tbody tr");
            if (trArray?.length > 0) {
              var stratTr = document.querySelector(`.table-pointer tbody tr[data-value="${SelectArray.at(-1)?.Id}"]`);
              let startIndex = [...trArray].indexOf(stratTr) + 1;
              let endIndex = [...trArray].indexOf(tr) + 1;
              if (startIndex > endIndex) {
                let tmp = endIndex;
                endIndex = startIndex - 1;
                startIndex = tmp - 1;
              }
              let selectTrArray = [...trArray].slice(startIndex, endIndex);
              if (selectTrArray) {
                selectTrArray.forEach(e => {
                  e.classList.add("bg-select");
                  let attr = e.getAttribute("data-value");
                  let findElem = CurrentArray.find(e => e.Id == attr);
                  if (!SelectArray.includes(findElem)) {
                    SelectArray.push(findElem);
                  }
                });
              }
            }
          }
          catch (e) {
            console.log(e);
          }
        }
      }
      else {
        tr.classList.remove("bg-select");
        SelectArray = SelectArray.filter(v => v !== findElem);
      }
    }
  }
  ReadSelectInfoField();
}

async function ReadSelectInfoField() {
  try {
    if (SelectArray.length == 1) {
      let buttonDetails = document.querySelector("button[name=detail]");
      DetailInfo = null;
      buttonDetails.classList.add("d-none");
      if (buttonDetails) {
        let firstElm = SelectArray[0];
        if (firstElm.Info) {
          var buffer = [];
          protobuf.util.base64.decode(firstElm.Info, buffer, 0);
          DetailInfo = CUStartSitInfo_decode(buffer);
          buttonDetails.classList.remove("d-none");
        }
      }
    }
    let deleteSelect = document.querySelector("button[name=deleteSelect]");
    if (deleteSelect) {
      if (SelectArray.length > 0) {
        deleteSelect.classList.remove("d-none");
      }
      else {
        deleteSelect.classList.add("d-none");
      }
    }


  }
  catch (e) {
    console.log(e);
  }
  return null;
}
function Timestamp_decode(r, l) {
  if (!(r instanceof protobuf.Reader))
    r = protobuf.Reader.create(r)
  var c = l === undefined ? r.len : r.pos + l, m = Timestamp
  while (r.pos < c) {
    var t = r.uint32()
    switch (t >>> 3) {
      case 1: {
        m.seconds = r.int64()
        break
      }
      case 2: {
        m.nanos = r.int32()
        break
      }
      default:
        r.skipType(t & 7)
        break
    }
  }
  return m
}
function OBJ_ID_decode(r, l) {
  if (!(r instanceof protobuf.Reader))
    r = protobuf.Reader.create(r)
  var c = l === undefined ? r.len : r.pos + l, m = OBJ_ID
  while (r.pos < c) {
    var t = r.uint32()
    switch (t >>> 3) {
      case 1: {
        m.StaffID = r.int32()
        break
      }
      case 2: {
        m.SubsystemID = r.int32()
        break
      }
      case 3: {
        m.ObjID = r.int32()
        break
      }
      default:
        r.skipType(t & 7)
        break
    }
  }
  return m
}
function CUStartSitInfo_decode(r, l) {
  if (!(r instanceof protobuf.Reader))
    r = protobuf.Reader.create(r)
  var c = l === undefined ? r.len : r.pos + l, m = CUStartSitInfo
  while (r.pos < c) {
    var t = r.uint32()
    switch (t >>> 3) {
      case 1: {
        m.StaffID = r.int32()
        break
      }
      case 2: {
        m.UnitID = OBJ_ID_decode(r, r.uint32())
        break
      }
      case 3: {
        m.SessID = r.int32()
        break
      }
      case 4: {
        m.SitID = OBJ_ID_decode(r, r.uint32())
        break
      }
      case 5: {
        m.MsgID = OBJ_ID_decode(r, r.uint32())
        break
      }
      case 6: {
        m.SessBeg = Timestamp_decode(r, r.uint32())
        break
      }
      case 7: {
        m.info = r.string()
        break
      }
      case 8: {
        m.StaffName = r.string()
        break
      }
      case 9: {
        m.ControlUnitName = r.string()
        break
      }
      case 10: {
        m.SitName = r.string()
        break
      }
      case 11: {
        m.MessageName = r.string()
        break
      }
      case 12: {
        m.MessageText = r.string()
        break
      }
      default:
        r.skipType(t & 7)
        break
    }
  }
  return m
}


function ReloadPage() {
  window.location = "/index.html";
}
async function LoadData() {
  AddLoadObj(2);
  let result = await fetch(`https://${CurrentUrl}/api/v1/GetItems_IServiceMessages`, {
    method: "post", headers: {
      "Content-Type": "application/json"
    }, body: JSON.stringify(getItemRequest)
  });
  try {
    if (result) {
      let newData = await result.json();
      if (newData?.Array?.length > 0) {
        CurrentArray = CurrentArray.concat(newData.Array);
        RemoveLoadObj();
        WriteRow(newData.Array);
        getItemRequest.skipItems += newData.Array.length;
        if (getItemRequest.countData == newData.Array.length) {
          let trLoad = document.querySelector('.table tbody tr:last-child')
          observer.observe(trLoad);
        }
      }
    }
  }
  catch (e) {
    console.log(e);
  }

  if (CurrentArray.length == 0) {
    WriteNoData(2);
  }
}

function WriteRow(data) {
  var tbody = document.querySelector("tbody");
  if (tbody) {
    if (data?.length > 0) {
      for (let item of data) {
        let rowHtml = `<tr data-value="${item.Id}">
                          <td>${new Date(item.Date).toLocaleString()}</td>
                          <td>${item.Message}</td>
                        </tr>`;
        tbody.insertAdjacentHTML("beforeend", rowHtml);
      }
    }
  }
}


function bin2String(array) {
  var result = "";
  for (var i = 0; i < array.length; i++) {
    result += String.fromCharCode(parseInt(array[i], 2));
  }
  return result;
}

function ClearAll() {
  alert("Clear");
  CurrentArray = null;
  WriteNoData(2);
  // fetch(`https://${CurrentUrl}/api/v1/ClearServiceLogs`).then(x=>{
  //   CurrentArray = null;
  //   WriteNoData(2);
  // });
}

function WriteNoData(colspan) {
  var tbody = document.querySelector("tbody");
  if (tbody) {
    tbody.innerHTML = `<tr><td class="bg-warning" colspan="${colspan}">Нет данных</td></tr>`;
  }
}
function AddLoadObj(colspan) {
  var tbody = document.querySelector("tbody");
  if (tbody) {
    tbody.insertAdjacentHTML("beforeend", `<tr name="loadTr"><td class="bg-blue" colspan="${colspan}">Загрузка...</td></tr>`);
  }
}

function RemoveLoadObj() {
  let loadObj = document.querySelector("[name=loadTr]");
  if (loadObj) {
    loadObj.parentNode.removeChild(loadObj);
  }
}