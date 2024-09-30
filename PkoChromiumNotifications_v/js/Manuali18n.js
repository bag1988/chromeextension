import "./days.js";
import relativeTime from "./plugin/relativeTime/index.js";
import updateLocale from "./plugin/updateLocale/index.js";
import localeRu from './locale/ru.js';
import localeEn from './locale/en.js';
import localeUz from './locale/uz.js';
import localeUzLatn from './locale/uz-latn.js';

export class Manuali18n {
  constructor() {
    this.localizationMessages = null;
    this.currentLocalization = null;
    dayjs.extend(relativeTime);
    dayjs.extend(updateLocale);
  }
  async init() {
    try {
      //dayjs.updateLocale('ru', {
      //  relativeTime: {
      //    future: "in %s",
      //    past: "%s ago",
      //    s: 'a few seconds',
      //    m: "a minute",
      //    mm: "%d minutes",
      //    h: "an hour",
      //    hh: "%d hours",
      //    d: "a day",
      //    dd: "%d days",
      //    M: "a month",
      //    MM: "%d months",
      //    y: "a year",
      //    yy: "%d years"
      //  }
      //})
      //console.log(dayjs(new Date()).locale(localeRu).from());
      this.currentLocalization = (await chrome.storage.local.get("language"))?.language;
      if (this.currentLocalization) {
        await this.reInit(this.currentLocalization);
      }
    }
    catch (e) {
      console.error("Ошибка инициализации локализации", e.message);
    }
  }
  async reInit(value) {
    try {
      if (value) {
        value = value.split('-')[0];
        let urlFile = chrome.runtime.getURL(`_locales/${value}/messages.json`);
        let result = await fetch(urlFile);
        if (result) {
          this.localizationMessages = await result.json();
        }
      }
      else {
        this.localizationMessages = null;
      }
    }
    catch (e) {
      console.error("Ошибка преинициализации локализации", e.message);
    }
  }
  replaceDom() {
    try {
      document.querySelectorAll('[data-i18n]')?.forEach(x => {
        let valAttribute = x.getAttribute('data-i18n');
        if (valAttribute) {
          let args = x.getAttribute('data-i18n-args')?.split('||');
          let textLocalization = this.getMessage(valAttribute, args);
          x.textContent = textLocalization;
          if (x.hasAttribute('data-i18n-title')) {
            x.title = textLocalization;
          }
        }
      });
      document.querySelectorAll('[data-i18n-placeholder]')?.forEach(x => {
        x.placeholder = this.getMessage(x.getAttribute('data-i18n-placeholder'));
      });
      document.querySelectorAll('[data-i18n-after]')?.forEach(x => {
        x.after(this.getMessage(x.getAttribute('data-i18n-after')));
      });
    }
    catch (e) {
      console.error("Ошибка перевода документа", e.message);
    }
  }

  getMessage(value, args) {
    try {
      let response = null;
      let curLoc = this.currentLocalization;

      if (!curLoc) {
        curLoc = chrome.i18n.getUILanguage();
      }

      for (let item in args) {
        if (args[item].includes("subsystem:")) {
          let systemKey = parseInt(args[item].replace("subsystem:", ""));
          if (systemKey) {
            args[item] = this.getMessage(this.getSubSystemKey(systemKey));
          }
        }
        else if (args[item].includes("sublocalization:")) {
          let locKey = args[item].replace("sublocalization:", "");
          if (locKey) {
            args[item] = this.getMessage(locKey);
          }
        }
        else if (['LICENSE_UPDATED_KEY_INSERTED_NOT_EXPIRED_WITH_TIME', 'LICENSE_UPDATED_KEY_REMOVED_NOT_EXPIRED_WITH_TIME', 'LICENSE_UPDATED_KEY_INSERTED_EXPIRED_WITH_TIME', 'LICENSE_UPDATED_KEY_REMOVED_EXPIRED_WITH_TIME', 'LICENSE_EXPIRES_SOON_KEY_INSERTED_NOT_EXPIRED_WITH_TIME', 'LICENSE_EXPIRES_SOON_KEY_REMOVED_NOT_EXPIRED_WITH_TIME', 'LICENSE_EXPIRES_SOON_KEY_INSERTED_EXPIRED_WITH_TIME', 'LICENSE_EXPIRES_SOON_KEY_REMOVED_EXPIRED_WITH_TIME'].includes(value) && item == 2 && Date.parse(args[item])) {
          //let forLocale = localeRu;

          //if (curLoc == "en-US" || curLoc == "en") {
          //  forLocale = localeEn;
          //}
          //else if (curLoc == "uz-UZ" || curLoc == "uz") {
          //  forLocale = localeUz;
          //}
          //else if (curLoc == "uz-Lath-UZ" || curLoc == "uz-Lath") {
          //  forLocale = localeUzLatn;
          //}
          let toDate = new Date(args[item]);
          //args[item] = `, ${dayjs(toDate).locale(forLocale).from()} (${toDate})`;
          args[item] = toDate;
        }
      }

      if (this.localizationMessages) {
        if (value in this.localizationMessages) {
          response = this.localizationMessages[value].message;
          if (args && args.length > 0) {
            response = response.replace(/\$([1-9]{1,2})/g, function (match, index) {
              return typeof args[index - 1] === 'undefined' ? match : args[index - 1];
            });
          }
        }
      }
      else {
        response = chrome.i18n.getMessage(value, args);
      }
      if (!response) {
        response = value;
      }
      return response;
    }
    catch (e) {
      console.error("Ошибка поиска в словаре", e.message);
    }
  }

  getSubSystemKey(systemID) {
    switch (systemID) {
      case 1:
        return "systemAso";
      case 2:
        return "systemUzs";
      case 3:
        return "systemCu";
      case 4:
        return "systemP16";
      default:
        return "systemNoFound";
    }
  }
}