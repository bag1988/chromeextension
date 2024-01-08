import { FocusedOrCreateTabAndSendData } from './createwindow.js';
import { ShowNotify } from './createnotification.js';
import './signalr.min.js';
export var hub;
let currentUrl;
export function ConnectHub(forUrl) {
  try {
    if (currentUrl != forUrl) {
      currentUrl = forUrl;
      CloseConnect();
      if (currentUrl)
        StartConnect();
    }
    if (!hub && forUrl) {
      currentUrl = forUrl;
      StartConnect();
    }
  }
  catch (e) {
    console.log(e);
  }
}


function StartConnect() {
  hub = new signalR.HubConnectionBuilder().withUrl(`https://${currentUrl}/CommunicationHub`, { headers: { "Content-Encoding": "ru" } })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: retryContext => {
        if (retryContext.previousRetryCount < 1) {
          return 1000;
        } else if (retryContext.previousRetryCount < 2) {
          return 2000;
        }
        else if (retryContext.previousRetryCount < 3) {
          return 10000;
        }
        else {
          return 30000;
        }
      }
    }).build();
  hub.on("Fire_StartSessionSubCu", async function (data) {
    try {
      if (data) {
        await FocusedOrCreateTabAndSendData("manualpu.html", data, 400);
        ShowNotify({ noSoundMessage: `Запуск оповещения на подчиненном ПУ ${data.staffName} (${GetSubSystemName(data.sitID?.subsystemID)})`, url: "manualpu.html", detail: data });
      }
    }
    catch (ex) {
      console.log(ex);
    }
  });
  hub.on("Fire_ShowPushNotify", async function (data) {
    try {
      if (self.Notification.permission == "granted") {
        let detail = JSON.parse(data);
        await FocusedOrCreateTabAndSendData("currentnotification.html", detail, 400);        
        ShowNotify({ forSoundMessage: detail.message, url: "currentnotification.html", detail: detail });
      }
    }
    catch (ex) {
      console.log(ex);
    }
  });
  hub.on("Fire_ShowManualStart", function (data) {
    try {
      const queryString = new URLSearchParams(data).toString();
      let forUrl = `modal.html?method=p16&${queryString}`;
      let message = `Получена команда для исполнения ${data.commandName}`;
      chrome.windows.create({ height: 600, width: 600, focused: true, url: `chrome-extension://${chrome.runtime.id}/${forUrl}`, type: "popup" }, (w) => { });
    }
    catch (ex) {
      console.log(ex);
    }
  });

  hub.onreconnecting(error => {
    console.log("reconnecting");
    SetEventReconnect(error);
  });
  hub.onreconnected(connectionId => {
    console.log("reconnected");
    SetEventReconnect(connectionId);
  });
  hub.onclose(error => {
    console.log("close");
    SetEventReconnect(error);
  });
  if (hub?.state == signalR.HubConnectionState.Disconnected) {
    try {
      StartHub();
    }
    catch (e) {
      console.log(e);
      CloseConnect();
    }
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
export function StartHub() {
  try {
    hub.start().then(() => {
      chrome.storage.local.set({ hubState: hub?.state });
    });
  }
  catch (e) {
    console.log(e);
  }
}
function SetEventReconnect(error) {
  chrome.storage.local.set({ hubState: hub?.state });
}

export function CloseConnect() {
  try {
    chrome.storage.local.set({ hubState: signalR.HubConnectionState.Disconnected });
    if (hub) {
      hub.stop();
      hub = null;
    }
  }
  catch (e) {
    console.log(e);
  }
}