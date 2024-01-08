
export async function FocusedOrCreateTab(forIp, forPage, height = 700, width = 1000) {
  try {
    let forUrl = `chrome-extension://${forIp}/${forPage}`;
    var windowsCurrent = await chrome.windows.getAll({});
    var allTabs = new Array();
    //получаем все вкладки во всех окнах
    if (windowsCurrent.length > 0) {
      for (const element of windowsCurrent) {
        allTabs = allTabs.concat(await chrome.tabs.query({ windowId: element.id }));
      }
    }
    if (allTabs.length > 0) {
      let newUrls;
      //ищем нужную страницу
      let foundElem = allTabs.find(t => t.url?.includes(forUrl));

      if (foundElem) {
        await chrome.tabs.update(foundElem.id, { "active": true });
        await chrome.windows.update(foundElem.windowId, { "focused": true });
        return foundElem;
      }
    }
    let window = await chrome.windows.create({ height: height, width: width, focused: true, url: forUrl, type: "popup" });

    if (forPage == "currentnotification.html") {
      chrome.tabs.onRemoved.addListener(function listener(tabId, info) {
        if (tabId === window.tabs[0].id) {
          chrome.tabs.onRemoved.removeListener(listener);
          chrome.runtime.sendMessage({ method: "stopSound" });
        }
      });
    }

    return window.tabs[0];
  }
  catch (e) {
    console.log(e);
  }
}

export async function GetWindowClient(forIp, forPage, height = 700, width = 1000) {
  try {
    let forUrl = `chrome-extension://${forIp}/${forPage}`;
    let clients = await self.clients.matchAll();
    if (clients?.length > 0) {
      let foundElem = clients.find(t => t.url?.includes(forUrl));
      if (foundElem) {       
        foundElem.focus();
      }
    }
    await chrome.windows.create({ height: height, width: width, focused: true, url: forUrl, type: "popup" });
  }
  catch (e) {
    console.log(e);
  }
}

export async function FocusedOrCreateTabAndSendData(url, data, height = 700, width = 1000) {
  let tab = await FocusedOrCreateTab(chrome.runtime.id, url, height, width);
  if (tab) {
    if (tab.status == "complete") {
      chrome.tabs.sendMessage(tab.id, { method: "Fire_StartSessionSubCu", detailInfo: data })
    }
    else {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === 'complete' && tabId === tab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.sendMessage(tab.id, { method: "Fire_StartSessionSubCu", detailInfo: data })
        }
      });
    }
  }
}