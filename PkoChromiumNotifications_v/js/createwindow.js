
const CurrentLoadTab = new Map();

class LoadSendData {
  constructor(method, data) {
    this.method = method;
    this.data = data;
  }
}

class TabForUrl {
  constructor() {
    this.tabId = null;
    this.loadData = [];
  }
  setTabId(tabId) {
    this.tabId = tabId;
  }
  addData(loadSendData) {
    this.loadData.push(loadSendData);
  }
  getLoadData() {
    return this.loadData;
  }
}

async function FocusedOrCreateTab(forIp, forPage, height = 700, width = 1000) {
  try {
    if (!CurrentLoadTab.has(forPage)) {
      CurrentLoadTab.set(forPage, new TabForUrl());
    }
    else {
      return null;
    }

    let forUrl = `chrome-extension://${forIp}/${forPage}`;

    let findTabs = await chrome.tabs.query({ url: forUrl });

    let findTab;

    if (findTabs.length > 0) {
      findTab = findTabs[0];
      await chrome.tabs.update(findTab.id, { "active": true });
      await chrome.windows.update(findTab.windowId, { "focused": true });
      return findTab;
    }
    else {
      let window = await chrome.windows.create({ height: height, width: width, focused: true, url: forUrl, type: "popup", left: 50, top: 50 });
      findTab = window.tabs[0];

      if (forPage == "currentnotification.html") {
        chrome.tabs.onRemoved.addListener(function listener(tabId, info) {
          if (tabId === window.tabs[0].id) {
            chrome.tabs.onRemoved.removeListener(listener);
            chrome.runtime.sendMessage({ method: "stopSound" });
          }
        });
      }
    }
    return findTab;
  }
  catch (e) {
    if (CurrentLoadTab.has(forPage)) {
      CurrentLoadTab.delete(forPage);
    }
    console.error(e);
  }
}

export async function RemoveTab(forPage) {
  try {
    if (CurrentLoadTab.has(forPage)) {
      CurrentLoadTab.delete(forPage);
    }
    let forUrl = `chrome-extension://${chrome.runtime.id}/${forPage}`;

    let findTabs = await chrome.tabs.query({ url: forUrl });

    if (findTabs.length > 0) {
      await chrome.tabs.remove(findTabs[0].id);
    }
  }
  catch (e) {
    console.error(e);
  }
}

async function sendToTabData(tabId, method, data, forUrl) {
  try {
    if (forUrl) {
      if (CurrentLoadTab.has(forUrl)) {
        const currentArray = CurrentLoadTab.get(forUrl).getLoadData();
        CurrentLoadTab.delete(forUrl);
        for (var item of currentArray) {
          await chrome.tabs.sendMessage(tabId, { method: item.method, detailInfo: item.data });
        }
      }
    } else {
      await chrome.tabs.sendMessage(tabId, { method: method, detailInfo: data });
    }
  }
  catch (e) {
    console.error(e);
  }
}

async function SendData(tab, method, data, forUrl) {
  try {
    if (CurrentLoadTab.has(forUrl)) {
      CurrentLoadTab.get(forUrl).addData(new LoadSendData(method, data));
    }
    if (tab) {
      if (tab.status == "complete") {
        await sendToTabData(tab.id, method, data, forUrl);
      }
      else {
        chrome.tabs.onUpdated.addListener(async function listener(tabId, info) {
          if (info.status === 'complete' && tabId === tab.id) {
            chrome.tabs.onUpdated.removeListener(listener);
            await sendToTabData(tab.id, method, data, forUrl);
          }
        });
      }
    }
  }
  catch (e) {
    console.error(e);
  }
}

export async function FocusedOrCreateTabAndSendData(url, method, data, height = 700, width = 1000) {
  let tab = await FocusedOrCreateTab(chrome.runtime.id, url, height, width);
  await SendData(tab, method, data, url);
}
