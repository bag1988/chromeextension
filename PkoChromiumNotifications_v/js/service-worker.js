import { FocusedOrCreateTab } from './createwindow.js';
import { ShowNotify } from './createnotification.js';
import * as con from './hubconnect.js';

var hubUrlCurrent;
var HasOffscreen;

var updateInterval = setInterval(async () => {
  try {
    console.log("Start check version extension");
    let state = await chrome.storage.local.get(["hubState"]);
    if (state.hubState == "Connected") {
      let update_url = new URL(chrome.runtime.getManifest().update_url);
      if (update_url.origin) {
        let result = await fetch(`${update_url.origin}/api/v1/CheckVersionExtensions`, {
          method: "post", headers: {
            "Content-Type": "application/json"
          }, body: JSON.stringify(chrome.runtime.getManifest().version)
        }).catch((e) => console.log(`Метод "CheckVersionExtensions" не найден или не доступен!`, e));
        let isHaveUpdate = await result?.json();
        console.log("Result check version extension ", isHaveUpdate);
        if (isHaveUpdate) {
          StartUpdateExtension();
        }
      }
    }
  }
  catch (e) {
    console.log(e);
  }
}, 60e3);
function CreateConnect() {
  chrome.storage.local.get(["urlConnect"]).then((result) => {
    if (result.urlConnect) {
      hubUrlCurrent = result.urlConnect;
      con.ConnectHub(result.urlConnect);
    }
    else if (con.hub) {
      con.CloseConnect();
    }
  });
}

chrome.action.onClicked.addListener(() => {

});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason == chrome.runtime.OnInstalledReason.INSTALL) {
    let update_url = new URL(chrome.runtime.getManifest().update_url);
    if (update_url.hostname) {
      chrome.storage.local.set({ urlConnect: `${update_url.hostname}:8291` });
    }
  }
});

async function GetOffscreenDocument() {
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [`chrome-extension://${chrome.runtime.id}/offscreen.html`]
    });
    if (contexts.length > 0) {
      return contexts[0].contextId;
    }
  } else {
    const matchedClients = await clients.matchAll();
    let first = await matchedClients.find(client => {
      client.url.includes(`chrome-extension://${chrome.runtime.id}/offscreen.html`);
    });
    if (first) {
      return first.id;
    }
  }
  return null;
}

async function CreateOffscreen() {
  try {
    if (!HasOffscreen) {
      let has = await GetOffscreenDocument();
      if (!has) {
        HasOffscreen = true;
        try {
          if (!chrome.offscreen) {
            ShowNotify({ SystemNotification: "Установите версию Chromium не ниже 109." });
          }
          else {
            await chrome.offscreen.createDocument({
              url: 'offscreen.html',
              reasons: [chrome.offscreen.Reason.WORKERS || chrome.offscreen.Reason.IFRAME_SCRIPTING],
              justification: 'keep service worker running',
            });
          }
        }
        catch (e) {
          console.log(has, e);
          ShowNotify({ SystemNotification: 'Ошибка запуска "Системные уведомления ПКО"' });
        }
      }
    }
  }
  catch (ex) {
    console.log("Error create offscreen");
  }
}

chrome.runtime.onStartup.addListener(CreateOffscreen);

CreateOffscreen();
CreateConnect();

chrome.runtime.onMessage.addListener((e) => {
  if (e.method == "showWindow") {
    FocusedOrCreateTab(e.forIp, e.forPage, e.height, e.width);
  }
  else if (e.method == "showNotify" && e.json) {
    ShowNotify(JSON.parse(e.json));
  }
  else if (e.method == "keepAlive") {
    if (!con.hub) {
      CreateConnect();
    }
    if (con.hub && con.hub.state == "Disconnected") {
      con.StartHub();
    }
  }
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  try {
    chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.log(er);
  }
  //if (hubUrlCurrent) {
  //  if (event.notification.data.url == "index.html") {
  //    //await GetWindowClient(chrome.runtime.id, "index.html");
  //  }
  //  else {

  //  }
  //}

});
self.addEventListener('notificationclose', (event) => {
  try {
    chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.log(er);
  }
});


chrome.notifications.onClicked.addListener(async (id) => {
  try {
    chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.log(er);
  }
  chrome.notifications.clear(id);
  if (hubUrlCurrent && !id.includes("SystemNotification")) {
    await FocusedOrCreateTab(chrome.runtime.id, "index.html");
  }
});
chrome.notifications.onClosed.addListener(() => {
  try {
    chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.log(er);
  }
});
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  try {
    chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.log(er);
  }
});

chrome.storage.onChanged.addListener((object, areaName) => {
  if (areaName == "local") {
    if (object.urlConnect && object.urlConnect.newValue != object.urlConnect.oldValue) {
      hubUrlCurrent = object.urlConnect.newValue;
      con.ConnectHub(object.urlConnect.newValue);
    }
    else if (object.hubState && object.hubState.newValue != object.hubState.oldValue) {
      if (object.hubState.newValue == "Connected") {
        chrome.action.setBadgeText({ text: " " });//
        chrome.action.setBadgeBackgroundColor({
          color: "green"
        });
      }
      else if (object.hubState.newValue == "Connecting") {
        chrome.action.setBadgeText({ text: " " });
        chrome.action.setBadgeBackgroundColor({
          color: "yellow"
        });
      }
      else {
        chrome.action.setBadgeText({ text: " " });
        chrome.action.setBadgeBackgroundColor({
          color: "red"
        });
      }
    }
  }
});

function StartUpdateExtension() {
  console.log("Start requestUpdateCheck ");
  chrome.runtime.requestUpdateCheck((e) => {
    console.log("Result requestUpdateCheck ", e);
    if (e == "update_available") {
      chrome.runtime.reload();
    }
    else if (e == "throttled") {

      clearInterval(updateInterval);

      ShowErrorUpdate();
      setInterval(ShowErrorUpdate, 6e5);
    }
  });
}

async function ShowErrorUpdate() {
  ViewErrorUpdateInTab();
  ShowNotify({ SystemNotification: 'Ошибка обновления "Системные уведомления ПКО". Обновите расширение вручную' });
}
async function ViewErrorUpdateInTab() {
  try {

    let queryOptions = { active: true, lastFocusedWindow: true };
    let tab = await chrome.tabs.query(queryOptions);

    if (tab && tab.length > 0 && !tab[0].url.includes("chrome://")) {
      chrome.scripting.executeScript({
        target: {
          tabId: tab[0].id,
        },
        func: CreateAlert
      }).then(() => console.log("script injected"));
    }
  }
  catch (e) {
    console.log("Error connect active tab", e);
  }
}

function CreateAlert() {

  if (!document.body.querySelector("#errorUpdateExtension")) {
    let div = `<div id="errorUpdateExtension" style="position: fixed;
    right: 2rem;
    top: 1rem;
    padding: 1rem 1.5rem;
    animation: fadein 1s ease-out;
    z-index: 20;
    color: #000;
    background-color: #ffc107;
    border-color: #ffc107;
    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
    border-radius: 0.3rem;
    cursor:pointer;" onclick="document.body.removeChild(document.body.querySelector('#errorUpdateExtension'));">              
              Ошибка обновления "Системные уведомления ПКО". Обновите расширение вручную
            </div>`
    document.body.insertAdjacentHTML("afterbegin", div);
  }
}