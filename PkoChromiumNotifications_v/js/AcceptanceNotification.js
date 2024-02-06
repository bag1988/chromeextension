
var urlConnect = "";

window.onload = () => {
  var title = document.querySelector('title');
  if (title) {
    urlConnect = new URL(window.location.href).searchParams.get("forUrl");
    if (urlConnect) {
      title.innerHTML = `${title.innerText} - ${urlConnect}`;
    }
  }
}

chrome.runtime.onMessage.addListener(async (e) => {
  if (e.method == "Fire_AskForAcceptanceNotification") {
    WriteData(e.detailInfo);
  }
  if (e.method == "Fire_AskForAcceptanceNotification") {
    WriteData(e.detailInfo);
  }
});

setInterval(function () {
  var title = document.querySelector('title');
  if (title) {
    if (title.innerHTML === `Требуется подтверждение - ${urlConnect}`) {
      title.innerHTML = `Получена команда для исполнения - ${urlConnect}`;
    } else {
      title.innerHTML = `Требуется подтверждение - ${urlConnect}`;
    }
  }
}, 1000)

var intervalUpdate;
var startDate;

function WriteData(data) {
  document.title = "Требуется подтверждение";
  var main = document.querySelector("main");
  startDate = new Date();
  main.innerHTML = `<h2 class="header-top">Получена команда для исполнения</h2>
    <div class="p-4">
        <strong>${startDate.toLocaleString()}</strong> 
            <p>  
            <b>В ожидании </b><span id="timeWait">${timeDistance()}</span>            
            </p>
            <p class="white-space">${data.message}</p>
     </div>`;

  document.querySelector("#cancelButton").onclick = () => {
    SendAnswer({ "id": data.id, "acceptance": false });
  };
  document.querySelector("#sumbitButton").onclick = () => {
    SendAnswer({ "id": data.id, "acceptance": true });
  };

  intervalUpdate = setInterval(async () => {
    try {
      var timeWait = document.querySelector("#timeWait");
      if (timeWait) {
        timeWait.innerHTML = timeDistance();
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
  return `${('0' + day).slice(-2)} дней ${('0' + hours).slice(-2)}:${('0' + minutes).slice(-2)}:${('0' + seconds).slice(-2)}`;
};

async function SendAnswer(data) {
  await fetch(`https://${urlConnect}/AcceptNotification`, {
    method: "post", headers: {
      "Content-Type": "application/json"
    }, body: JSON.stringify(data)
  });
  clearInterval(intervalUpdate);
  window.close();
}