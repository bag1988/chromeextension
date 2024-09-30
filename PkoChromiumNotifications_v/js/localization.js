let localization;

async function initLocalization() {
  var jsRun = await import("./Manuali18n.js");
  localization = new jsRun.Manuali18n();
  await localization.init();
  localization.replaceDom();

  chrome.storage.onChanged.addListener(async (object, areaName) => {
    try {
      if (areaName == "local") {
        if (object.language && object.language.newValue != object.language.oldValue && localization) {
          await localization.reInit(object.language.newValue);
          localization.replaceDom();
        }
      }
    }
    catch (e) {
      console.error("Error init localization ", e.message);
    }
  });
}