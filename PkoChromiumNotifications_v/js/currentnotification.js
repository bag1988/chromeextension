chrome.runtime.onMessage.addListener((e) => {
  if (e.method == "Fire_ShowMessage") {
    AddStartRow(e.detailInfo);
    window.addEventListener("click", SendStopSound, false);
  }
});

window.onload = () => {
  var title = document.querySelector('title');
  if (title) {
    let urlConnect = new URL(window.location.href).searchParams.get("forUrl");
    if (urlConnect) {
      title.innerHTML = `${title.innerText} - ${urlConnect}`;
    }   
  }
}


async function SendStopSound(event) {
  // Recommended
  await chrome.runtime.sendMessage({ method: "stopSound" });
  window.removeEventListener("click", SendStopSound);
}

function AddStartRow(detailInfo) {
  var tbody = document.querySelector("tbody");
  if (tbody) {
    if (detailInfo && detailInfo.message) {
      let rowHtml = `<tr class="white-space v-align-top">
                          <td>${new Date().toLocaleString()}</td>
                          <td>${detailInfo.message}</td>
                    </tr>`;
      tbody.insertAdjacentHTML("afterbegin", rowHtml);
    }
  }
}
