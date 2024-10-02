// content.js가 유튜브 페이지에서 실행됨
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "extractSongs") {
    const token = request.token;

    // 노래 목록을 추출하는 함수 실행
    const songs = extractSongsFromPage();

    // 비디오 ID를 동기적으로 추출
    processSongs(songs, token);
  }
});

// 타임라인, 설명, 고정된 댓글에서 노래를 추출하는 함수
function extractSongsFromPage() {
  const songs = [];
  const chapters = document.querySelectorAll(
    ".ytd-macro-markers-list-renderer"
  );
  const songsSet = new Set();

  chapters.forEach((chapter) => {
    const match = chapter.innerText.match(/(.+?)\s-\s(.+)/); // "아티스트 - 곡 제목" 형식 추출
    if (match) {
      const title = match[0]; // "최예나 (YENA) - 네모네모" 형식
      songsSet.add(title); // Set에 추가하여 중복 제거
    }
  });

  songs.push(
    ...Array.from(songsSet).map((title) => ({
      title: title,
    }))
  );

  // 영상 설명 탐지
  const description = document.querySelector("#description");
  if (description) {
    const regex = /(\d{2}:\d{2}:\d{2}|\d{2}:\d{2})\s(.+?)\s-\s(.+)/g;
    let match;
    while ((match = regex.exec(description.innerText)) !== null) {
      songs.push({ title: match[3] });
    }
  }

  // 고정된 댓글 탐지
  const pinnedComment = document.querySelector("#pinned-comment");
  if (pinnedComment) {
    const regex = /\d{1,2}:\d{2}.*? - (.+)/g;
    let match;
    while ((match = regex.exec(pinnedComment.innerText)) !== null) {
      songs.push({ title: match[1] });
    }
  }

  console.log("Extracted songs:", songs);
  return songs;
}

// 각 노래 제목에 대해 비디오 ID를 동기적으로 추출하는 함수
async function processSongs(songs, token) {
  const videoIds = [];
  const totalSongs = songs.length;

  for (let i = 0; i < totalSongs; i++) {
    const song = songs[i];
    const isLastSong = i === totalSongs - 1; // 마지막 노래 여부 체크
    const videoId = await searchVideoOnYouTube(song.title, isLastSong); // 검색을 대기하고 결과를 받아옴

    if (videoId) {
      videoIds.push(videoId);
    }
  }

  // 추출된 비디오 ID를 background.js로 전송
  chrome.runtime.sendMessage({
    action: "createPlaylist",
    token: token,
    playlistName: prompt("Enter a name for your playlist:"),
    videoIds: videoIds,
  });
}

// 유튜브에서 검색하고 비디오 ID를 반환하는 함수
async function searchVideoOnYouTube(title, isLastSong) {
  // 검색 결과 페이지로 이동
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    title
  )}`;

  // 새로운 탭을 열어 검색 결과 페이지를 연다
  const newTab = window.open(searchUrl, "_blank");

  // 페이지가 로드될 시간을 기다리기 위해 약간의 시간 대기
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 비디오 ID 추출
  const firstVideoElement = newTab.document.querySelector(
    "ytd-video-renderer a#video-title"
  );
  let videoId = null;

  if (firstVideoElement) {
    videoId = firstVideoElement.href.split("v=")[1].split("&")[0];
  }

  // 검색 탭을 닫는다
  newTab.close();

  // 마지막 노래일 경우, 백그라운드로 탭 이동 요청
  if (isLastSong) {
    chrome.runtime.sendMessage({ action: "moveToOriginalTab" });
  }

  return videoId; // 비디오 ID 반환
}
