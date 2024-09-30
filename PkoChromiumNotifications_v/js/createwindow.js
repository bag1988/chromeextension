async function FocusedOrCreateTab(forIp, forPage, height = 700, width = 1000) {
  try {
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
        try {
          console.debug("Отправка сообщение воспроизведения звука");
          await chrome.runtime.sendMessage({ method: "playSound" });
        }
        catch (ex) {
          console.error("Ошибка отправки сообщения воспроизведения звука", ex);
        }
        chrome.tabs.onRemoved.addListener(function listener(tabId, info) {
          if (tabId === window.tabs[0].id) {
            console.debug("Сработало событие закрытия окна, отправлено сообщение остановки воспроизведения звука");
            chrome.tabs.onRemoved.removeListener(listener);
            chrome.runtime.sendMessage({ method: "stopSound" });
          }
        });
      }
    }
    return findTab;
  }
  catch (e) {
    console.error(e);
  }
}

export async function SendDataForOpenTab(forPage, method, data) {
  try {
    let forUrl = `chrome-extension://${chrome.runtime.id}/${forPage}`;
    await navigator.locks.request(
      forUrl,
      { mode: "exclusive" },
      async (lock) => {
        let findTabs = await chrome.tabs.query({ url: forUrl });
        if (findTabs.length > 0) {
          var tab = findTabs[0];
          if (tab) {
            if (tab.status == "complete") {
              await chrome.tabs.sendMessage(tab.id, { method: method, detailInfo: data });
            }
            else {
              chrome.tabs.onUpdated.addListener(async function listenerCompleteTab(tabId, info) {
                if (info.status === 'complete' && tabId === tab.id) {
                  chrome.tabs.onUpdated.removeListener(listenerCompleteTab);
                  await chrome.tabs.sendMessage(tabId, { method: method, detailInfo: data });
                }
              });
            }
          }
        }
      }
    );        
  }
  catch (e) {
    console.error(e);
  }
}

export async function FocusedOrCreateTabAndSendData(url, height = 700, width = 1000) {
  await navigator.locks.request(
    url,
    { mode: "exclusive" },
    async (lock) => {
      if (!await IsOpenTabForPageAndType("TAB", url.split(".html")[0])) {
        await FocusedOrCreateTab(chrome.runtime.id, url, height, width);
      }
    }
  );
}

export async function IsOpenTabForPageAndType(type, page) {
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: [type],
      documentOrigins: [`chrome-extension://${chrome.runtime.id}`]
    });
    if (contexts.length > 0) {
      return contexts.some(x => x.documentUrl.includes(`chrome-extension://${chrome.runtime.id}/${page}.html`));
    }
  } else {
    const matchedClients = await clients.matchAll();
    let first = await matchedClients.find(client => {
      client.url.includes(`chrome-extension://${chrome.runtime.id}/${page}.html`);
    });
    if (first) {
      return true;
    }
  }
  return false;
}
