const container = document.getElementById('mapContainer');
const img = document.getElementById('mapImage');
const resetBtn = document.getElementById('resetBtn');

// 현재 상태
let scale = 1;
let translateX = 0;
let translateY = 0;

// 이미지 렌더링 크기
let imgW = 0, imgH = 0, imgOffsetX = 0, imgOffsetY = 0;

const MIN_SCALE = 1;
const MAX_SCALE = 5;

// 이미지 렌더링 크기 계산
function calcImageSize() {
    const cW = container.clientWidth;
    const cH = container.clientHeight;
    const nW = img.naturalWidth || cW;
    const nH = img.naturalHeight || cH;
    const ratio = nW / nH;
    const containerRatio = cW / cH;

    if (ratio > containerRatio) {
        imgW = cW;
        imgH = cW / ratio;
    } else {
        imgH = cH;
        imgW = cH * ratio;
    }

    imgOffsetX = (cW - imgW) / 2;
    imgOffsetY = (cH - imgH) / 2;
}

// transform 적용
function applyTransform(animated = false) {
    img.style.transition = animated ? 'transform 0.3s ease' : 'none';
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// 이동 범위 제한
function clampTranslate() {
    const cW = container.clientWidth;
    const cH = container.clientHeight;
    const scaledW = imgW * scale;
    const scaledH = imgH * scale;

    const minX = scaledW >= cW ? -(scaledW - cW) : (cW - scaledW) / 2 - imgOffsetX * scale;
    const maxX = scaledW >= cW ? 0 : (cW - scaledW) / 2 - imgOffsetX * scale;
    const minY = scaledH >= cH ? -(scaledH - cH) : (cH - scaledH) / 2 - imgOffsetY * scale;
    const maxY = scaledH >= cH ? 0 : (cH - scaledH) / 2 - imgOffsetY * scale;

    translateX = Math.min(maxX, Math.max(minX - imgOffsetX * (scale - 1), translateX));
    translateY = Math.min(maxY, Math.max(minY - imgOffsetY * (scale - 1), translateY));
}

// 초기화
function resetView(animated = true) {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform(animated);
}

// 이미지 로드 후 크기 계산
img.addEventListener('load', calcImageSize);
window.addEventListener('resize', () => {
    calcImageSize();
    resetView(false);
});

// =============================================
// 핀치 줌 (두 손가락)
// =============================================
let lastPinchDist = 0;

function getPinchDist(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function getPinchMid(e) {
    return {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
    };
}

// =============================================
// 드래그 (한 손가락)
// =============================================
let isDragging = false;
let lastDragX = 0, lastDragY = 0;

container.addEventListener('touchstart', (e) => {
    e.preventDefault();

    if (e.touches.length === 2) {
        isDragging = false;
        lastPinchDist = getPinchDist(e);
    } else if (e.touches.length === 1) {
        isDragging = true;
        lastDragX = e.touches[0].clientX;
        lastDragY = e.touches[0].clientY;
    }
}, { passive: false });

container.addEventListener('touchmove', (e) => {
    e.preventDefault();

    if (e.touches.length === 2) {
        // 핀치 줌
        const dist = getPinchDist(e);
        const mid = getPinchMid(e);
        const delta = dist / lastPinchDist;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * delta));

        const rect = container.getBoundingClientRect();
        const originX = mid.x - rect.left;
        const originY = mid.y - rect.top;

        translateX = originX - (originX - translateX) * (newScale / scale);
        translateY = originY - (originY - translateY) * (newScale / scale);
        scale = newScale;

        clampTranslate();
        applyTransform();

        lastPinchDist = dist;

    } else if (e.touches.length === 1 && isDragging) {
        // 드래그 이동
        translateX += e.touches[0].clientX - lastDragX;
        translateY += e.touches[0].clientY - lastDragY;

        clampTranslate();
        applyTransform();

        lastDragX = e.touches[0].clientX;
        lastDragY = e.touches[0].clientY;
    }
}, { passive: false });

container.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) isDragging = false;
    // ❌ resetView() 제거 - 손가락 떼도 줌 상태 유지
});

// 더블탭으로 줌 리셋
let lastTap = 0;
container.addEventListener('touchend', () => {
    const now = Date.now();
    if (now - lastTap < 300) resetView();
    lastTap = now;
});

// 리셋 버튼
resetBtn.addEventListener('click', () => resetView());

// 마우스 휠 줌 (PC 테스트용) - window에 달아야 작동
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * delta));
    const rect = container.getBoundingClientRect();
    const originX = e.clientX - rect.left;
    const originY = e.clientY - rect.top;

    translateX = originX - (originX - translateX) * (newScale / scale);
    translateY = originY - (originY - translateY) * (newScale / scale);
    scale = newScale;

    clampTranslate();
    applyTransform();
}, { passive: false });
