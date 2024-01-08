export async function ShowNotify(payload) {
  try {
    if (self.Notification.permission == "granted") {
      if (payload.forSoundMessage) {        
        self.registration.showNotification('Системные уведомления ПКО', {
          icon: '/images/icon.png',
          body: payload.forSoundMessage,
          vibrate: [100, 50, 100],
          requireInteraction: true,
          data: { url: payload.url, detail: payload.detail }
        });
        try {
          await chrome.runtime.sendMessage({ method: "playSound" });
        }
        catch (er) {
          console.log(er);
        }
      }
      else if (payload.SystemNotification) {       
        self.registration.showNotification('Системные уведомления ПКО', {
          icon: '/images/icon.png',
          body: payload.SystemNotification,
          vibrate: [100, 50, 100]
        });
      }
      else if (payload.noSoundMessage) {       
        self.registration.showNotification('Системные уведомления ПКО', {
          icon: '/images/icon.png',
          body: payload.noSoundMessage,
          data: { url: payload.url, detail: payload.detail }
        });
      }
    }
  }
  catch (e) {
    console.log(e);
  }
}