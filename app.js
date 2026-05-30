const video = document.getElementById("camera");
const stage = document.getElementById("stage");
const cursor = document.getElementById("cursor");
const cameraStatus = document.getElementById("cameraStatus");
const gestureStatus = document.getElementById("gestureStatus");
const photoLayer = document.getElementById("photoLayer");

let pinchArmed = true;
let currentPhoto = null;

const photos = [];

const entryAnimations = [
  "enter-zoom",
  "enter-slide-left",
  "enter-slide-up",
  "enter-spin",
  "enter-flip",
  "enter-focus",
];

function showRandomPhoto() {
  if (!photos.length) {
    gestureStatus.textContent = "星光暂停，等待你发送照片";
    return;
  }

  const image = document.createElement("img");
  const animation = entryAnimations[Math.floor(Math.random() * entryAnimations.length)];
  image.className = `photo-image ${animation}`;
  image.src = photos[Math.floor(Math.random() * photos.length)];
  image.alt = "随机照片";
  photoLayer.replaceChildren(image);
  currentPhoto = image;
}

function hidePhoto() {
  if (!currentPhoto) return;
  const image = currentPhoto;
  currentPhoto = null;
  image.classList.add("exit");
  window.setTimeout(() => {
    if (photoLayer.contains(image)) {
      image.remove();
    }
  }, 240);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function onResults(results) {
  if (!results.multiHandLandmarks?.length) {
    gestureStatus.textContent = "没有检测到手";
    stage.classList.remove("paused");
    hidePhoto();
    return;
  }

  const hand = results.multiHandLandmarks[0];
  const pinchDistance = distance(hand[8], hand[4]);
  const isPinching = pinchDistance < 0.055;
  stage.classList.toggle("paused", isPinching);
  cursor.classList.toggle("pinch", isPinching);

  if (isPinching && pinchArmed) {
    pinchArmed = false;
    gestureStatus.textContent = "星光暂停，照片出现";
    showRandomPhoto();
  }

  if (!isPinching) {
    pinchArmed = true;
    gestureStatus.textContent = "张开手，等待闭合";
    hidePhoto();
  }
}

async function start() {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.65,
  });

  hands.onResults(onResults);

  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: 1280,
    height: 720,
  });

  await camera.start();
  cameraStatus.textContent = "摄像头已启动";
}

start().catch((error) => {
  cameraStatus.textContent = "摄像头启动失败";
  gestureStatus.textContent = error.message;
});
