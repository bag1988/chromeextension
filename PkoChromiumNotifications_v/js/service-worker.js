import { ShowNotify } from './createnotification.js';
import { HubConnect } from './classhubconnect.js';

var HasOffscreen;

var HubConnects = [];

//для обновления расширения
var updateInterval = setInterval(async () => {
  try {
    console.trace("Start check version extension");
    let update_url = new URL(chrome.runtime.getManifest().update_url);
    if (update_url.origin) {
      let result = await fetch(`${update_url.origin}/api/v1/CheckVersionExtensions`, {
        method: "post", headers: {
          "Content-Type": "application/json"
        }, body: JSON.stringify(chrome.runtime.getManifest().version)
      }).catch((e) => {
        console.error(`Метод "CheckVersionExtensions" не найден или не доступен!`, e);
      });
      if (result) {
        let isHaveUpdate = await result?.json();
        console.trace("Result check version extension", isHaveUpdate);
        if (isHaveUpdate) {
          StartUpdateExtension();
        }
      }
    }
  }
  catch (e) {
    console.error(e);
  }
}, 60e3);


function CreateConnect() {
  chrome.storage.local.get().then((result) => {
    let urlConnects = result.urlConnects;
    let hubStates = result.hubStates;

    hubStates = hubStates?.filter(x => urlConnects?.some(u => u.url == x.url) ?? false);

    let exceptItems = HubConnects.filter(x => !urlConnects?.some(i => x.url == i.url) ?? true);
    HubConnects = HubConnects.filter(x => urlConnects?.some(i => x.url == i.url) ?? false);
    if (urlConnects?.length > 0) {
      for (let item of urlConnects) {
        let findElem = HubConnects.find(e => e.url == item.url)
        if (findElem) {
          if (findElem.hub && findElem.hub.getStateHub() == "Disconnected" && item.enabled) {
            findElem.hub.startListenHub();
          }
          else if (findElem.hub && item.enabled != true) {
            findElem.hub.stopConnect();
          }
          findElem.enabled = item.enabled;
        }
        else {
          AddNewHub(item.url, item.enabled);
        }
      }
    }
    if (exceptItems.length > 0) {
      console.trace("Remove items hub", exceptItems);
      while (exceptItems.length > 0) {
        let item = exceptItems.pop();
        item.hub.removeHub();
      }
    }
    chrome.storage.local.set({ hubStates: hubStates });
  });
}

function AddNewHub(url, enabled) {
  if (!HubConnects.some(x => x.url == url)) {
    console.trace("Add new connect for", url);
    let newHub = new HubConnect();
    let newItem = { hub: newHub, url: url, enabled: enabled };
    HubConnects.push(newItem);
    newItem.hub.createHubForUrl(url);
    if (enabled) {
      newItem.hub.startListenHub();
    }
  }
}

chrome.action.onClicked.addListener(() => {

});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason == chrome.runtime.OnInstalledReason.INSTALL) {
    let update_url = new URL(chrome.runtime.getManifest().update_url);
    if (update_url.host) {
      let urlConnects = [{ url: update_url.host, enabled: true }];
      chrome.storage.local.set({ urlConnects: urlConnects });     
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
          console.error(has, e);
          ShowNotify({ SystemNotification: 'Ошибка запуска "Системные уведомления ПКО"' });
        }
      }
    }
  }
  catch (ex) {
    console.error("Error create offscreen");
  }
}

chrome.runtime.onStartup.addListener(CreateOffscreen);

CreateOffscreen();

chrome.runtime.onMessage.addListener((e) => {
  if (e.method == "keepAlive") {
    CreateConnect();
  }
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  try {
    chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.error(er);
  }
});
self.addEventListener('notificationclose', (event) => {
  try {
    chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.error(er);
  }
});


chrome.notifications.onClicked.addListener(async (id) => {
  try {
    chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.error(er);
  }
  chrome.notifications.clear(id);
});
chrome.notifications.onClosed.addListener(() => {
  try {
    chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.error(er);
  }
});
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  try {
    chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.error(er);
  }
});

chrome.storage.onChanged.addListener((object, areaName) => {
  try {
    if (areaName == "local") {
      if (object.urlConnects && object.urlConnects.newValue != object.urlConnects.oldValue) {
        CreateConnect();
      }
      else if (object.hubStates && object.hubStates.newValue != object.hubStates.oldValue) {
        SetBadge();
      }
    }
  }
  catch (e) {
    console.error("Error change badge ", e);
  }
});
SetBadge();
async function SetBadge() {
  let result = await chrome.storage.local.get({ hubStates: [] });
  let hubStates = result.hubStates;
  if (hubStates) {
    if (hubStates.every(x => x.state == "Connected")) {
      chrome.action.setBadgeText({ text: " " });
      chrome.action.setBadgeBackgroundColor({
        color: "green"
      });
    }
    else if (hubStates.some(x => x.state == "Connecting")) {
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

function StartUpdateExtension() {
  console.trace("Start requestUpdateCheck ");
  chrome.runtime.requestUpdateCheck((e) => {
    console.trace("Result requestUpdateCheck ", e);
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
      }).then(() => console.trace("script injected"));
    }
  }
  catch (e) {
    console.error("Error connect active tab", e);
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