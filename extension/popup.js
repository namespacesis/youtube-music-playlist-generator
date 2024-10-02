document.addEventListener("DOMContentLoaded", function () {
  // 현재 활성 탭의 URL을 확인
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    const url = currentTab.url;

    // YouTube 도메인에 있는지 확인
    const createPlaylistButton = document.getElementById("createPlaylist");

    if (url && url.includes("youtube.com")) {
      // YouTube 도메인일 경우, 버튼 활성화
      createPlaylistButton.disabled = false;
    } else {
      // YouTube 도메인이 아닐 경우, 버튼 비활성화
      createPlaylistButton.disabled = true;
    }
  });

  // 버튼 클릭 이벤트 리스너
  document
    .getElementById("createPlaylist")
    .addEventListener("click", function () {
      // background.js로 재생목록 생성 메시지를 보냄
      chrome.runtime.sendMessage({ action: "startPlaylistCreation" });
    });
});

// background.js에서 에러 메시지를 받을 때 처리
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "error") {
    // popup.js에서 오류를 사용자에게 표시
    alert("Error: " + request.message);
  }
});
