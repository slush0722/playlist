const queueContainer = document.getElementById('queueContainer');

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('myAudio');

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const sourceNode = audioCtx.createMediaElementSource(audio);

  // 필터
  const bassFilter = audioCtx.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.value = 200;

  const midFilter = audioCtx.createBiquadFilter();
  midFilter.type = 'peaking';
  midFilter.frequency.value = 1000;
  midFilter.Q.value = 1;

  const trebleFilter = audioCtx.createBiquadFilter();
  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.value = 3000;

  const boosterGain = audioCtx.createGain();

  // 연결 구성
  sourceNode
  .connect(bassFilter)
  .connect(midFilter)
  .connect(trebleFilter)
  .connect(boosterGain)
  .connect(audioCtx.destination);

  // bass boost는 filter 게인과 분리 적용
  let bassBoostValue = 0;

  const sliderMap = {
    'eq-bass': bassFilter.gain,
    'eq-mid': midFilter.gain,
    'eq-treble': trebleFilter.gain
  };

  const sliders = [
    { id: 'eq-bass', output: 'val-bass' },
    { id: 'eq-mid', output: 'val-mid' },
    { id: 'eq-treble', output: 'val-treble' },
    { id: 'bass-boost', output: 'val-boost' }
  ];

  const previousValues = {
    'eq-bass': parseFloat(document.getElementById('eq-bass')?.value || 0),
    'eq-mid': parseFloat(document.getElementById('eq-mid')?.value || 0),
    'eq-treble': parseFloat(document.getElementById('eq-treble')?.value || 0),
  };

  sliders.forEach(({ id, output }) => {
    const slider = document.getElementById(id);
    const valueDisplay = document.getElementById(output);
    if (!slider || !valueDisplay) return;

    valueDisplay.textContent = slider.value;

    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      previousValues[id] = val;
      valueDisplay.textContent = val;
      sliderMap[id].value = id === 'bass-boost' ? val / 2 : val;
    });

    valueDisplay.addEventListener('click', () => {
      if (valueDisplay.textContent === '🔇') {
        // 복원
        const original = previousValues[id] ?? 0;
        valueDisplay.textContent = original;
        slider.value = original;

        if (id === 'bass-boost') {
          bassBoostValue = original;
          const bassVal = parseFloat(document.getElementById('eq-bass').value);
          bassFilter.gain.value = bassVal + bassBoostValue;
        } else {
          sliderMap[id].value = original;
          if (id === 'eq-bass') {
            bassFilter.gain.value = original + bassBoostValue;
          }
        }
      } else {
        // 음소거
        previousValues[id] = parseFloat(slider.value);
        valueDisplay.textContent = '🔇';
        slider.value = 0;

        if (id === 'bass-boost') {
          bassBoostValue = 0;
          const bassVal = parseFloat(document.getElementById('eq-bass').value);
          bassFilter.gain.value = bassVal; // booster 0이어도 bass 유지
        } else {
          sliderMap[id].value = 0;
          if (id === 'eq-bass') {
            bassFilter.gain.value = bassBoostValue; // bass EQ 0 + booster 유지
          }
        }
      }
    });
    
    const boosterSlider = document.getElementById('bass-boost');
    const boosterValue = document.getElementById('val-boost');

    if (boosterSlider && boosterValue) {
      boosterSlider.addEventListener('input', () => {
        bassBoostValue = parseFloat(boosterSlider.value);
        boosterValue.textContent = boosterSlider.value;

        const bassSlider = document.getElementById('eq-bass');
        const bassVal = parseFloat(bassSlider?.value || 0);
        bassFilter.gain.value = bassVal + bassBoostValue;
      });
    }
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeBoostSlider = document.getElementById('volume-boost');
    const valVolBoost = document.getElementById('val-volboost');

    let volumeBoostValue = 1;

    function calculateBoostMultiplier(boost) {
      // -10 → 0.1, -5 → 0.5, 0 → 1.0, 5 → 5.0, 10 → 10.0
      if (boost < 0) return 1 + boost / 10; // e.g. -5 → 1 - 0.5 = 0.5
      else return 1 + boost;               // e.g. 5 → 1 + 5 = 6
    }

    function applyVolumeBoost() {
      const boost = parseInt(volumeBoostSlider.value);
      volumeBoostValue = boost;
      valVolBoost.textContent = boost;

      const baseVolume = parseFloat(volumeSlider.value);
      const multiplier = calculateBoostMultiplier(boost);
      const finalVolume = baseVolume * multiplier;

      audio.volume = Math.max(0, Math.min(1, finalVolume));
    }

    volumeBoostSlider.addEventListener('input', applyVolumeBoost);
    volumeSlider.addEventListener('input', applyVolumeBoost);
  });

    // ✅ 🎛️ reset-eq-btn: 초기화 버튼
  document.querySelector('.reset-eq-btn')?.addEventListener('click', () => {
    ['eq-bass', 'eq-mid', 'eq-treble'].forEach(id => {
      const slider = document.getElementById(id);
      const valDisplay = document.getElementById(`val-${id.split('-')[1]}`);
      slider.value = 0;
      valDisplay.textContent = '0';
      previousValues[id] = 0;

      if (id === 'eq-bass') {
        bassFilter.gain.value = bassBoostValue;
      } else {
        sliderMap[id].value = 0;
      }
    });
  });

    // ✅ 🔄 restore-eq-btn: 이전값 복원 버튼
      document.querySelector('.restore-eq-btn')?.addEventListener('click', () => {
    ['eq-bass', 'eq-mid', 'eq-treble'].forEach(id => {
      const restored = previousValues[id] ?? 0;
      const slider = document.getElementById(id);
      const valDisplay = document.getElementById(`val-${id.split('-')[1]}`);

      slider.value = restored;
      valDisplay.textContent = restored;

      if (id === 'eq-bass') {
        bassFilter.gain.value = restored + bassBoostValue;
      } else {
        sliderMap[id].value = restored;
      }
    });
  });
});

let currentTrackSrc = null;
let rollingTimeout = null;

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

  // ✅ 커버 이미지도 초기화
  const albumCoverImage = document.getElementById('albumCoverImage');
  if (albumCoverImage) {
    albumCoverImage.src = 'assets/images/missing.png';
  }

  // 회전 이미지 초기화
  rotatingIcon.src = 'assets/images/missing.png';
  rotatingIcon.classList.remove('rotating', 'paused');
  rotatingWrapper.classList.remove('rolling-in');

  // ✅ transform 상태 초기화 (원래 위치로 복귀)
  rotatingWrapper.style.transform = 'translateX(0)';

  // ✅ 강제 리플로우
  void rotatingWrapper.offsetWidth;

  // ✅ 이동 애니메이션 다시 실행 + 회전
  rotatingWrapper.classList.add('rolling-in');
  rotatingIcon.classList.add('rotating');

  // ✅ 화면에 표시
  rotatingWrapper.style.display = 'block';

  // 트랙 정보 초기화
  trackInfoBar.textContent = '없음';

  // 재생/정지 아이콘 초기화
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

      if (wasClockVisibleBeforeHide) {
        clockBox.classList.remove('active');
      }

      hidden = true;

      // 👉 대기열 숨기기
      queueContainer.classList.remove('show');

    } else {
      fadeIn(mainContainer);

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

  console.log("🎧 [playSound] 시작", src);
  console.log("🎯 현재 classList:", rotatingWrapper.classList);
  console.log("🎯 초기 transform 상태:", getComputedStyle(rotatingWrapper).transform);

  // 트랙 변경 로직
  if (currentTrackSrc && currentTrackSrc !== src) {
    previousTrack = currentTrackSrc;
  }
  currentTrackSrc = src;

  resetRotatingIcon();              // 아이콘 초기화 (회전 멈춤 등)
  updateRotatingIcon(src);         // 앨범 이미지 갱신
  rotatingWrapper.style.display = 'block';

  updateAlbumArt();                // 앨범 커버 이미지 갱신
  trackInfoBar.textContent = `${trackInfo.title} - ${trackInfo.artist}`;

  // ✅ 회전 앨범 이미지 보이게 만들기
  rotatingWrapper.style.display = 'block';
  rotatingWrapper.style.opacity = '1';

  // 오디오 초기화
  audio.pause();
  audio.currentTime = 0;
  audio.src = src;

  // 🔁 애니메이션과 회전 동기화
  console.log("🔁 [rolling-in] 애니메이션 시작");

  // ✅ 애니메이션 초기화 및 중복 방지
  rotatingWrapper.classList.remove('rolling-in');
  rotatingWrapper.style.animation = 'none';       // 강제 중단
  void rotatingWrapper.offsetWidth;               // 리플로우
  rotatingWrapper.style.animation = '';           // 재활성화

  rotatingWrapper.classList.add('rolling-in');
  rotatingIcon.classList.remove('paused');
  rotatingIcon.classList.add('rotating');

  // ✅ 이전 애니메이션 고정 예약 제거
  if (rollingTimeout) {
    clearTimeout(rollingTimeout);
    rollingTimeout = null;
  }

  // 🎯 애니메이션 후 위치 고정 예약
  rollingTimeout = setTimeout(() => {
    rotatingWrapper.classList.remove('rolling-in');
    rotatingWrapper.style.transform = 'translateX(100px)';
  }, 1000); // ← 애니메이션 지속 시간과 일치

  // 🎵 오디오 재생
  audio.play().then(() => {
    console.log("✅ [play] 재생 성공:", src);
    playPauseBtn.textContent = '⏸️';

    updateTimeBox();
    startLoopWatcher();
  }).catch((err) => {
    console.error("❌ [play] 재생 오류:", err);
    trackInfoBar.textContent = "재생 오류 발생";
    playPauseBtn.textContent = '▶️';
  });
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
rotatingWrapper.addEventListener('click', (e) => {
  e.stopPropagation(); // 다른 클릭 이벤트로 전파 막음
  trackInfoBar.classList.toggle('active');
});

// 앨범 커버 클릭 시에도 재생 정보 토글 (겹쳐지더라도 둘 다 가능)
albumCoverWrapper.addEventListener('click', (e) => {
  trackInfoBar.classList.toggle('active');
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
    hidden = true;

    // 👉 대기열 숨기기
    queueContainer.classList.remove('show');

  } else {
    fadeIn(mainContainer);;
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
  requestAnimationFrame(() => {
    siteInfo.classList.toggle('active');
    backgroundThumbnails.classList.toggle('active');
  });
});

const CURRENT_VERSION = "1.5.3";  // ✨ HTML의 버전과 정확히 일치시킬 것
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

function updateAlbumArt() {
  const fileName = currentTrackSrc.split('/').pop().replace('.mp3', '');
  const imagePath = `assets/images/${fileName}.png`;

  const cover = document.getElementById('albumCoverImage');
  cover.src = imagePath;
}

function showRotatingAndPlay() {
  const wrapper = document.getElementById('rotatingWrapper');

  // 시작 상태 준비
  wrapper.classList.remove('rotating', 'rolling-in');
  wrapper.style.opacity = 0;

  // 굴러 들어오는 애니메이션 부여
  setTimeout(() => {
    wrapper.classList.add('rolling-in');
  }, 50);

  // 굴러 들어온 뒤 회전 시작
  setTimeout(() => {
    wrapper.classList.remove('rolling-in');
    wrapper.classList.add('rotating');
    audio.play(); // 음악 재생
  }, 1000); // rollInHalf 애니메이션 시간만큼 기다림
}

function resetRotatingIcon() {
  console.log("♻️ [resetRotatingIcon] 초기화 중");

  rotatingWrapper.classList.remove('rolling-in', 'rotating');
  rotatingIcon.classList.remove('rotating', 'paused');

  // 💡 단, transform이나 display 조작은 절대 X

  // 🎯 transform이나 display는 애니메이션에 맡겨야 정상 동작함
}

function animateRotatingIconIn() {
  const wrapper = document.getElementById('rotatingWrapper');
  wrapper.classList.add('rolling-in');

  setTimeout(() => {
    wrapper.classList.remove('rolling-in');
    wrapper.classList.add('rotating');
  }, 1200); // 애니메이션 길이
}

const rw = document.getElementById('rotatingWrapper');
console.log("🎯 classList:", rw.classList);
console.log("🎯 inline style.transform:", rw.style.transform);
console.log("🎯 computed transform:", getComputedStyle(rw).transform);
const anim = getComputedStyle(rotatingWrapper).animationName;
console.log("🌀 현재 animationName:", anim);
const el = document.getElementById('rotatingWrapper');
console.log('DOM 위치:', el.getBoundingClientRect());
console.log('보이는가?', getComputedStyle(el).display, getComputedStyle(el).visibility);
console.log('Transform:', getComputedStyle(el).transform);

window.addEventListener('DOMContentLoaded', () => {
  const rotatingWrapper = document.getElementById('rotatingWrapper');
  const rotatingIcon = document.getElementById('rotatingIcon');

  // ✅ 초기 위치 설정
  rotatingWrapper.style.transform = 'translate(-50%, -50%)';
  rotatingWrapper.style.top = '50%';
  rotatingWrapper.style.left = '50%';

  // ✅ 처음에는 안 보이게
  rotatingWrapper.style.display = 'none';
  rotatingWrapper.style.opacity = '0';

  // ✅ 초기 커버 디스크 이미지 세팅
  rotatingIcon.src = 'assets/images/missing.png';
  rotatingIcon.classList.remove('rotating', 'paused');

  // ✅ UI 페이드인 효과
  mainContainer.classList.add('fade-in');
});

// ✅ 스페이스바, A키, D키, S키, G키로 조작
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    playPauseBtn.click(); // 재생/일시정지
  }
  if (event.key === 'a' || event.key === 'A') {
    event.preventDefault();
    rewindBtn.click();    // 이전곡
  }
  if (event.key === 'd' || event.key === 'D') {
    event.preventDefault();
    forwardBtn.click();   // 다음곡
  }
  if (event.key === 'g' || event.key === 'G') {
    event.preventDefault();
    skipBtn.click();      // 스킵 버튼
  }
  if (event.key === 's' || event.key === 'S') {
    event.preventDefault();
    playPauseBtn.click();      // 정지 버튼
  }
  if (event.key === 'i' || event.key === 'I') {
    event.preventDefault();
    toggleInfoBtn.click(); // 정보 토글
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // ✅ localStorage에 저장된 방문자 수 가져오기
  let visitorCount = localStorage.getItem('visitorCount');

  if (!visitorCount) {
    visitorCount = 1;
  } else {
    visitorCount = parseInt(visitorCount, 10) + 1;
  }

  // ✅ 다시 저장
  localStorage.setItem('visitorCount', visitorCount);

  // ✅ 화면에 표시
  const visitorElement = document.getElementById('visitorCount');
  if (visitorElement) {
    visitorElement.textContent = visitorCount;
  }
});

// ✅ 토글 키 이벤트
let eqVisible = false;

document.addEventListener('keydown', (e) => {
  if (e.key === 'm') {
    eqVisible = !eqVisible;
    const eq = document.getElementById('equalizerContainer');
    const booster = document.getElementById('boosterContainer');

    if (eqVisible) {
      eq.style.display = 'block';

      // 베이스 부스터는 약간의 딜레이 후 표시
      setTimeout(() => {
        booster.style.display = 'block';
      }, 300); // 애니메이션 시간 고려
    } else {
      eq.style.display = 'none';
      booster.style.display = 'none';
    }
  }
});

// ✅ 슬라이더 수치 반영
const sliders = [
  { id: 'eq-bass', output: 'val-bass' },
  { id: 'eq-mid', output: 'val-mid' },
  { id: 'eq-treble', output: 'val-treble' },
  { id: 'bass-boost', output: 'val-boost' }
];

const previousValues = {
  'eq-bass': parseFloat(document.getElementById('eq-bass')?.value || 0),
  'eq-mid': parseFloat(document.getElementById('eq-mid')?.value || 0),
  'eq-treble': parseFloat(document.getElementById('eq-treble')?.value || 0),
};

sliders.forEach(({ id, output }) => {
  const slider = document.getElementById(id);
  const valueDisplay = document.getElementById(output);
  if (!slider || !valueDisplay) return;

  let isMuted = false;

  // 초기 표시
  const initialValue = parseFloat(slider.value);
  valueDisplay.textContent = initialValue;
  previousValues[id] = initialValue;

  // 🎧 슬라이더 변경 시
  slider.addEventListener('input', () => {
  const val = parseFloat(slider.value);
  previousValues[id] = val;
  valueDisplay.textContent = val;

  if (id === 'bass-boost') {
    bassBoostValue = val;
    const bassVal = parseFloat(document.getElementById('eq-bass').value);
    bassFilter.gain.value = bassVal + bassBoostValue * BOOST_MULTIPLIER;
  } else {
    sliderMap[id].value = val;
    if (id === 'eq-bass') {
      bassFilter.gain.value = val + bassBoostValue * BOOST_MULTIPLIER;
    }
  }
});

  // 🔇 숫자 클릭 시 음소거 토글
  valueDisplay.addEventListener('click', () => {
    if (isMuted) {
      const prev = previousValues[id] ?? 0;
      slider.value = prev;
      valueDisplay.textContent = prev;
      sliderMap[id].value = id === 'bass-boost' ? prev / 2 : prev;
      isMuted = false;
    } else {
      previousValues[id] = slider.value;
      slider.value = 0;
      valueDisplay.textContent = '🔇';
      sliderMap[id].value = 0;
      isMuted = true;
    }
  });
});

// 🎛️ 및 🔄 버튼 처리 (Equalizer + Booster 전부 적용)
document.querySelectorAll('#reset-eq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    sliders.forEach(({ id, output }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(output);

      previousValues[id] = parseFloat(slider.value); // 복원용 저장
      slider.value = 0;
      valueDisplay.textContent = '0';

      if (id === 'bass-boost') {
        bassBoostValue = 0;
        const bassVal = parseFloat(document.getElementById('eq-bass').value);
        bassFilter.gain.value = bassVal + bassBoostValue * BOOST_MULTIPLIER;
      } else {
        sliderMap[id].value = 0;
        if (id === 'eq-bass') {
          bassFilter.gain.value = 0 + bassBoostValue * BOOST_MULTIPLIER;
        }
      }
    });
  });
});

document.querySelectorAll('#restore-eq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    sliders.forEach(({ id, output }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(output);

      const original = previousValues[id] ?? 0;
      slider.value = original;
      valueDisplay.textContent = original;

      if (id === 'bass-boost') {
        bassBoostValue = original;
        const bassVal = parseFloat(document.getElementById('eq-bass').value);
        bassFilter.gain.value = bassVal + bassBoostValue * BOOST_MULTIPLIER;
      } else {
        sliderMap[id].value = original;
        if (id === 'eq-bass') {
          bassFilter.gain.value = original + bassBoostValue * BOOST_MULTIPLIER;
        }
      }
    });
  });
});

// 🎛️ Equalizer 리셋
document.querySelectorAll('.reset-eq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    ['eq-bass', 'eq-mid', 'eq-treble'].forEach(id => {
      const slider = document.getElementById(id);
      const valDisplay = document.getElementById('val-' + id.split('-')[1]);
      previousValues[id] = parseFloat(slider.value);
      slider.value = 0;
      valDisplay.textContent = '0';

      if (sliderMap[id]) {
        sliderMap[id].value = 0;
      }

      if (id === 'eq-bass') {
        bassFilter.gain.value = bassBoostValue * BOOST_MULTIPLIER;
      } else if (id === 'eq-mid') {
        midFilter.gain.value = 0;
      } else if (id === 'eq-treble') {
        trebleFilter.gain.value = 0;
      }
    });
  });
});

// 🔄 Equalizer 복원
document.querySelectorAll('.restore-eq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    ['eq-bass', 'eq-mid', 'eq-treble'].forEach(id => {
      const slider = document.getElementById(id);
      const valDisplay = document.getElementById('val-' + id.split('-')[1]);
      const original = previousValues[id] ?? 0;
      slider.value = original;
      valDisplay.textContent = original;

      if (sliderMap[id]) {
        sliderMap[id].value = original;
      }

      if (id === 'eq-bass') {
        bassFilter.gain.value = original + bassBoostValue * BOOST_MULTIPLIER;
      } else if (id === 'eq-mid') {
        midFilter.gain.value = original;
      } else if (id === 'eq-treble') {
        trebleFilter.gain.value = original;
      }
    });
  });
});

// 🎛️ Booster 리셋
document.querySelectorAll('.reset-boost-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const slider = document.getElementById('bass-boost');
    const display = document.getElementById('val-boost');
    previousValues['bass-boost'] = parseFloat(slider.value);
    slider.value = 0;
    display.textContent = '0';
    bassBoostValue = 0;
    const bassVal = parseFloat(document.getElementById('eq-bass').value);
    bassFilter.gain.value = bassVal;
  });
});

// 🔄 Booster 복원
document.querySelectorAll('.restore-boost-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const slider = document.getElementById('bass-boost');
    const display = document.getElementById('val-boost');
    const val = previousValues['bass-boost'] ?? 0;
    slider.value = val;
    display.textContent = val;
    bassBoostValue = val;
    const bassVal = parseFloat(document.getElementById('eq-bass').value);
    bassFilter.gain.value = bassVal + bassBoostValue * BOOST_MULTIPLIER;
  });
});

// ── M키: EQ / Booster 패널 토글 ──────────────────────────────
let isPanelVisible = false;
let isAnimatingM = false;

function showPanels() {
  if (isAnimatingM) return;
  isAnimatingM = true;
  isPanelVisible = true; // 즉시 플래그 설정 (중복 호출 방지)
  const eq = document.getElementById('equalizerContainer');
  const boost = document.getElementById('boosterContainer');

  eq.classList.remove('panel-hidden');
  boost.classList.remove('panel-hidden');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      eq.classList.add('panel-visible');
      setTimeout(() => {
        boost.classList.add('panel-visible');
        isAnimatingM = false;
      }, 60);
    });
  });
}

function hidePanels() {
  if (isAnimatingM) return;
  isAnimatingM = true;
  isPanelVisible = false; // 즉시 플래그 설정
  const eq = document.getElementById('equalizerContainer');
  const boost = document.getElementById('boosterContainer');

  eq.classList.remove('panel-visible');
  boost.classList.remove('panel-visible');
  eq.classList.add('panel-hidden');
  boost.classList.add('panel-hidden');

  setTimeout(() => {
    isAnimatingM = false;
  }, 450);
}

document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'm') {
    if (isPanelVisible) {
      hidePanels();
    } else {
      showPanels();
    }
  }
});


function toggleUI() {
  const hideable = document.querySelector('.hideable');
  const isHidden = hideable.classList.contains('fade-out');

  if (isHidden) {
    hideable.classList.remove('fade-out');
    hideable.classList.add('fade-in');
  } else {
    hideable.classList.remove('fade-in');
    hideable.classList.add('fade-out');
    // 패널이 열려있으면 같이 닫기
    if (isPanelVisible) hidePanels();
  }
}

const isHidden = queueContainer.classList.contains('fade-out');

if (isHidden) {
  queueContainer.classList.remove('fade-out');
  queueContainer.classList.add('fade-in');
} else {
  queueContainer.classList.remove('fade-in');
  queueContainer.classList.add('fade-out');
}
// ══════════════════════════════════════
// 🎵 Spotify 위젯 (OAuth PKCE + API)
// ══════════════════════════════════════
(function () {

  // ── 설정 ─────────────────────────────────────────────────────
  // ⚠️ Spotify Developer Dashboard에서 앱 만든 뒤 아래 두 값을 교체하세요
  // Redirect URI도 Dashboard에 등록 필요: 현재 페이지 URL 그대로
  const SPOTIFY_CLIENT_ID = '440affc728314810a90812eb4abb1651';
  const REDIRECT_URI      = window.location.origin + window.location.pathname;

  const SCOPES = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
  ].join(' ');

  // ── DOM ──────────────────────────────────────────────────────
  const spotifySideBtn      = document.getElementById('spotifySideBtn');
  const spotifyPanel        = document.getElementById('spotifyPanel');
  const spotifyCloseBtn     = document.getElementById('spotifyCloseBtn');
  const spotifyLoginBtn     = document.getElementById('spotifyLoginBtn');
  const spotifyLoginBigBtn  = document.getElementById('spotifyLoginBigBtn');
  const spotifyLogoutBtn    = document.getElementById('spotifyLogoutBtn');
  const spotifyUserInfo     = document.getElementById('spotifyUserInfo');
  const spotifyLoginPrompt  = document.getElementById('spotifyLoginPrompt');
  const spotifyLoggedIn     = document.getElementById('spotifyLoggedIn');
  const spotifyUriInput     = document.getElementById('spotifyUriInput');
  const spotifyLoadBtn      = document.getElementById('spotifyLoadBtn');
  const spotifySearchInput  = document.getElementById('spotifySearchInput');
  const spotifySearchBtn    = document.getElementById('spotifySearchBtn');
  const spotifySearchResults= document.getElementById('spotifySearchResults');
  const spotifyMyPlaylists  = document.getElementById('spotifyMyPlaylists');
  const spotifySavedTracks  = document.getElementById('spotifySavedTracks');
  const spotifyEmbed        = document.getElementById('spotifyEmbed');

  let isSpotifyOpen = false;
  let accessToken   = null;

  // ── 패널 토글 ────────────────────────────────────────────────
  function openPanel()  { spotifyPanel.classList.remove('hidden-panel'); spotifySideBtn.classList.add('active'); isSpotifyOpen = true; }
  function closePanel() { spotifyPanel.classList.add('hidden-panel');    spotifySideBtn.classList.remove('active'); isSpotifyOpen = false; }

  if (!spotifySideBtn || !spotifyPanel) return; // 요소 없으면 중단
  spotifySideBtn.addEventListener('click', () => isSpotifyOpen ? closePanel() : openPanel());
  spotifyCloseBtn && spotifyCloseBtn.addEventListener('click', closePanel);

  // ── PKCE 유틸 ────────────────────────────────────────────────
  function generateRandom(len) {
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => ('0' + b.toString(16)).slice(-2)).join('');
  }
  async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return crypto.subtle.digest('SHA-256', data);
  }
  function base64UrlEncode(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // ── 로그인 (PKCE) ─────────────────────────────────────────────
  async function startLogin() {
    if (!SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
      alert('⚠️ sc.js의 SPOTIFY_CLIENT_ID를 입력해주세요.');
      return;
    }
    const verifier  = generateRandom(64);
    const challenge = base64UrlEncode(await sha256(verifier));
    const state     = generateRandom(16);

    sessionStorage.setItem('spotify_verifier', verifier);
    sessionStorage.setItem('spotify_state',    state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     SPOTIFY_CLIENT_ID,
      scope:         SCOPES,
      redirect_uri:  REDIRECT_URI,
      state,
      code_challenge_method: 'S256',
      code_challenge:        challenge,
    });
    window.location.href = 'https://accounts.spotify.com/authorize?' + params;
  }

  // ── 콜백 처리 (페이지 로드 시) ───────────────────────────────
  async function handleCallback() {
    const params   = new URLSearchParams(window.location.search);
    const code     = params.get('code');
    const state    = params.get('state');
    const verifier = sessionStorage.getItem('spotify_verifier');
    const savedState = sessionStorage.getItem('spotify_state');

    if (!code || !verifier || state !== savedState) return;

    // URL에서 파라미터 제거 (히스토리 클린업)
    window.history.replaceState({}, '', window.location.pathname);
    sessionStorage.removeItem('spotify_verifier');
    sessionStorage.removeItem('spotify_state');

    try {
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:    'authorization_code',
          code,
          redirect_uri:  REDIRECT_URI,
          client_id:     SPOTIFY_CLIENT_ID,
          code_verifier: verifier,
        }),
      });
      const data = await res.json();
      if (data.access_token) {
        accessToken = data.access_token;
        // 만료 시간 저장 (초 단위)
        const expiresAt = Date.now() + data.expires_in * 1000;
        localStorage.setItem('spotify_token',      accessToken);
        localStorage.setItem('spotify_expires_at', expiresAt);
        if (data.refresh_token) localStorage.setItem('spotify_refresh', data.refresh_token);
        await onLoggedIn();
        openPanel();
      }
    } catch (e) { console.error('Spotify token error', e); }
  }

  // ── 저장된 토큰 복원 ─────────────────────────────────────────
  function loadStoredToken() {
    const token   = localStorage.getItem('spotify_token');
    const expires = parseInt(localStorage.getItem('spotify_expires_at') || '0');
    if (token && Date.now() < expires) {
      accessToken = token;
      return true;
    }
    return false;
  }

  // ── 로그인 상태 UI 전환 ───────────────────────────────────────
  async function onLoggedIn() {
    spotifyLoginPrompt.style.display  = 'none';
    spotifyLoggedIn.style.display     = 'block';
    spotifyLoginBtn.style.display     = 'none';
    spotifyLogoutBtn.style.display    = '';
    spotifyUserInfo.style.display     = '';

    // 사용자 정보
    try {
      const me = await spotifyApi('/me');
      spotifyUserInfo.textContent = me.display_name || me.id;
    } catch(e) {}

    loadMyPlaylists();
    loadSavedTracks();
  }

  function onLoggedOut() {
    accessToken = null;
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_expires_at');
    localStorage.removeItem('spotify_refresh');
    spotifyLoginPrompt.style.display  = '';
    spotifyLoggedIn.style.display     = 'none';
    spotifyLoginBtn.style.display     = '';
    spotifyLogoutBtn.style.display    = 'none';
    spotifyUserInfo.style.display     = 'none';
    spotifyUserInfo.textContent       = '';
  }

  // ── Spotify API 헬퍼 ─────────────────────────────────────────
  async function spotifyApi(path, params = {}) {
    const url = new URL('https://api.spotify.com/v1' + path);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    const res = await fetch(url, {
      headers: { Authorization: 'Bearer ' + accessToken }
    });
    if (!res.ok) throw new Error(res.status);
    return res.json();
  }

  // ── 탭 전환 ──────────────────────────────────────────────────
  document.querySelectorAll('.spotify-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.spotify-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.spotify-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('spotifyTab' + capitalize(tab.dataset.tab)).classList.add('active');
    });
  });
  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ── embed 로드 ────────────────────────────────────────────────
  function loadEmbed(uri) {
    // uri 예: spotify:track:xxx  또는  spotify:playlist:xxx
    const parts = uri.split(':');
    if (parts.length < 3) return;
    const url = `https://open.spotify.com/embed/${parts[1]}/${parts[2]}?utm_source=generator&theme=0`;
    spotifyEmbed.src = url;
    spotifyEmbed.style.display = 'block';

    // 레코드판 업데이트 시도 (트랙인 경우)
    if (parts[1] === 'track' && accessToken) {
      spotifyApi('/tracks/' + parts[2]).then(track => {
        const img = track?.album?.images?.[0]?.url;
        if (img) syncAlbumArt(img, track.name, track.artists?.[0]?.name);
      }).catch(()=>{});
    }
  }

  function syncAlbumArt(imgUrl, name, artist) {
    const rIcon   = document.getElementById('rotatingIcon');
    const albumImg= document.getElementById('albumCoverImage');
    const bar     = document.getElementById('trackInfoBar');
    const rWrapper= document.getElementById('rotatingWrapper');
    if (imgUrl)  { rIcon.src = imgUrl; if(albumImg) albumImg.src = imgUrl; }
    if (bar)     { bar.textContent = `🎵 ${name||'Spotify'} - ${artist||''}`; bar.classList.add('active'); }
    if (rWrapper){ rWrapper.style.display = 'block'; rWrapper.classList.add('spotify-mode'); }
    const rIconEl = document.getElementById('rotatingIcon');
    if (rIconEl) { rIconEl.classList.remove('paused'); rIconEl.classList.add('rotating'); }
  }

  // ── URL 직접 입력 ─────────────────────────────────────────────
  function parseUri(raw) {
    raw = raw.trim();
    const m = raw.match(/open\.spotify\.com\/(playlist|album|track|artist)\/([A-Za-z0-9]+)/);
    if (m) return `spotify:${m[1]}:${m[2]}`;
    if (/^spotify:(playlist|album|track|artist):[A-Za-z0-9]+$/.test(raw)) return raw;
    return null;
  }
  spotifyLoadBtn && spotifyLoadBtn.addEventListener('click', () => {
    const uri = parseUri(spotifyUriInput.value);
    if (uri) loadEmbed(uri);
    else alert('올바른 Spotify URL을 입력해주세요.');
  });
  spotifyUriInput && spotifyUriInput.addEventListener('keydown', e => { if(e.key==='Enter') spotifyLoadBtn.click(); });

  // ── 검색 ─────────────────────────────────────────────────────
  spotifySearchBtn && spotifySearchBtn.addEventListener('click', doSearch);
  spotifySearchInput && spotifySearchInput.addEventListener('keydown', e => { if(e.key==='Enter') doSearch(); });

  async function doSearch() {
    const q = spotifySearchInput.value.trim();
    if (!q || !accessToken) return;
    spotifySearchResults.innerHTML = '<div class="spotify-list-loading">검색 중...</div>';
    try {
      const data = await spotifyApi('/search', { q, type: 'track,playlist', limit: 20 });
      const items = [
        ...(data.tracks?.items  || []).map(t => ({ type:'track',    id:t.id, name:t.name, sub: t.artists?.map(a=>a.name).join(', '), img: t.album?.images?.[2]?.url || t.album?.images?.[0]?.url })),
        ...(data.playlists?.items||[]).map(p => ({ type:'playlist', id:p.id, name:p.name, sub: `${p.tracks?.total||0}곡`, img: p.images?.[0]?.url })),
      ];
      renderList(spotifySearchResults, items);
    } catch(e) { spotifySearchResults.innerHTML = '<div class="spotify-list-empty">검색 실패</div>'; }
  }

  // ── 내 플레이리스트 ───────────────────────────────────────────
  async function loadMyPlaylists() {
    spotifyMyPlaylists.innerHTML = '<div class="spotify-list-loading">불러오는 중...</div>';
    try {
      const data = await spotifyApi('/me/playlists', { limit: 50 });
      const items = (data.items||[]).map(p => ({
        type:'playlist', id:p.id, name:p.name,
        sub: `${p.tracks?.total||0}곡`,
        img: p.images?.[0]?.url
      }));
      renderList(spotifyMyPlaylists, items);
    } catch(e) { spotifyMyPlaylists.innerHTML = '<div class="spotify-list-empty">불러오기 실패</div>'; }
  }

  // ── 좋아요 곡 ─────────────────────────────────────────────────
  async function loadSavedTracks() {
    spotifySavedTracks.innerHTML = '<div class="spotify-list-loading">불러오는 중...</div>';
    try {
      const data = await spotifyApi('/me/tracks', { limit: 50 });
      const items = (data.items||[]).map(({ track: t }) => ({
        type:'track', id:t.id, name:t.name,
        sub: t.artists?.map(a=>a.name).join(', '),
        img: t.album?.images?.[2]?.url || t.album?.images?.[0]?.url
      }));
      renderList(spotifySavedTracks, items);
    } catch(e) { spotifySavedTracks.innerHTML = '<div class="spotify-list-empty">불러오기 실패</div>'; }
  }

  // ── 리스트 렌더 ───────────────────────────────────────────────
  function renderList(container, items) {
    if (!items.length) { container.innerHTML = '<div class="spotify-list-empty">결과 없음</div>'; return; }
    container.innerHTML = '';
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'spotify-list-item';
      btn.innerHTML = `
        <img src="${item.img || ''}" onerror="this.style.display='none'" alt="">
        <div class="spotify-list-item-info">
          <div class="spotify-list-item-title">${item.name}</div>
          <div class="spotify-list-item-sub">${item.sub || ''}</div>
        </div>
      `;
      btn.addEventListener('click', () => loadEmbed(`spotify:${item.type}:${item.id}`));
      container.appendChild(btn);
    });
  }

  // ── 로그인/로그아웃 버튼 ─────────────────────────────────────
  [spotifyLoginBtn, spotifyLoginBigBtn].forEach(btn => btn && btn.addEventListener('click', startLogin));
  spotifyLogoutBtn && spotifyLogoutBtn.addEventListener('click', onLoggedOut);

  // ── 초기화 (페이지 로드) ─────────────────────────────────────
  (async function init() {
    // 1) OAuth 콜백 처리
    if (window.location.search.includes('code=')) {
      await handleCallback();
      return;
    }
    // 2) 저장된 토큰 복원
    if (loadStoredToken()) {
      await onLoggedIn();
    }
  })();

})(); // Spotify IIFE
