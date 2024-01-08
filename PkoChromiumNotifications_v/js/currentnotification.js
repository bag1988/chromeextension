var SelectArray;
var CurrentUrl;

chrome.runtime.onMessage.addListener((e) => {
  if (e.method == "Fire_StartSessionSubCu") {
    AddStartRow(e.detailInfo);
  }
});

function AddStartRow(detailInfo) {
  var tbody = document.querySelector("tbody");
  if (tbody) {
    if (detailInfo) {
      let rowHtml = `<tr>
                          <td>${new Date().toLocaleString()}</td>
                          <td>${detailInfo.message}</td>
                    </tr>`;
      tbody.insertAdjacentHTML("afterbegin", rowHtml);
    }
  }
}
