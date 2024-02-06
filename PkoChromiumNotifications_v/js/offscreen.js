window.onload = async () => {
  await chrome.runtime.sendMessage({ method: "keepAlive" });;
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
    ManagmentAudio(true);
  }
  if (e.method == "stopSound") {
    ManagmentAudio(false);
  }
});

function ManagmentAudio(isPaly) {
  let longwarm = document.querySelector("#longwarm");
  if (longwarm) {
    if (isPaly && longwarm.paused) {
      longwarm.currentTime = 0;
      longwarm.play();
    }
    else if (!isPaly) {
      longwarm.pause();
    }
  }
}
