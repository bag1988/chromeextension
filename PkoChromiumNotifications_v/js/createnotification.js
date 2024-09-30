export async function ShowNotify(title, payload) {
  try {
    await navigator.locks.request(
      "localizationMessages",
      { mode: "exclusive" },
      async (lock) => {
        if (self.Notification.permission == "granted") {
          if (payload.forFixedNotify) {
            self.registration.showNotification(title, {
              icon: '/images/icon.svg',
              body: payload.forFixedNotify,
              vibrate: [100, 50, 100],
              requireInteraction: true,
              data: { url: payload.url, detail: payload.detail }
            });
          }
          else if (payload.SystemNotification) {
            self.registration.showNotification(title, {
              icon: '/images/icon.svg',
              body: payload.SystemNotification,
              vibrate: [100, 50, 100]
            });
          }
          else if (payload.noFixedNotify) {
            self.registration.showNotification(title, {
              icon: '/images/icon.svg',
              body: payload.noFixedNotify,
              data: { url: payload.url, detail: payload.detail }
            });
          }
        }
      }
    );
  }
  catch (e) {
    console.error("Error show notify", e.message);
  }
}