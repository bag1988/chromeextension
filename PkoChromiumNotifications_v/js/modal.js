setInterval(function () {
  var title = document.querySelector('title');
  if (title) {
    if (title.innerHTML === "Требуется подтверждение") {
      title.innerHTML = "Получена команда для исполнения";
    } else {
      title.innerHTML = "Требуется подтверждение";
    }
  }
}, 1000)

window.onload = () => {
    if (window.location.search) {
        try {
            var data = Object.fromEntries(new URLSearchParams(window.location.search));
            if (data) {
                if (data.method == "p16")
                    WriteForManualP16(data);
            }
        }
        catch (e) {
            console.log(e);
        }
    }
}

var intervalUpdate;
var startDate;
function WriteForManual(data) {
    document.title = "Требуется подтверждение";
    var main = document.querySelector("main");
    startDate = new Date(data.gotIn);
    main.innerHTML = `<h2 class="header-top">Получена команда для исполнения</h2>
    <div class="p-4">
        <strong>${startDate.toLocaleString()}</strong> 
            <p>  
            <b>В ожидании </b><span id="timeWait">${timeDistance()}</span>            
            </p>

            <p>
            <b>Поступила команда</b> ${data.commandName}            
            </p>

            <p>
            <b>Наименование</b> ${data.commandName}            
            </p>

            <p>
            <b>Источник</b> ${data.sourceName ? data.sourceName : "не задано"}           
            </p>
            
            <p>
            <b>Описание</b> ${data.commandName}            
            </p>           
     </div>`;

    document.querySelector("#cancelButton").onclick = () => {
        SendAnswer({ "cmdid": data.cmD_ID, "serNo": data.serNo, "cmd": data.cmd, "result": 0, "id": data.id });
    };
    document.querySelector("#sumbitButton").onclick = () => {
        SendAnswer({ "cmdid": data.cmD_ID, "serNo": data.serNo, "cmd": data.cmd, "result": 1, "id": data.id });
    };

    intervalUpdate = setInterval(async () => {
        try {
            var timeWait = document.querySelector("#timeWait");
            if (timeWait) {
                timeWait.innerHTML = timeDistance();
            }
        }
        catch (e) {
            console.log(e);
        }
    }, 1000);
}
function WriteForManualP16(data) {
    document.title = "Требуется подтверждение";
    var main = document.querySelector("main");
    startDate = new Date(data.gotIn);
    main.innerHTML = `<h2 class="header-top">Получена команда для исполнения</h2>
    <div class="p-4">
        <strong>${startDate.toLocaleString()}</strong> 
            <p>  
            <b>В ожидании </b><span id="timeWait">${timeDistance()}</span>            
            </p>

            <p>
            <b>Получена команда</b> ${data.commandName}            
            </p>

            <p>
            <b>Источник</b> ${data.sourceName ? data.sourceName : "не задано"}           
            </p>
            ${CreateList(data.sitNameList)}           
     </div>`;

    document.querySelector("#cancelButton").onclick = () => {
        SendAnswer({ "cmdid": data.cmD_ID, "serNo": data.serNo, "cmd": data.cmd, "result": 0, "id": data.id });
    };
    document.querySelector("#sumbitButton").onclick = () => {
        SendAnswer({ "cmdid": data.cmD_ID, "serNo": data.serNo, "cmd": data.cmd, "result": 1, "id": data.id });
    };

    intervalUpdate = setInterval(async () => {
        try {
            var timeWait = document.querySelector("#timeWait");
            if (timeWait) {
                timeWait.innerHTML = timeDistance();
            }
        }
        catch (e) {
            console.log(e);
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

function SendAnswer(data) {
    chrome.storage.local.get(["urlConnect"]).then((result) => {
        if (result.urlConnect) {
            fetch(`https://${result.urlConnect}/api/v1/SetAnswerManualP16`, {
                method: "post", headers: {
                    "Content-Type": "application/json"
                }, body: JSON.stringify(data)
            });
            fetch(`https://${result.urlConnect}/api/v1/DeleteManualP16`, {
                method: "post", headers: {
                    "Content-Type": "application/json"
                }, body: `${data.id}`
            });
        }
    });
    clearInterval(intervalUpdate);
    window.close();
}

function CreateList(data) {
    var html = "";
    var arr = data.split(',');
    if (arr.length > 0) {
        html = "<p><b>Требуется подтверждение на запуск оповещения по сценариям</b>";
        html += "<ul>";
        for (let s of arr) {
            html += `<li>${s}</li>`;
        }
        html += "</ul></p>";
    }
    else {
        html = `<p>
                <b>На данную команду сценарии не назначены.</b> Требуется подтверждение получения данной команды.                
                </p>`;
    }
    return html;
}