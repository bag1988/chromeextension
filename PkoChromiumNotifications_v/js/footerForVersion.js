class footerVersion extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = `<text data-i18n="version"></text> <small>${chrome.runtime.getManifest().version}</small> <text id="stateText" class="mt-1 ms-2">
    <span class="spinner-border spinner-border-sm me-2"></span>
    <text data-i18n="loading"></text>
    </text>`;
  }

  async connectedCallback() {
    document.body.style.paddingBottom = this.offsetHeight + "px";
    await this.render();
    chrome.runtime.onMessage.addListener((e) => {
      if (e.method == "NewVersionIsAvailable") {
        let stateText = this.querySelector("#stateText");
        if (stateText) {
          stateText.classList.replace("text-green", "text-yellow");
          stateText.setAttribute("data-i18n", "newVersionAvailable");
          stateText.innerHTML = localization?.getMessage("newVersionAvailable") ?? chrome.i18n.getMessage("newVersionAvailable");
        }
      }
    });
  }
  async render() {
    let stateText = this.querySelector("#stateText");

    if (stateText) {
      let isHaveNewVersion = await this.checkUpdate();

      if (isHaveNewVersion) {
        stateText.classList.add("text-yellow");
        stateText.setAttribute("data-i18n", "newVersionAvailable");
        stateText.innerHTML = localization?.getMessage("newVersionAvailable") ?? chrome.i18n.getMessage("newVersionAvailable");
      }
      else {
        stateText.classList.add("text-green");
        stateText.setAttribute("data-i18n", "versionCurrent");
        stateText.innerHTML = localization?.getMessage("versionCurrent") ?? chrome.i18n.getMessage("versionCurrent");
      }
    }
  }

  async checkUpdate() {
    try {
      return await chrome.runtime.sendMessage({ method: "IsHaveNewVersion" });
    }
    catch (e) {
      console.error("Ошибка проверки обновления", e.message);
    }
    return false;
  }
}
customElements.define("footer-version", footerVersion, { extends: "footer" });