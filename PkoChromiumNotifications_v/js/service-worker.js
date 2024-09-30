import { ShowNotify } from './createnotification.js';
import { HubConnect } from './classhubconnect.js';
import { IsOpenTabForPageAndType } from './createwindow.js';
import { Manuali18n } from './Manuali18n.js';

var HasOffscreen;

var HubConnects = [];
let localization;
let NewVersionIsAvailable = false;
async function initLocalization() {
  if (!localization) {
    localization = new Manuali18n();
    await localization.init();
  }
}

//для обновления расширения
var updateInterval = setInterval(async () => {
  try {
    console.debug("Start check version extension");
    let update_url = new URL(chrome.runtime.getManifest().update_url);
    if (update_url.origin) {
      let result = await fetch(`${update_url.origin}/api/v1/CheckVersionExtensions`, {
        method: "post", headers: {
          "Content-Type": "application/json"
        }, body: JSON.stringify(chrome.runtime.getManifest().version)
      }).catch((e) => {
        console.error(`Метод "CheckVersionExtensions" не найден или не доступен!`, e.message);
      });
      if (result) {
        NewVersionIsAvailable = await result?.json();
        console.debug("Result check version extension", NewVersionIsAvailable);
        if (NewVersionIsAvailable) {
          StartUpdateExtension();
        }
      }
    }
  }
  catch (e) {
    console.error("Ошибка проверки обновления", e.message);
  }
}, 60e3);

function CreateConnect() {
  chrome.storage.local.get().then(async (result) => {
    let urlConnects = result.urlConnects;
    let exceptItems = HubConnects.filter(x => !urlConnects?.some(i => x.url == i.url) ?? true);
    HubConnects = HubConnects.filter(x => urlConnects?.some(i => x.url == i.url) ?? false);
    if (urlConnects?.length > 0) {
      for (let item of urlConnects) {
        let findElem = HubConnects.find(e => e.url == item.url)
        if (findElem) {
          if (findElem.hub && (findElem.hub.getStateHub() == "Disconnected" || findElem.hub.getStateHub() == "Forbidden") && item.enabled) {
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
      console.debug("Remove items hub", exceptItems);
      while (exceptItems.length > 0) {
        let item = exceptItems.pop();
        item.hub.removeHub();
      }
    }

  });
}

function AddNewHub(url, enabled) {
  if (!HubConnects.some(x => x.url == url)) {
    console.debug("Add new connect for", url);
    let newHub = new HubConnect(CallServiceWorker);
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

async function CreateOffscreen() {

  await initLocalization();

  try {
    if (!HasOffscreen) {
      let has = await IsOpenTabForPageAndType('OFFSCREEN_DOCUMENT', 'offscreen');
      if (!has) {
        HasOffscreen = true;
        try {
          if (!chrome.offscreen) {
            ShowNotify(localization.getMessage("extTitle"), { SystemNotification: `${localization.getMessage("errChromium109")}` });
          }
          else {
            await chrome.offscreen.createDocument({
              url: 'offscreen.html',
              reasons: [chrome.offscreen.Reason.WORKERS || chrome.offscreen.Reason.IFRAME_SCRIPTING],
              justification: 'keep service worker running'
            });
          }
        }
        catch (e) {
          console.error("Ошибка создания фоновой страницы", e);
          ShowNotify(localization.getMessage("extTitle"), { SystemNotification: `${localization.getMessage("errStartExtension")}` });
        }
      }
    }
  }
  catch (ex) {
    console.error("Error create offscreen", ex.message);
  }
}

chrome.runtime.onStartup.addListener(CreateOffscreen);

CreateOffscreen();

chrome.runtime.onMessage.addListener((e, sender, callBack) => {
  if (e.method == "keepAlive") {
    CreateConnect();
  }
  else if (e.method == "getAllState") {
    var response = HubConnects.map(x => {
      const result = {
        url: x.url,
        state: x.hub.getStateHub()
      }
      return result;
    });
    callBack(response);
  }
  else if (e.method == "IsHaveNewVersion") {
    callBack(NewVersionIsAvailable);
  }
});

async function CallServiceWorker(data) {
  try {
    if (data.method == "changeHubState") {
      SetBadge();
      let has = await IsOpenTabForPageAndType('POPUP', 'popup');
      if (has) {
        await chrome.runtime.sendMessage(data);
      }
    }
    else if (data.method == "errorConnect") {
      ShowNotify(localization.getMessage("extTitle"), { SystemNotification: `${localization.getMessage("errConnectServer")} ${data.url}` });
    }
    else if (data.method == "Fire_ShowMessage") {
      if (data.detail.localizationKey) {
        data.forFixedNotify = localization.getMessage(data.detail.localizationKey, data.detail.localizationArgs)
      }
      ShowNotify(localization.getMessage("extTitle"), data);
    }
  }
  catch (e) {
    console.error("Error set hub state", e);
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  try {
    //chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.error(er);
  }
});
self.addEventListener('notificationclose', (event) => {
  try {
    //chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.error(er);
  }
});


chrome.notifications.onClicked.addListener(async (id) => {
  try {
    // chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.error(er);
  }
  chrome.notifications.clear(id);
});
chrome.notifications.onClosed.addListener(() => {
  try {
    //chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.error(er);
  }
});
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  try {
    //chrome.runtime.sendMessage({ method: "stopSound" });
  }
  catch (er) {
    console.error(er);
  }
});

chrome.storage.onChanged.addListener(async (object, areaName) => {
  try {
    if (areaName == "local") {
      if (object.urlConnects && object.urlConnects.newValue != object.urlConnects.oldValue) {
        CreateConnect();
      }
      if (object.language && object.language.newValue != object.language.oldValue && localization) {
        await localization.reInit(object.language.newValue);
      }
    }
  }
  catch (e) {
    console.error("Error change badge ", e);
  }
});
SetBadge();
function SetBadge() {
  if (HubConnects) {
    if (HubConnects.every(x => x.hub.getStateHub() == "Connected")) {
      chrome.action.setBadgeText({ text: " " });
      chrome.action.setBadgeBackgroundColor({
        color: "green"
      });
    }
    else if (HubConnects.some(x => x.hub.getStateHub() == "Connecting")) {
      chrome.action.setBadgeText({ text: " " });
      chrome.action.setBadgeBackgroundColor({
        color: "yellow"
      });
    }
    else if (HubConnects.some(x => x.hub.getStateHub() == "Forbidden")) {
      chrome.action.setBadgeText({ text: " " });
      chrome.action.setBadgeBackgroundColor({
        color: "orange"
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
  console.debug("Start requestUpdateCheck ");
  chrome.runtime.requestUpdateCheck((e) => {
    console.debug("Result requestUpdateCheck ", e);
    if (e == "update_available") {
      chrome.runtime.reload();
    }
    else if (e == "throttled") {
      clearInterval(updateInterval);
      ShowErrorUpdate();
      setInterval(ShowErrorUpdate, 6e5);
      chrome.runtime.sendMessage({ method: "NewVersionIsAvailable" });
    }
  });
}

async function ShowErrorUpdate() {
  ShowNotify(localization.getMessage("extTitle"), { SystemNotification: `${localization.getMessage("errUpdateExtension")}` });
}