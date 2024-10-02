document
  .getElementById("createPlaylist")
  .addEventListener("click", function () {
    // background.js로 재생목록 생성 메시지를 보냄
    chrome.runtime.sendMessage({ action: "startPlaylistCreation" });
  });

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "error") {
    // popup.js에서 오류를 사용자에게 표시
    alert("Error: " + request.message);
  }
});
