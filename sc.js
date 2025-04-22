let currentTrackSrc = null;

// 🔝 꼭 맨 위에 있어야 함
const musicQueue = [];

// HTML 요소들을 가져옴
const audio = document.getElementById('myAudio');           // 오디오 객체
const iconGrid = document.getElementById('iconGrid');       // 사운드 버튼 이미지가 들어갈 그리드 영역
const title = document.getElementById('title');             // 현재 박스의 타이틀 표시 영역
const volumeSlider = document.getElementById('volumeSlider'); // 볼륨 슬라이더
const playPauseBtn = document.getElementById('playPauseBtn'); // 재생/일시정지 버튼
const stopBtn = document.getElementById('stopBtn');           // 정지 버튼
const loopBtn = document.getElementById('loopBtn');           // 반복재생 버튼
const shuffleBtn = document.getElementById('shuffleBtn');     // 랜덤재생 버튼
const timeBox = document.getElementById('time-box');     // 오디오 재생 시간 박스
const clockBox = document.getElementById('clock-box');   // 현재 시각 박스

// 초기 볼륨 설정
audio.volume = parseFloat(volumeSlider.value);

// 볼륨 슬라이더 변화 감지하여 오디오 볼륨 반영
volumeSlider.addEventListener('input', () => {
  audio.volume = parseFloat(volumeSlider.value);
});

// 현재 박스 인덱스 (처음은 0번)
let currentIndex = 0;

// 현재 재생 중인 사운드 인덱스 (-1은 재생 중 아님)
let currentSoundIndex = -1;

const data = [
  {
    title: '인스타감성 📷',
    tracks: [
      { sound: 'assets/sounds/1-1.mp3', image: 'assets/images/1-1.png', title: "Everything", artist: "검정치마" },
      { sound: 'assets/sounds/1-2.mp3', image: 'assets/images/1-2.png', title: "은방울", artist: "DANIEL" },
      { sound: 'assets/sounds/1-3.mp3', image: 'assets/images/1-3.png', title: "Here with me", artist: "d4vd" },
      { sound: 'assets/sounds/1-4.mp3', image: 'assets/images/1-4.png', title: "Come back with me", artist: "Siggerr" },
      { sound: 'assets/sounds/1-5.mp3', image: 'assets/images/1-5.png', title: "소나기", artist: "1968" },
      { sound: 'assets/sounds/1-6.mp3', image: 'assets/images/1-6.png', title: "I believe", artist: "신승훈" },
      { sound: 'assets/sounds/1-7.mp3', image: 'assets/images/1-7.png', title: "미치게 해", artist: "범키" },
      { sound: 'assets/sounds/1-8.mp3', image: 'assets/images/1-8.png', title: "Feels", artist: "Calvin Harris" },
      { sound: 'assets/sounds/1-9.mp3', image: 'assets/images/1-9.png', title: "LDR", artist: "Shoti " }
    ]
  },
  {
    title: '잔잔한음악 💿',
    tracks: [
      { sound: 'assets/sounds/2-1.mp3', image: 'assets/images/2-1.png', title: "주저하는 연인들을위해", artist: "잔나비" },
      { sound: 'assets/sounds/2-2.mp3', image: 'assets/images/2-2.png', title: "She", artist: "잔나비" },
      { sound: 'assets/sounds/2-3.mp3', image: 'assets/images/2-3.png', title: "Home Sweet Home", artist: "카더가든" },
      { sound: 'assets/sounds/2-4.mp3', image: 'assets/images/2-4.png', title: "우산", artist: "에픽하이" },
      { sound: 'assets/sounds/2-5.mp3', image: 'assets/images/2-5.png', title: "Yours", artist: "데이먼스이어" },
      { sound: 'assets/sounds/2-6.mp3', image: 'assets/images/2-6.png', title: "좋은밤 좋은꿈", artist: "너드커넥션션" },
      { sound: 'assets/sounds/2-7.mp3', image: 'assets/images/2-7.png', title: "TOMBOY", artist: "오혁" },
      { sound: 'assets/sounds/2-8.mp3', image: 'assets/images/2-8.png', title: "가을이 오면", artist: "이문세" },
      { sound: 'assets/sounds/2-9.mp3', image: 'assets/images/2-9.png', title: "취기를 빌려", artist: "산들" },
      { sound: 'assets/sounds/2-10.mp3', image: 'assets/images/2-10.png', title: "고백", artist: "뜨거운 감자" },
      { sound: 'assets/sounds/2-11.mp3', image: 'assets/images/2-11.png', title: "눈사람", artist: "정승환" },
      { sound: 'assets/sounds/2-12.mp3', image: 'assets/images/2-12.png', title: "노을", artist: "다비치" },
      { sound: 'assets/sounds/2-13.mp3', image: 'assets/images/2-13.png', title: "소녀", artist: "오혁" },
      { sound: 'assets/sounds/2-14.mp3', image: 'assets/images/2-14.png', title: "위잉위잉", artist: "혁오" },
      { sound: 'assets/sounds/2-15.mp3', image: 'assets/images/2-15.png', title: "DPR LlVE", artist: "JASMINE" },
      { sound: 'assets/sounds/2-16.mp3', image: 'assets/images/2-16.png', title: "와르르", artist: "콜드" },
      { sound: 'assets/sounds/2-17.mp3', image: 'assets/images/2-17.png', title: "우리", artist: "이데아" },
      { sound: 'assets/sounds/2-18.mp3', image: 'assets/images/2-18.png', title: "너의 로맨스에 내 이름을 써줘", artist: "백사" },
      { sound: 'assets/sounds/2-19.mp3', image: 'assets/images/2-19.png', title: "가끔 연락하던 애", artist: "결" },
      { sound: 'assets/sounds/2-20.mp3', image: 'assets/images/2-20.png', title: "사랑이 아닌 단어로 사랑을 말해요", artist: "시소" }
    ]
  },
  {
    title: '신나는음악 🎶',
    tracks: [
      { sound: 'assets/sounds/3-1.mp3', image: 'assets/images/3-1.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/3-2.mp3', image: 'assets/images/3-2.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/3-3.mp3', image: 'assets/images/3-3.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/3-4.mp3', image: 'assets/images/3-4.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/3-5.mp3', image: 'assets/images/3-5.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/3-6.mp3', image: 'assets/images/3-6.png', title: "Missing", artist: "Unknown" }
    ]
  },
  {
    title: '　 힙합 🎵 　',
    tracks: [
      { sound: 'assets/sounds/4-1.mp3', image: 'assets/images/4-1.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/4-2.mp3', image: 'assets/images/4-2.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/4-3.mp3', image: 'assets/images/4-3.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/4-4.mp3', image: 'assets/images/4-4.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/4-5.mp3', image: 'assets/images/4-5.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/4-6.mp3', image: 'assets/images/4-6.png', title: "Missing", artist: "Unknown" }
    ]
  },
  {
    title: '  발라드 🎤  ',
    tracks: [
      { sound: 'assets/sounds/5-1.mp3', image: 'assets/images/5-1.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/5-2.mp3', image: 'assets/images/5-2.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/5-3.mp3', image: 'assets/images/5-3.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/5-4.mp3', image: 'assets/images/5-4.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/5-5.mp3', image: 'assets/images/5-5.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/5-6.mp3', image: 'assets/images/5-6.png', title: "Missing", artist: "Unknown" }
    ]
  },
  {
    title: ' 해외팝송 🎸 ',
    tracks: [
      { sound: 'assets/sounds/6-1.mp3', image: 'assets/images/6-1.png', title: "Just the two of Us", artist: "Bill Withers" },
      { sound: 'assets/sounds/6-2.mp3', image: 'assets/images/6-2.png', title: "I'm Not The Only One", artist: "Sam Smith" },
      { sound: 'assets/sounds/6-3.mp3', image: 'assets/images/6-3.png', title: "Sugar", artist: "Marron5" },
      { sound: 'assets/sounds/6-4.mp3', image: 'assets/images/6-4.png', title: "2002", artist: "Anne-Marie" },
      { sound: 'assets/sounds/6-5.mp3', image: 'assets/images/6-5.png', title: "Bad", artist: "Christopher" },
      { sound: 'assets/sounds/6-6.mp3', image: 'assets/images/6-6.png', title: "Memories", artist: "Maroon5" },
      { sound: 'assets/sounds/6-7.mp3', image: 'assets/images/6-7.png', title: "STAY", artist: "Justin Bieber" },
      { sound: 'assets/sounds/6-8.mp3', image: 'assets/images/6-8.png', title: "Sunroof", artist: "Nicky Youre" },
      { sound: 'assets/sounds/6-9.mp3', image: 'assets/images/6-9.png', title: "Shape of You", artist: "Ed Sheeran" },
      { sound: 'assets/sounds/6-10.mp3', image: 'assets/images/6-10.png', title: "Marry You", artist: "Bruno Mars" },
      { sound: 'assets/sounds/6-11.mp3', image: 'assets/images/6-11.png', title: "I Don't Think That I Like Her", artist: "Charlie Puth" },
      { sound: 'assets/sounds/6-12.mp3', image: 'assets/images/6-12.png', title: "Dangerously", artist: "Charlie Puth" },
      { sound: 'assets/sounds/6-13.mp3', image: 'assets/images/6-13.png', title: "Left and Right", artist: "Charlie Puth" },
      { sound: 'assets/sounds/6-14.mp3', image: 'assets/images/6-14.png', title: "Take on Me", artist: "a-ha" },
      { sound: 'assets/sounds/6-15.mp3', image: 'assets/images/6-15.png', title: "See You Again", artist: "Charlie Puth" },
      { sound: 'assets/sounds/6-16.mp3', image: 'assets/images/6-16.png', title: "There's Nothing Holdin' Me Back", artist: "Shawn Mendes" },
      { sound: 'assets/sounds/6-17.mp3', image: 'assets/images/6-17.png', title: "Love Yourself", artist: "Justin Bieber" },
      { sound: 'assets/sounds/6-18.mp3', image: 'assets/images/6-18.png', title: "Happy", artist: "Pharrell Williams" },
      { sound: 'assets/sounds/6-19.mp3', image: 'assets/images/6-19.png', title: "September", artist: "Earth, Wind & Fire" },
      { sound: 'assets/sounds/6-20.mp3', image: 'assets/images/6-20.png', title: "Uptown Funk", artist: "Bruno Mars" },
      { sound: 'assets/sounds/6-21.mp3', image: 'assets/images/6-21.png', title: "I Love You So", artist: "The Walters" },
      { sound: 'assets/sounds/6-22.mp3', image: 'assets/images/6-22.png', title: "Come and Get Your Love", artist: "Redbone" },
      { sound: 'assets/sounds/6-23.mp3', image: 'assets/images/6-23.png', title: "Dancin", artist: "Aaron Smith" },
      { sound: 'assets/sounds/6-24.mp3', image: 'assets/images/6-24.png', title: "It's My Life", artist: "Bon Jovi" },
      { sound: 'assets/sounds/6-25.mp3', image: 'assets/images/6-25.png', title: "We Ain't ever Getting Older", artist: "Fozia Williams" },
      { sound: 'assets/sounds/6-26.mp3', image: 'assets/images/6-26.png', title: "Counting Stars", artist: "OneRepublic" },
      { sound: 'assets/sounds/6-27.mp3', image: 'assets/images/6-27.png', title: "I Ain't Worried", artist: "OneRepublic" },
      { sound: 'assets/sounds/6-28.mp3', image: 'assets/images/6-28.png', title: "Double Take", artist: "Dhruv" },
      { sound: 'assets/sounds/6-29.mp3', image: 'assets/images/6-29.png', title: "Feel It", artist: "d4vd" },
      { sound: 'assets/sounds/6-30.mp3', image: 'assets/images/6-30.png', title: "What Are You Wating For", artist: "d4vd" },
      { sound: 'assets/sounds/6-31.mp3', image: 'assets/images/6-31.png', title: "Notion", artist: "The Rare Occasions" },
      { sound: 'assets/sounds/6-32.mp3', image: 'assets/images/6-32.png', title: "Serenade", artist: "Diverseddie" },
      { sound: 'assets/sounds/6-33.mp3', image: 'assets/images/6-33.png', title: "The Nights", artist: "Avicii" },
      { sound: 'assets/sounds/6-34.mp3', image: 'assets/images/6-34.png', title: "Wake Me Up", artist: "Avicii" },
      { sound: 'assets/sounds/6-35.mp3', image: 'assets/images/6-35.png', title: "Viva La Vida", artist: "Coldplay" },
      { sound: 'assets/sounds/6-36.mp3', image: 'assets/images/6-36.png', title: "High Hopes", artist: "Panic! At The Disco" },
      { sound: 'assets/sounds/6-37.mp3', image: 'assets/images/6-37.png', title: "Waiting For Love", artist: "Avicii" },
      { sound: 'assets/sounds/6-38.mp3', image: 'assets/images/6-38.png', title: "Dragostea din tei", artist: "O-Zone" },
      { sound: 'assets/sounds/6-39.mp3', image: 'assets/images/6-39.png', title: "Warriors", artist: "Imagine Dragons" },
      { sound: 'assets/sounds/6-40.mp3', image: 'assets/images/6-40.png', title: "Call Me Maybe", artist: "Carly Rae Jepsen" }
    ]
  },
  {
    title: ' 인디음악 🎧 ',
    tracks: [
      { sound: 'assets/sounds/7-1.mp3', image: 'assets/images/7-1.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/7-2.mp3', image: 'assets/images/7-2.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/7-3.mp3', image: 'assets/images/7-3.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/7-4.mp3', image: 'assets/images/7-4.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/7-5.mp3', image: 'assets/images/7-5.png', title: "Missing", artist: "Unknown" },
      { sound: 'assets/sounds/7-6.mp3', image: 'assets/images/7-6.png', title: "Missing", artist: "Unknown" }
    ]
  }
];

// 아이콘 및 타이틀 로드 함수
function loadBox(index) {
  const box = data[index];
  title.textContent = box.title;
  iconGrid.innerHTML = '';

  box.tracks.forEach((track) => {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'icon-item';

    const img = document.createElement('img');
    img.src = track.image;
    img.onerror = function () {
      img.src = 'assets/images/missing.png';
    };
    img.className = 'playButton';

    const textWrapper = document.createElement('div');
    textWrapper.className = 'text-info';

    const titleElem = document.createElement('div');
    titleElem.className = 'song-title';
    titleElem.textContent = track.title || "없음";

    const artistElem = document.createElement('div');
    artistElem.className = 'song-artist';
    artistElem.textContent = track.artist || "-";

    textWrapper.appendChild(titleElem);
    textWrapper.appendChild(artistElem);

    iconWrapper.appendChild(img);
    iconWrapper.appendChild(textWrapper);

    // ✅ 좌클릭: 즉시 재생 + 현재 트랙 경로 저장
    iconWrapper.addEventListener('click', () => {
      playSound(track.sound);
      currentTrackSrc = track.sound;
    });

    // ✅ 우클릭: 대기열에 추가
    iconWrapper.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  enqueueTrack(track);
});

    iconGrid.appendChild(iconWrapper);
  });
}

loadBox(currentIndex); // 초기 박스 로드

// 이전 버튼 클릭 시 이전 박스로 이동
const prevBtn = document.getElementById('prevBtn');
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    // 🔄 현재 곡 처음부터 재시작
    audio.currentTime = 0;

    // 📦 이전 인덱스의 박스 불러오기
    currentIndex = (currentIndex - 1 + data.length) % data.length;
    loadBox(currentIndex);
  });
}

// 다음 버튼 클릭 시 다음 박스로 이동
document.getElementById('nextBtn').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % data.length; // 인덱스 증가, 순환
  loadBox(currentIndex);
});

let isStopped = false; // 전역에서 선언 필요!

stopBtn.addEventListener('click', () => {
  audio.pause();
  audio.currentTime = 0;
  currentTrackSrc = null;

  // 회전 이미지 초기화
  rotatingIcon.src = 'assets/images/missing.png';
  rotatingIcon.classList.remove('rotating', 'paused');
  rotatingWrapper.classList.remove('rolling-in');
  rotatingWrapper.style.display = 'block';

  // 트랙 정보 초기화
  trackInfoBar.textContent = '없음';

  // 재생/정지 아이콘도 초기화
  playPauseBtn.textContent = '▶️';

  // 시간 바 초기화
  timeBox.textContent = '0:00 / 0:00';
});


// 재생 버튼 동작
playPauseBtn.addEventListener('click', () => {
  // ✅ 현재 재생 중인 트랙이 없으면 재생하지 않음
  if (!currentTrackSrc) {
    console.warn('🎵 재생할 트랙이 없습니다.');
    return;
  }

  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = '⏸️';
    rotatingIcon.classList.remove('paused');
    rotatingIcon.classList.add('rotating');
  } else {
    audio.pause();
    playPauseBtn.textContent = '▶️';
    rotatingIcon.classList.add('paused');
  }
});

function showMissingIcon() {
  const wrapper = document.getElementById('rotatingWrapper');
  wrapper.style.display = 'block';

  rotatingIcon.classList.remove('rotating', 'paused'); // 회전 멈춤
  rotatingIcon.src = 'assets/images/missing.png'; // missing 이미지로 교체
}

// 루프 버튼
loopBtn.addEventListener('click', () => {
  audio.loop = !audio.loop;
  loopBtn.style.color = audio.loop ? 'yellow' : 'white';
  loopBtn.textContent = audio.loop ? '🔂' : '🔁';
});

// 셔플 버튼 (수정)
shuffleBtn.addEventListener('click', () => {
  const validSounds = getValidSoundsInCurrentBox();
  
  if (validSounds.length === 0) {
    console.warn('🎲 셔플 가능한 곡이 없습니다!');
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * validSounds.length);
  const randomSoundPath = validSounds[randomIndex];
  playSound(randomSoundPath);
});

// 재생/일시정지 상태 자동 반영
audio.addEventListener('play', () => {
  playPauseBtn.textContent = '⏸️';
  showRotatingIcon();
});

audio.addEventListener('pause', () => {
  if (!audio.ended && audio.currentTime > 0) {
    pauseRotatingIcon(); // 일시정지일 때만 회전 멈추기
  }

  stopLoopWatcher();
});

// 오디오 재생 시간 업데이트 함수
function updateTimeText() {
  const current = formatTime(audio.currentTime);
  const duration = formatTime(audio.duration || 0);
  timeBox.textContent = `${current} / ${duration}`;
}

// 날짜 + 시간 표시: MM월 DD일 HH:MM:SS
function updateClockText() {
  const now = new Date();

  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // getMonth는 0부터 시작
  const date = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const min = now.getMinutes().toString().padStart(2, '0');
  const sec = now.getSeconds().toString().padStart(2, '0');

  clockBox.textContent = `${month}월 ${date}일 ${hour}:${min}:${sec}`;
}

// 현재 시간은 항상 업데이트
setInterval(updateClockText, 1000);

// 처음 로드되었을 때도 즉시 보이게
function showClockBox() {
  clockBox.classList.add('active');
  updateClockText();
}

// 오디오 재생 중일 때만 시간 텍스트 갱신
setInterval(() => {
  if (!audio.paused && !audio.ended) {
    updateTimeText();
  }
}, 500);

// 오디오 재생 시간 박스 표시
function updateTimeBox() {
  timeBox.classList.add('active');
  updateTimeText();
}

// 현재 시계 박스 표시
function showClockBox() {
  clockBox.classList.add('active');
  updateClockText();
}

// 초기 실행
updateTimeBox();

// 시간 형식 함수 (mm:ss)
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

const playlistTitle = document.getElementById('playlist-title');
const trackInfoBar = document.getElementById('trackInfoBar');

// 곡명 바 클릭 시 닫힘
trackInfoBar.addEventListener('click', () => {
  trackInfoBar.classList.remove('active');
});

const trackNames = {
  "1-1.mp3": { title: "Everything", artist: "검정치마" },
  "1-2.mp3": { title: "은방울", artist: "DANIEL" },
  "1-3.mp3": { title: "Here with me", artist: "d4vd" },
  "1-4.mp3": { title: "Come back with me", artist: "Siggerr" },
  "1-5.mp3": { title: "소나기", artist: "1968" },
  "1-6.mp3": { title: "I believe", artist: "신승훈" },
  "1-7.mp3": { title: "미치게 해", artist: "범키" },
  "1-8.mp3": { title: "Feels", artist: "Calvin Harris" },
  "1-9.mp3": { title: "LDR", artist: "Shoti" },

  "2-1.mp3": { title: "주저하는 연인들을위해", artist: "잔나비" },
  "2-2.mp3": { title: "She", artist: "잔나비" },
  "2-3.mp3": { title: "Home Sweet Home", artist: "카더가든" },
  "2-4.mp3": { title: "우산", artist: "에픽하이" },
  "2-5.mp3": { title: "Yours", artist: "데이먼스이어" },
  "2-6.mp3": { title: "좋은밤 좋은꿈", artist: "너드커넥션션" },
  "2-7.mp3": { title: "TOMBOY", artist: "오혁" },
  "2-8.mp3": { title: "가을이 오면", artist: "이문세" },
  "2-9.mp3": { title: "취기를 빌려", artist: "산들" },
  "2-10.mp3": { title: "고백", artist: "뜨거운 감자" },
  "2-11.mp3": { title: "눈사람", artist: "정승환" },
  "2-12.mp3": { title: "노을", artist: "다비치" },
  "2-13.mp3": { title: "소녀", artist: "오혁" },
  "2-14.mp3": { title: "위잉위잉", artist: "혁오" },
  "2-15.mp3": { title: "DPR LlVE", artist: "JASMINE" },
  "2-16.mp3": { title: "와르르", artist: "콜드" },
  "2-17.mp3": { title: "우리", artist: "이데아" },
  "2-18.mp3": { title: "너의 로맨스에 내 이름을 써줘", artist: "백사" },
  "2-19.mp3": { title: "가끔 연락하던 애", artist: "결" },
  "2-20.mp3": { title: "사랑이 아닌 단어로 사랑을 말해요", artist: "시소" },

  "3-1.mp3": { title: "Missing", artist: "Unknown" },
  "3-2.mp3": { title: "Missing", artist: "Unknown" },
  "3-3.mp3": { title: "Missing", artist: "Unknown" },
  "3-4.mp3": { title: "Missing", artist: "Unknown" },
  "3-5.mp3": { title: "Missing", artist: "Unknown" },
  "3-6.mp3": { title: "Missing", artist: "Unknown" },

  "4-1.mp3": { title: "Missing", artist: "Unknown" },
  "4-2.mp3": { title: "Missing", artist: "Unknown" },
  "4-3.mp3": { title: "Missing", artist: "Unknown" },
  "4-4.mp3": { title: "Missing", artist: "Unknown" },
  "4-5.mp3": { title: "Missing", artist: "Unknown" },
  "4-6.mp3": { title: "Missing", artist: "Unknown" },

  "5-1.mp3": { title: "Missing", artist: "Unknown" },
  "5-2.mp3": { title: "Missing", artist: "Unknown" },
  "5-3.mp3": { title: "Missing", artist: "Unknown" },
  "5-4.mp3": { title: "Missing", artist: "Unknown" },
  "5-5.mp3": { title: "Missing", artist: "Unknown" },
  "5-6.mp3": { title: "Missing", artist: "Unknown" },

  "6-1.mp3":  { title: "Just the two of Us", artist: "Bill Withers" },
  "6-2.mp3":  { title: "I'm Not The Only One", artist: "Sam Smith" },
  "6-3.mp3":  { title: "Sugar", artist: "Maroon5" },
  "6-4.mp3":  { title: "2002", artist: "Anne-Marie" },
  "6-5.mp3":  { title: "Bad", artist: "Christopher" },
  "6-6.mp3":  { title: "Memories", artist: "Maroon5" },
  "6-7.mp3":  { title: "STAY", artist: "Justin Bieber" },
  "6-8.mp3":  { title: "Sunroof", artist: "Nicky Youre" },
  "6-9.mp3":  { title: "Shape of You", artist: "Ed Sheeran" },
  "6-10.mp3": { title: "Marry You", artist: "Bruno Mars" },
  "6-11.mp3": { title: "I Don't Think That I Like Her", artist: "Charlie Puth" },
  "6-12.mp3": { title: "Dangerously", artist: "Charlie Puth" },
  "6-13.mp3": { title: "Left and Right", artist: "Charlie Puth" },
  "6-14.mp3": { title: "Take on Me", artist: "a-ha" },
  "6-15.mp3": { title: "See You Again", artist: "Charlie Puth" },
  "6-16.mp3": { title: "There's Nothing Holdin' Me Back", artist: "Shawn Mendes" },
  "6-17.mp3": { title: "Love Yourself", artist: "Justin Bieber" },
  "6-18.mp3": { title: "Happy", artist: "Pharrell Williams" },
  "6-19.mp3": { title: "September", artist: "Earth, Wind & Fire" },
  "6-20.mp3": { title: "Uptown Funk", artist: "Bruno Mars" },
  "6-21.mp3": { title: "I Love You So", artist: "The Walters" },
  "6-22.mp3": { title: "Come and Get Your Love", artist: "Redbone" },
  "6-23.mp3": { title: "Dancin", artist: "Aaron Smith" },
  "6-24.mp3": { title: "It's My Life", artist: "Bon Jovi" },
  "6-25.mp3": { title: "We Ain't ever Getting Older", artist: "Fozia Williams" },
  "6-26.mp3": { title: "Counting Stars", artist: "OneRepublic" },
  "6-27.mp3": { title: "I Ain't Worried", artist: "OneRepublic" },
  "6-28.mp3": { title: "Double Take", artist: "Dhruv" },
  "6-29.mp3": { title: "Feel It", artist: "d4vd" },
  "6-30.mp3": { title: "What Are You Wating For", artist: "d4vd" },
  "6-31.mp3": { title: "Notion", artist: "The Rare Occasions" },
  "6-32.mp3": { title: "Serenade", artist: "Diverseddie" },
  "6-33.mp3": { title: "The Nights", artist: "Avicii" },
  "6-34.mp3": { title: "Wake Me Up", artist: "Avicii" },
  "6-35.mp3": { title: "Viva La Vida", artist: "Coldplay" },
  "6-36.mp3": { title: "High Hopes", artist: "Panic! At The Disco" },
  "6-37.mp3": { title: "Waiting For Love", artist: "Avicii" },
  "6-38.mp3": { title: "Dragostea din tei", artist: "O-Zone" },
  "6-39.mp3": { title: "Warriors", artist: "Imagine Dragons" },
  "6-40.mp3": { title: "Call Me Maybe", artist: "Carly Rae Jepsen" },

  "7-1.mp3": { title: "Missing", artist: "Unknown" },
  "7-2.mp3": { title: "Missing", artist: "Unknown" },
  "7-3.mp3": { title: "Missing", artist: "Unknown" },
  "7-4.mp3": { title: "Missing", artist: "Unknown" },
  "7-5.mp3": { title: "Missing", artist: "Unknown" },
  "7-6.mp3": { title: "Missing", artist: "Unknown" },

  "missing.mp3": { title: "없음", artist: "-" }
};

const mainContainer = document.querySelector('.main-container');
const playlistColumn = document.querySelector('.playlist-column');
let hidden = false;

const fadeIn = (element) => {
  const originalDisplay = element.dataset.originalDisplay || getComputedStyle(element).display;
  element.style.display = originalDisplay === 'none' ? 'block' : originalDisplay;
  element.classList.remove('fade-out');
  element.classList.add('fade-in');
};

const fadeOut = (element) => {
  element.dataset.originalDisplay = getComputedStyle(element).display;
  element.classList.remove('fade-in');
  element.classList.add('fade-out');
  setTimeout(() => {
    if (element.classList.contains('fade-out')) {
      element.style.display = 'none';
    }
  }, 500);
};

// f 키를 눌렀을 때 토글
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'f') {
    if (!hidden) {
      // 👉 clockBox가 켜져 있었는지 기억해둠
      wasClockVisibleBeforeHide = clockBox.classList.contains('active');

      fadeOut(mainContainer);
      fadeOut(playlistColumn);

      if (wasClockVisibleBeforeHide) {
        clockBox.classList.remove('active');
      }

      hidden = true;

      // 👉 대기열 숨기기
      queueContainer.classList.remove('show');

    } else {
      fadeIn(mainContainer);
      fadeIn(playlistColumn);

      // 👉 clockBox가 원래 켜져 있었으면 다시 보여줌
      if (wasClockVisibleBeforeHide) {
        clockBox.classList.add('active');
      }

      hidden = false;

      // 👉 대기열 복원 (대기열이 존재할 때만)
      if (musicQueue.length > 0) {
        queueContainer.classList.add('show');
      }
    }
  }
});

// 초기 진입 시 표시
window.addEventListener('DOMContentLoaded', () => {
  mainContainer.classList.add('fade-in');
  playlistColumn.classList.add('fade-in');

  rotatingWrapper.style.display = 'block';
  rotatingWrapper.style.opacity = '1'; // ✅ 이 줄 추가
  rotatingIcon.src = 'assets/images/missing.png';
  rotatingIcon.classList.remove('rotating', 'paused');
});

const rotatingWrapper = document.getElementById('rotatingWrapper');
const rotatingIcon = document.getElementById('rotatingIcon');

function showRotatingIcon() {
  rotatingIcon.classList.remove('paused');
  rotatingIcon.classList.add('rotating');
  document.getElementById('rotatingWrapper').style.display = 'block';
}

function pauseRotatingIcon() {
  rotatingIcon.classList.add('paused');
}

function hideRotatingIcon() {
  const wrapper = document.getElementById('rotatingWrapper');
  wrapper.style.display = 'none'; // 아예 숨기기

  rotatingIcon.classList.remove('rotating', 'paused');
}   

function updateRotatingIcon(source) {
  const fileName = source.split('/').pop().replace('.mp3', '');
  const imagePath = `assets/images/${fileName}.png`;

  console.log("🔊 재생된 소스:", source);
  console.log("📁 파싱된 파일명:", fileName);
  console.log("🖼️ 이미지 경로:", imagePath);

  rotatingIcon.src = imagePath;
}

let previousTrack = null;

function playSound(src) {
  const fileName = src.split('/').pop().trim();
  const trackInfo = trackNames[fileName] || { title: "없음", artist: "-" };

  // ✅ 항상 이전 트랙 저장
  if (currentTrackSrc && currentTrackSrc !== src) {
    previousTrack = currentTrackSrc;
  }

  currentTrackSrc = src;

  // 앨범아트 갱신
  updateAlbumArt();

  // 트랙 정보 바 업데이트
  if (trackInfo && trackInfo.title && trackInfo.artist) {
    trackInfoBar.textContent = `${trackInfo.title} - ${trackInfo.artist}`;
  } else {
    trackInfoBar.textContent = "없음";
  }

  // 오디오 초기화 및 재생 준비
  audio.pause();
  audio.currentTime = 0;
  audio.src = src;

  // 회전 애니메이션 트리거
  rotatingWrapper.classList.remove('rolling-in');
  void rotatingWrapper.offsetWidth; // 강제 리플로우
  rotatingWrapper.classList.add('rolling-in');

  // 회전 아이콘 업데이트
  updateRotatingIcon(src);
  rotatingWrapper.style.display = 'block';

  // ✅ 루프 감시 중단 (중복 방지)
  stopLoopWatcher();

  // 재생 시작
  setTimeout(() => {
    audio.play().catch((err) => {
      console.error("재생 오류:", err);
      trackInfoBar.textContent = "재생 오류 발생";
    });

    updateTimeBox(); // 시간 동기화
    rotatingIcon.classList.remove('paused');
    rotatingIcon.classList.add('rotating');

    // ✅ 루프 감시 시작
    startLoopWatcher();
  }, 500);
}

rotatingIcon.onerror = function () {
  rotatingIcon.src = 'assets/images/missing.png';
};

console.log(audio.src);  // 현재 재생 중 파일 전체 경로
console.log(audio.src.split('/').pop().trim());  // 파일명만 추출

let autoShuffle = false;
let playedTracks = new Set();  // ✅ 재생된 트랙 저장용

document.getElementById('autoShuffleBtn').addEventListener('click', () => {
  autoShuffle = !autoShuffle;

  const btn = document.getElementById('autoShuffleBtn');
  btn.style.color = autoShuffle ? 'lime' : 'white';
  btn.textContent = autoShuffle ? '✅' : '♾️';

  if (autoShuffle) {
    playedTracks.clear();  // 새롭게 시작할 때는 리셋
    playRandomTrackInCurrentBox();
  } else {
    playedTracks.clear();  // ❗ 해제 시에도 리셋
  }
});

// 🔁 자동 랜덤 재생 함수 (중복 방지)
function playRandomTrackInCurrentBox() {
  const currentBox = data[currentIndex];
  const availableTracks = currentBox.tracks.filter(track => {
    const fileName = track.sound.split('/').pop();
    return trackNames[fileName] && !fileName.includes('missing') && !playedTracks.has(track.sound);
  });

  if (availableTracks.length === 0) {
    console.warn('✅ 모든 트랙이 재생되었습니다.');
    autoShuffle = false;

    const btn = document.getElementById('autoShuffleBtn');
    btn.style.color = 'white';
    btn.textContent = '♾️';
    return;
  }

  const randomIndex = Math.floor(Math.random() * availableTracks.length);
  const selectedTrack = availableTracks[randomIndex];

  playedTracks.add(selectedTrack.sound);  // ✅ 재생 기록 추가
  playSound(selectedTrack.sound);
}

// ⏹️ 곡 종료 시 자동 다음 트랙 재생
audio.addEventListener('ended', () => {
  if (autoShuffle) {
    playRandomTrackInCurrentBox();
  }
});

// 현재 박스 안에서 랜덤 재생 가능한 곡 리스트
function getValidSoundsInCurrentBox() {
  const currentBox = data[currentIndex];
  return currentBox.tracks.map(track => track.sound).filter(sound => {
    const fileName = sound.split('/').pop();
    return trackNames[fileName] && !fileName.includes('missing');
  });
}

// 회전 이미지 클릭 시 재생중 바 토글
rotatingWrapper.addEventListener('click', () => {
  trackInfoBar.classList.toggle('active');
});

// 재생중 바 클릭 시 사라지게
trackInfoBar.addEventListener('click', () => {
  trackInfoBar.classList.remove('active');
});

rotatingWrapper.style.display = 'block';

let isClockVisible = false;

playlistTitle.addEventListener('click', () => {
  if (isClockVisible) {
    clockBox.classList.remove('active');
  } else {
    clockBox.classList.add('active');
  }
  isClockVisible = !isClockVisible;
  wasClockVisibleBeforeHide = isClockVisible; // ✅ 여기 추가 (Playlist 클릭할 때도 동기화)
});

clockBox.addEventListener('click', () => {
  clockBox.classList.remove('active');
  isClockVisible = false;
  wasClockVisibleBeforeHide = false; // ✅ ClockBox 클릭할 때도 동기화
});    

let wasClockVisibleBeforeHide = false;

const rewindBtn = document.getElementById('rewindBtn');
const forwardBtn = document.getElementById('forwardBtn');

// 10초 뒤로 이동
rewindBtn.addEventListener('click', () => {
  if (audio.currentTime <= 1 && previousTrack && previousTrack !== currentTrackSrc) {
    playSound(previousTrack);
  } else if (!isNaN(audio.duration)) {
    audio.currentTime = Math.max(audio.currentTime - 10, 0);
    updateTimeText();
  }
});

// 10초 앞으로 이동
forwardBtn.addEventListener('click', () => {
  if (!isNaN(audio.duration)) {
    audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
    updateTimeText();  // 🔥 이동 즉시 시간 업데이트
  }
});

const toggleViewBtn = document.getElementById('toggleViewBtn');

toggleViewBtn.addEventListener('click', () => {
  if (!hidden) {
    fadeOut(mainContainer);
    fadeOut(playlistColumn);
    hidden = true;

    // 👉 대기열 숨기기
    queueContainer.classList.remove('show');

  } else {
    fadeIn(mainContainer);
    fadeIn(playlistColumn);
    hidden = false;

    // 👉 대기열 복원
    if (musicQueue.length > 0) {
      queueContainer.classList.add('show');
    }
  }
});

const toggleInfoBtn = document.getElementById('toggleInfoBtn');
const siteInfo = document.getElementById('siteInfo');
const backgroundThumbnails = document.getElementById('backgroundThumbnails');

toggleInfoBtn.addEventListener('click', () => {
  siteInfo.classList.toggle('active');
  backgroundThumbnails.classList.toggle('active');
});

const CURRENT_VERSION = "1.5.0 Release";  // ✨ HTML의 버전과 정확히 일치시킬 것
const visitorElement = document.getElementById('visitorCount');

// 버전 변경 시 방문자 기록 초기화
const savedVersion = localStorage.getItem('appVersion');
if (savedVersion !== CURRENT_VERSION) {
  localStorage.setItem('appVersion', CURRENT_VERSION);
  localStorage.removeItem('visitorCount');
  localStorage.removeItem('knownDevices');
  localStorage.removeItem('uniqueDeviceId');  // 고유 ID도 재생성
}

// 고유 기기 ID 저장 (한 번만 생성됨)
let deviceId = localStorage.getItem('uniqueDeviceId');
if (!deviceId) {
  deviceId = crypto.randomUUID();
  localStorage.setItem('uniqueDeviceId', deviceId);
}

// 모든 방문한 기기 ID를 저장할 Set
let knownDevices = JSON.parse(localStorage.getItem('knownDevices') || '[]');
const deviceSet = new Set(knownDevices);

// 방문자 수
let visitorCount = parseInt(localStorage.getItem('visitorCount') || '0');

// 처음 방문한 기기인 경우 증가
if (!deviceSet.has(deviceId)) {
  visitorCount += 1;
  localStorage.setItem('visitorCount', visitorCount);
  deviceSet.add(deviceId);
  localStorage.setItem('knownDevices', JSON.stringify([...deviceSet]));
}

// 화면에 출력
if (visitorElement) {
  visitorElement.textContent = visitorCount;
}

document.querySelectorAll('.bg-thumb').forEach(img => {
  img.addEventListener('click', () => {
    const bgPath = img.getAttribute('data-bg');

    // 배경 이미지 적용
    document.body.style.backgroundImage = `url('${bgPath}')`;
  });
});

// 배경별 추천 텍스트 색상
const backgroundColorMap = {
  'background.png': '#AEE2FF', 
  'assets/images/background/background1.png': '#ffe399', 
  'assets/images/background/background2.png': '#fff3b0', 
  'assets/images/background/background3.png': '#FFD166', 
  'assets/images/background/background4.png': '#F9B24E', 
  'assets/images/background/background5.png': '#c6d4f0',
  'assets/images/background/background6.png': '#ffd478',
  'assets/images/background/background7.png': '#EFBB73',
  'assets/images/background/mobile1.png': '#FFEBBB',
  'assets/images/background/mobile2.png': '#9CD3FF',
  'assets/images/background/mobile3.png': '#FFF0D4',
  'assets/images/background/mobile4.png': '#FFED73',
  'assets/images/background/mobile5.png': '#FFD9A2',
  'assets/images/background/mobile6.png': '#f5f5dc'
};

function changeBackgroundSmoothly(imagePath) {
  const overlay = document.getElementById('bgOverlay');
  const playlistTitle = document.getElementById('playlist-title');

  // 오버레이에 위치와 배경 적용
  overlay.style.backgroundImage = `url('${imagePath}')`;
  overlay.style.backgroundPosition = position;
  overlay.style.opacity = '1';

  // 600ms 후 본 배경 교체
  setTimeout(() => {
    document.body.style.backgroundImage = `url('${imagePath}')`;
    document.body.style.backgroundPosition = position;
    overlay.style.opacity = '0';
  }, 600);

  // 텍스트 색상 변경
  const newColor = backgroundColorMap[imagePath] || '#ffffff';
  playlistTitle.style.color = newColor;
}    

// 썸네일 클릭 시 이벤트 연결
document.querySelectorAll('.bg-thumb').forEach((img, index) => {
  img.addEventListener('click', () => {
    const bgPath = img.getAttribute('data-bg');
    changeBackgroundSmoothly(bgPath, index);  // ✅ 인덱스 전달!
  });
});

const backgroundPaths = [
  'background.png',
  'assets/images/background/background1.png',
  'assets/images/background/background2.png',
  'assets/images/background/background3.png',
  'assets/images/background/background4.png',
  'assets/images/background/background5.png',
  'assets/images/background/background6.png',
  'assets/images/background/background7.png',
];

let currentBackgroundIndex = 0;

function changeBackgroundSmoothly(imagePath, index = null) {
  const overlay = document.getElementById('bgOverlay');
  const playlistTitle = document.getElementById('playlist-title');

  // 배경 먼저 적용 (깜빡임 방지)
  document.body.style.backgroundImage = `url('${imagePath}')`;
  document.body.style.backgroundPosition = 'center center';
  overlay.style.backgroundPosition = 'center center';

  // 오버레이 처리
  overlay.style.backgroundImage = `url('${imagePath}')`;
  overlay.style.opacity = '1';

  // 텍스트 색상 변경
  const newColor = backgroundColorMap[imagePath] || '#ffffff';
  playlistTitle.style.color = newColor;

  // ✅ 썸네일 선택 상태 갱신
  if (index !== null) {
    currentBackgroundIndex = index;
  }

  // 600ms 후 오버레이 제거
  setTimeout(() => {
    overlay.style.opacity = '0';
  }, 600);
}

// 화살표 키로 배경 전환
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    currentBackgroundIndex = (currentBackgroundIndex + 1) % backgroundPaths.length;
    changeBackgroundSmoothly(backgroundPaths[currentBackgroundIndex], currentBackgroundIndex);
  }
  if (e.key === 'ArrowLeft') {
    currentBackgroundIndex = (currentBackgroundIndex - 1 + backgroundPaths.length) % backgroundPaths.length;
    changeBackgroundSmoothly(backgroundPaths[currentBackgroundIndex], currentBackgroundIndex);
  }
});

// 초기 선택 반영
updateSelectedThumbnail();

document.addEventListener("DOMContentLoaded", () => {
    const rotatingIcon = document.getElementById("rotatingIcon");
    const rotatingWrapper = document.getElementById("rotatingWrapper");
    const queueContainer = document.getElementById('queueContainer');
    const queueList = document.getElementById('queueList');
  
    rotatingIcon.src = 'assets/images/missing.png';
    rotatingWrapper.style.display = 'block';
  });

// Service Worker 등록 코드 예시
navigator.serviceWorker.register('/sw.js').then(reg => {
  reg.update(); // ✅ 수동으로 업데이트 요청
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered', reg))
      .catch(err => console.error('SW registration failed', err));
  });
}

// 대기열에 추가
function enqueueTrack(track) {
  console.log("[enqueueTrack] Called", track);

  if (!track || !track.sound) {
    console.warn("[enqueueTrack] Invalid track", track);
    return;
  }

  // ✅ 이전 트랙 저장
  if (currentTrackSrc) {
    previousTrack = currentTrackSrc;
  }

  const title = (track.title || "").trim();
  const artist = (track.artist || "").trim();

  // 🔒 "Missing - Unknown" 제외
  if (title === "Missing" && artist === "Unknown") {
    console.warn("[enqueueTrack] 'Missing - Unknown' 곡은 대기열에 추가되지 않습니다.");
    return;
  }

  // 🗑️ 동일한 곡이 이미 있다면 제거 (추가하지 않음)
  const index = musicQueue.findIndex(t => t.sound === track.sound);
  if (index !== -1) {
    console.log("[enqueueTrack] 이미 존재하는 곡이라 삭제:", track.title);
    musicQueue.splice(index, 1);
    updateQueueUI(); // UI 갱신 필수
    return; // 새로 추가는 하지 않음
  }

  // 📥 대기열에 새로 추가
  musicQueue.push(track);
  updateQueueUI();

  if (!currentTrackSrc || currentTrackSrc.includes('missing')) {
    console.log("[enqueueTrack] No currentTrackSrc, playing next from queue");
    playNextFromQueue();
  } else {
    console.log("[enqueueTrack] Track added to queue only");
  }
}

// 다음 곡 재생
function playNextFromQueue() {
  if (musicQueue.length > 0) {
    const nextTrack = musicQueue.shift();
    playSound(nextTrack.sound);
    updateQueueUI();
  }
}

// 곡이 끝나면 다음 대기열 곡 재생
audio.addEventListener('ended', playNextFromQueue);

function updateAlbumArt() {
  if (!currentTrackSrc) return;

  const fileName = currentTrackSrc.split('/').pop().trim();
  const track = trackNames[fileName];

  if (track && track.image) {
    rotatingIcon.src = track.image;
  } else {
    rotatingIcon.src = 'assets/images/missing.png';
  }
}

function updateSelectedThumbnail() {
  // 선택된 배경 이미지 강조하기 (선택 사항)
  document.querySelectorAll('.bg-thumb').forEach(img => {
    if (img.dataset.bg === document.body.style.backgroundImage.replace(/url\("|"\)/g, '')) {
      img.style.border = '2px solid white';
    } else {
      img.style.border = '2px solid #aaaaaa';
    }
  });
}

function updateQueueUI() {
  queueList.innerHTML = '';
  let draggedIndex = null;

  // 🔶 드래그 위치를 표시할 선 생성 (공용)
  let placeholder = document.createElement('div'); // ✅ 전역 선언
  placeholder.className = 'queue-placeholder';

  musicQueue.forEach((track, index) => {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'icon-item';
    iconWrapper.draggable = true;

    const img = document.createElement('img');
    img.src = track.image;
    img.onerror = () => img.src = 'assets/images/missing.png';

    const textWrapper = document.createElement('div');
    textWrapper.className = 'text-info';

    const titleElem = document.createElement('div');
    titleElem.className = 'song-title';
    titleElem.textContent = track.title;

    const artistElem = document.createElement('div');
    artistElem.className = 'song-artist';
    artistElem.textContent = track.artist;

    textWrapper.appendChild(titleElem);
    textWrapper.appendChild(artistElem);
    iconWrapper.appendChild(img);
    iconWrapper.appendChild(textWrapper);

    // 🎧 클릭: 재생 + 제거
    iconWrapper.addEventListener('click', () => {
      if (currentTrackSrc) {
        previousTrack = currentTrackSrc; // ✅ 꼭 수동으로 기록
      }
    
      playSound(track.sound);
      musicQueue.splice(index, 1);
      updateQueueUI();
    });

    // 🗑️ 우클릭: 제거만
    iconWrapper.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      musicQueue.splice(index, 1);
      updateQueueUI();
    });

    // 🧲 드래그 시작
    iconWrapper.addEventListener('dragstart', (e) => {
      draggedIndex = index;
      iconWrapper.classList.add('dragging');
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", ""); // 크롬 안정성 위한 빈값
    });

    // 🧲 드래그 끝
    iconWrapper.addEventListener('dragend', () => {
      iconWrapper.classList.remove('dragging');
      if (placeholder.parentNode) {
        placeholder.remove();
      }
    });

    // 🧲 드래그 중 표시선 위치 판단
    iconWrapper.addEventListener('dragover', (e) => {
      e.preventDefault();
      const bounds = iconWrapper.getBoundingClientRect();
      const offset = e.clientY - bounds.top;
      const insertBefore = offset < bounds.height / 2;
    
      if (placeholder.parentNode) {
        placeholder.remove();
      }
    
      if (insertBefore) {
        iconWrapper.parentNode.insertBefore(placeholder, iconWrapper);
      } else {
        iconWrapper.parentNode.insertBefore(placeholder, iconWrapper.nextSibling);
      }
    
      // ✅ 반드시 스크롤에 포함시키기
      placeholder.scrollIntoView({ block: 'nearest', behavior: 'auto' });

      console.log("📍 placeholder 위치", placeholder, placeholder.parentNode);
    });

    // 🧲 드롭 처리
    iconWrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      const newIndex = Array.from(queueList.children).indexOf(placeholder);
      if (draggedIndex === null || newIndex === draggedIndex) return;

      const [movedTrack] = musicQueue.splice(draggedIndex, 1);
      musicQueue.splice(newIndex, 0, movedTrack);
      draggedIndex = null;

      placeholder.remove();
      updateQueueUI();
    });

    queueList.appendChild(iconWrapper);
  });

  // 대기열 UI 표시 여부
  if (musicQueue.length > 0) {
    queueContainer.classList.add('show');
  } else {
    queueContainer.classList.remove('show');
  }
}

const clearBtn = document.getElementById('clearQueueBtn');
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    musicQueue.length = 0;
    updateQueueUI();
  });
}

function playSoundSilent(src) {
  previousTrack = currentTrackSrc;
  currentTrackSrc = src;

  audio.pause();
  audio.currentTime = 0;
  audio.src = src;

  updateAlbumArt();           // ✅ 회전 이미지 유지
  updateRotatingIcon(src);    // ✅ 디스크 이미지 유지

  setTimeout(() => {
    audio.play().catch(err => console.error("재생 오류:", err));
    updateTimeBox();
    rotatingIcon.classList.remove('paused');
    rotatingIcon.classList.add('rotating');
  }, 500);
}

const skipBtn = document.getElementById('skipBtn');

skipBtn.addEventListener('click', () => {
  if (musicQueue.length > 0) {
    const nextTrack = musicQueue.shift();
    playSound(nextTrack.sound);
    updateQueueUI();
  } else {
    // 🎲 대기열이 없을 때 → 셔플 버튼 동작 실행
    shuffleBtn?.click();
  }
});

let loopWatcherInterval = null;

function startLoopWatcher() {
  if (loopWatcherInterval) return; // 중복 방지

  loopWatcherInterval = setInterval(() => {
    const isLooping = loopBtn.classList.contains('active');
    const hasTrack = !isNaN(audio.duration);

    if (isLooping && hasTrack) {
      const nearEnd = audio.currentTime >= audio.duration - 1;

      if (nearEnd) {
        audio.currentTime = 0; // 🔁 처음으로 되돌림
        audio.play();
      }
    }
  }, 200); // 0.2초마다 체크
}

function stopLoopWatcher() {
  clearInterval(loopWatcherInterval);
  loopWatcherInterval = null;
}

let draggedItem = null;

queueList.addEventListener('dragover', (e) => {
  e.preventDefault();

  const mouseY = e.clientY;
  const children = [...queueList.querySelectorAll('.queue-item')].filter(child => child !== draggedItem && child !== placeholder);

  let inserted = false;
  for (const child of children) {
    const rect = child.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;

    // 🛠️ drag한 아이템이 위에서 아래로 내려갈 때만 보정
    const draggedRect = draggedItem.getBoundingClientRect();
    const isMovingDown = draggedRect.top < mouseY;

    // ⚠️ 아래로 이동 시, 현재 child가 draggedItem 다음이면 skip
    if (isMovingDown && child === draggedItem.nextElementSibling) {
      continue;
    }

    if (mouseY < midpoint) {
      queueList.insertBefore(placeholder, child);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    queueList.appendChild(placeholder);
  }
});
