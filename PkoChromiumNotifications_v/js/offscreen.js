var longwarm = null;
window.onload = async () => {
  longwarm = document.querySelector("#longwarm");
  await chrome.runtime.sendMessage({ method: "keepAlive" });
}

setInterval(async () => {
  try {
    await chrome.runtime.sendMessage({ method: "keepAlive" });
  }
  catch (e) {
    console.error(e);
  }
}, 20e3);

chrome.runtime.onMessage.addListener((e) => {
  if (e.method == "playSound") {
    if (longwarm && longwarm.paused) {
      longwarm.currentTime = 0;
      longwarm.play();
    }
  }
  if (e.method == "stopSound") {
    longwarm?.pause();
  }
});
