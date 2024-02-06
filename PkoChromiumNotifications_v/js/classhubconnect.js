import { RemoveTab, FocusedOrCreateTabAndSendData } from './createwindow.js';
import { ShowNotify } from './createnotification.js';
import './signalr.min.js';
export class HubConnect {
  constructor() {
    this.currentUrl = "";
    this.hub = null;
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
    return this.hub?.state ?? signalR.HubConnectionState.Disconnected
  }
  createConnect() {
    this.hub = new signalR.HubConnectionBuilder().withUrl(`https://${this.currentUrl}/CommunicationHub`, { headers: { "Content-Encoding": "ru" } }).configureLogging(signalR.LogLevel.None).build();
    this.hub.on("Fire_ShowMessage", async function (data) {
      try {
        if (self.Notification.permission == "granted") {
          if (data.message) {
            let forUrl = `currentnotification.html?forUrl=${new URL(this.baseUrl).host}`;
            await FocusedOrCreateTabAndSendData(forUrl, "Fire_ShowMessage", data, 400);
            ShowNotify({ forSoundMessage: data.message, url: forUrl, detail: data });
          }
        }
      }
      catch (ex) {
        console.error("Fire_ShowMessage", ex);
      }
    });
    this.hub.on("Fire_StartSessionSubCu", async function (data) {
      try {
        if (data) {
          let forUrl = `startsessionsub.html?forUrl=${new URL(this.baseUrl).host}`;
          await FocusedOrCreateTabAndSendData(forUrl, "Fire_StartSessionSubCu", data, 400);
        }
      }
      catch (ex) {
        console.error("Fire_StartSessionSubCu", ex);
      }
    });
    this.hub.on("Fire_AskForAcceptanceNotification", async function (data) {
      try {
        if (data.id) {
          let forUrl = `AcceptanceNotification.html?forUrl=${new URL(this.baseUrl).host}&id=${data.id}`;
          await FocusedOrCreateTabAndSendData(forUrl, "Fire_AskForAcceptanceNotification", data, 600, 600);
        }
      }
      catch (ex) {
        console.error("Fire_AskForAcceptanceNotification", ex);
      }
    });
    this.hub.on("Fire_SetAcceptanceNotificationProcessed", async function (data) {
      try {
        if (data.id) {
          let forUrl = `AcceptanceNotification.html?forUrl=${new URL(this.baseUrl).host}&id=${data.id}`;
          await RemoveTab(forUrl);
        }
      }
      catch (ex) {
        console.error("Fire_SetAcceptanceNotificationProcessed", ex);
      }
    });

    this.hub.onreconnecting(error => {
      console.trace("Reconnecting ws for ", this.currentUrl);
      this.setEventHubState(error);
    });
    this.hub.onreconnected(connectionId => {
      console.trace("Reconnected ws for ", this.currentUrl);
      this.setEventHubState(connectionId);
    });
    this.hub.onclose(error => {
      console.trace("Close ws for ", this.currentUrl);
      this.setEventHubState(error);
    });
  }
  startListenHub() {
    try {

      if (this.hub?.state == signalR.HubConnectionState.Disconnected) {
        try {
          this.hub.start().then(async () => {
            console.info("Start listen to", this.currentUrl);
            await this.setEventHubState(null);
          }).catch(async e => {
            console.trace("Error connect to ", this.currentUrl);
            ShowNotify({ SystemNotification: `Ошибка подключения к серверу уведомлений ${this.currentUrl}` });
            await this.setEventHubState(null);
          });
        }
        catch (e) {
          console.error(e);
        }
      }
    }
    catch (e) {
      console.error(e);
    }
  }
  async setEventHubState(error) {
    try {
      let result = await chrome.storage.local.get({ hubStates: [] });
      let hubStates = result.hubStates;
      if (hubStates && hubStates.some(x => x.url == this.currentUrl)) {
        let findItem = hubStates.find(x => x.url == this.currentUrl);
        if (this.hub != null) {
          if (findItem.state != this.hub.state) {
            findItem.state = this.hub.state;
          }
        }
        else {
          hubStates = hubStates.filter(x => x != findItem);
        }
      }
      else {
        hubStates.push({ url: this.currentUrl, state: this.hub?.state ?? signalR.HubConnectionState.Disconnected });
      }
      await chrome.storage.local.set({ hubStates: hubStates });
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
