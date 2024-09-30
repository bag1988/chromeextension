var intervalUpdate;
var startDate;
var loadDataTimeOut = setTimeout(function () {
  try {
    document.querySelector("main").innerHTML = `<p class="bg-danger b-radius m-2 p-4" data-i18n="errGetData">${localization.getMessage("errGetData")}</p>`;
    SetViewCloseButton();
  }
  catch (e) {
    console.error(e.message);
  }
}, 3000);

window.addEventListener("load", loadAcceptanceNotification);
async function loadAcceptanceNotification() {

  if (document.querySelector(".button-fixed")) {
    document.querySelector(".button-fixed").style.bottom = (document.querySelector("[is='footer-version']")?.offsetHeight ?? 0) + "px";
  }

  await navigator.locks.request(
    "InitAcceptanceNotification",
    { mode: "exclusive" },
    async (lock) => {
      await initLocalization();
      document.querySelector("#closeButton").onclick = () => {
        window.close();
      };
    }
  );
}

chrome.runtime.onMessage.addListener(async (e) => {
  await navigator.locks.request(
    "InitAcceptanceNotification",
    { mode: "exclusive" },
    async (lock) => {
      if (e.method == "Fire_AskForAcceptanceNotification") {
        console.debug("Fire_AskForAcceptanceNotification получены данные", e.detailInfo?.message);
        clearTimeout(loadDataTimeOut);
        WriteData(e.detailInfo);
      }
      if (e.method == "Fire_SetAcceptanceNotificationProcessed") {
        console.debug("Fire_SetAcceptanceNotificationProcessed получено подтверждение с ответом:", e.detailInfo?.acceptance);
        clearInterval(intervalUpdate);
        document.querySelector("#warningMessage").classList.remove("d-none");
        SetViewCloseButton();
      }
    }
  );
});

function SetViewCloseButton() {
  if (document.querySelector("#cancelButton")) {
    document.querySelector("#cancelButton").remove();
  }
  if (document.querySelector("#sumbitButton")) {
    document.querySelector("#sumbitButton").remove();
  }
  document.querySelector("#closeButton")?.classList.remove("d-none");
}

function WriteData(data) {
  document.title = `${localization.getMessage("aCommandForExecution")}`;
  var main = document.querySelector("main");
  startDate = new Date();
  /*Получена команда для исполнения*/
  main.innerHTML = `<h3 class="pageTitle m-0 p-4"><small>${new URL(window.location.href).searchParams.get("forUrl")}</small><br><text data-i18n="aCommandForExecution">${localization.getMessage("aCommandForExecution")}</text></h3>
    <div class="p-4">
        <strong>${startDate.toLocaleString()}</strong> 
            <p>  
            <b data-i18n="waitingText">${localization.getMessage("waitingText")}</b> <span id="timeWait">${timeDistance()}</span>            
            </p>
            <p class="white-space" data-i18n="${!data.localizationKey ? "" : data.localizationKey}" data-i18n-args="${data.localizationArgs?.join('||')}">${localization.getMessage(!data.localizationKey ? data.message : data.localizationKey, data.localizationArgs)}</p>
     </div>`;
  document.querySelector("#cancelButton").onclick = () => {
    SendAnswer({ "id": data?.id, "acceptance": false });
  };
  document.querySelector("#sumbitButton").onclick = () => {
    SendAnswer({ "id": data?.id, "acceptance": true });
  };

  intervalUpdate = setInterval(async () => {
    try {
      var timeWait = document.querySelector("#timeWait");
      if (timeWait) {
        timeWait.innerHTML = timeDistance();
      }
      var title = document.querySelector('title');
      if (title) {
        /*Требуется подтверждение*/
        if (title.innerHTML === localization.getMessage("confirmIsRequired")) {
          /*Получена команда для исполнения*/
          title.innerHTML = localization.getMessage("aCommandForExecution");
          title.setAttribute("data-i18n", "aCommandForExecution");
        } else {
          /*Требуется подтверждение*/
          title.innerHTML = localization.getMessage("confirmIsRequired");
          title.setAttribute("data-i18n", "confirmIsRequired");
        }
      }
    }
    catch (e) {
      console.error(e);
    }
  }, 1000);
}
function timeDistance() {
  let distance = Math.abs(new Date() - startDate);
  const day = Math.floor(distance / (3600000 * 24));
  distance -= day * (3600000 * 24);
  const hours = Math.floor(distance / 3600000);
  distance -= hours * 3600000;
  const minutes = Math.floor(distance / 60000);
  distance -= minutes * 60000;
  const seconds = Math.floor(distance / 1000);
  return `${('0' + day).slice(-2)} <text data-i18n="day">${localization.getMessage("day")}</text> ${('0' + hours).slice(-2)}:${('0' + minutes).slice(-2)}:${('0' + seconds).slice(-2)}`;
};

async function SendAnswer(data) {
  await fetch(`https://${new URL(window.location.href).searchParams.get("forUrl")}/AcceptNotification`, {
    method: "post", headers: {
      "Content-Type": "application/json"
    }, body: JSON.stringify(data)
  });
  clearInterval(intervalUpdate);
  window.close();
}