import { SendDataForOpenTab, FocusedOrCreateTabAndSendData } from './createwindow.js';
import './signalr.min.js';
export class HubConnect {
  constructor(callServiceWorker) {
    this.currentUrl = "";
    this.hub = null;
    this.countError = 0;
    this.callServiceWorker = callServiceWorker;
    this.stateConnect = signalR.HubConnectionState.Disconnected;
  }
  createHubForUrl(forUrl) {
    try {
      if (this.currentUrl != forUrl) {
        this.currentUrl = forUrl;
        this.removeHub();

        if (this.currentUrl)
          this.createConnect();
      }
      if (!this.hub && forUrl) {
        this.currentUrl = forUrl;
        this.createConnect();
      }
    }
    catch (e) {
      console.error(e);
    }
  }
  getStateHub() {
    return this.stateConnect;
  }
  createConnect() {
    this.hub = new signalR.HubConnectionBuilder().withUrl(`https://${this.currentUrl}/CommunicationHub`, {
      headers: { "Content-Encoding": "ru" },
      transport: signalR.HttpTransportType.WebSockets
    }).configureLogging(signalR.LogLevel.None).build();

    this.hub.on("Fire_ShowMessage", async (data) => {
      try {
        if (self.Notification.permission == "granted") {
          if (data.message) {
            let forUrl = `currentnotification.html`;
            navigator.locks.request(
              "Fire_ShowMessage",
              { mode: "exclusive" },
              async (lock) => {
                const arrayItems = [];
                var currentMessage = await chrome.storage.local.get(["Fire_ShowMessage"]);
                Object.assign(arrayItems, currentMessage.Fire_ShowMessage);
                arrayItems.push({ host: this.currentUrl, data: data });
                await chrome.storage.local.set({ Fire_ShowMessage: arrayItems });
                await FocusedOrCreateTabAndSendData(forUrl, 400);
                this.callServiceWorker({ method: "Fire_ShowMessage", forFixedNotify: data.message, url: forUrl, detail: data });
              }
            );
          }
        }
      }
      catch (ex) {
        console.error("Fire_ShowMessage", ex);
      }
    });
    this.hub.on("Fire_StartSessionSubCu", async (data) => {
      try {
        if (data) {
          let forUrl = `startsessionsub.html`;
          navigator.locks.request(
            "Fire_StartSessionSubCu",
            { mode: "exclusive" },
            async (lock) => {
              const arrayItems = [];
              var currentMessage = await chrome.storage.local.get(["Fire_StartSessionSubCu"]);
              Object.assign(arrayItems, currentMessage.Fire_StartSessionSubCu);
              arrayItems.push({ host: this.currentUrl, data: data });
              await chrome.storage.local.set({ Fire_StartSessionSubCu: arrayItems });
              await FocusedOrCreateTabAndSendData(forUrl, 500, 1200);
            }
          );
        }
      }
      catch (ex) {
        console.error("Fire_StartSessionSubCu", ex);
      }
    });
    this.hub.on("Fire_AskForAcceptanceNotification", async (data) => {
      try {
        if (data.id) {
          let forUrl = `AcceptanceNotification.html?forUrl=${this.currentUrl}&id=${data.id}`;
          await FocusedOrCreateTabAndSendData(forUrl, 600, 600);
          await SendDataForOpenTab(forUrl, "Fire_AskForAcceptanceNotification", data);
        }
      }
      catch (ex) {
        console.error("Fire_AskForAcceptanceNotification", ex);
      }
    });
    this.hub.on("Fire_SetAcceptanceNotificationProcessed", async (data) => {
      try {
        if (data.id) {
          let forUrl = `AcceptanceNotification.html?forUrl=${this.currentUrl}&id=${data.id}`;
          await SendDataForOpenTab(forUrl, "Fire_SetAcceptanceNotificationProcessed", data);
        }
      }
      catch (ex) {
        console.error("Fire_SetAcceptanceNotificationProcessed", ex);
      }
    });
    this.hub.on("Fire_ForbiddenConnect", () => {
      try {
        console.warn("Нет разрешений для", this.currentUrl);
        this.hub.stop();
        this.hub.connection.onclose("Forbidden");
      }
      catch (ex) {
        console.error("Fire_ForbiddenConnect", ex);
      }
    });
    //this.hub.on("Fire_ChangeLanguage", async (data) => {
    //  try {
    //    if (data) {
    //      if (["ru-RU", "en-US"].includes(data))
    //        await chrome.storage.local.set({ language: data });
    //    }
    //  }
    //  catch (ex) {
    //    console.error("Fire_ChangeLanguage", ex);
    //  }
    //});
    this.hub.onreconnecting(error => {
      console.debug("Переподключение к", this.currentUrl);
      this.setEventHubState(error);
    });
    this.hub.onreconnected(connectionId => {
      console.debug("Переподключено к", this.currentUrl);
      this.setEventHubState(connectionId);
    });
    this.hub.onclose(error => {
      console.debug("Закрыто подключение к", this.currentUrl);
      this.setEventHubState(error);
    });
  }

  async startListenHub() {
    try {
      if (this.hub?.state == signalR.HubConnectionState.Disconnected) {
        try {
          this.hub.start().then(async () => {
            this.countError = 0;
            console.info("Подключено к", this.currentUrl);
            await this.setEventHubState(null);
          }).catch(async e => {
            console.debug("Ошибка подключения к", this.currentUrl, e.message);
            if (e.message && e.message.includes("Status code '403'")) {
              await this.setEventHubState("Forbidden");
            }
            else {
              if (this.countError == 0) {
                await this.setEventHubState(null);
                await this.callServiceWorker({ method: "errorConnect", url: this.currentUrl });
              }

              this.countError++;

              if (this.countError == 10) {
                this.countError = 0;
              }
            }
          });
        }
        catch (e) {
          console.error("Ошибка подключения к", e);
        }
      }
    }
    catch (e) {
      console.error("Ошибка подключения к", e);
    }
  }

  async setEventHubState(error) {
    try {
      let newState = this.hub?.state ?? signalR.HubConnectionState.Disconnected;
      if (error == "Forbidden") {
        newState = "Forbidden";
      }
      this.stateConnect = newState;
      await this.callServiceWorker({ method: "changeHubState", url: this.currentUrl, state: newState });
    }
    catch (e) {
      console.error("Error set hub state for url ", this.currentUrl, e);
    }
  }
  removeHub() {
    try {
      if (this.hub) {
        this.stopConnect();
        this.hub = null;
      }
    }
    catch (e) {
      console.error(e);
    }
  }
  stopConnect() {
    try {
      if (this.hub) {
        this.hub.stop();
      }
    }
    catch (e) {
      console.error(e);
    }
  }
}
