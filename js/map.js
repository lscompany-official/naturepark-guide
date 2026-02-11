const container = document.getElementById('mapContainer');
const img = document.getElementById('mapImage');
const resetBtn = document.getElementById('resetBtn');

let scale = 1;
let translateX = 0;
let translateY = 0;
const MIN_SCALE = 1;
const MAX_SCALE = 5;

// =============================================
// transform 적용
// =============================================
function applyTransform(animated = false) {
    img.style.transition = animated ? 'transform 0.3s ease' : 'none';
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// =============================================
// 이동 범위 제한 (이미지 밖으로 못 나가게)
// =============================================
function clamp() {
    const cW = container.clientWidth;
    const cH = container.clientHeight;

    const nW = img.naturalWidth || img.clientWidth;
    const nH = img.naturalHeight || img.clientHeight;
    const ratio = nW / nH;
    const cRatio = cW / cH;

    let imgW, imgH, offX, offY;
    if (ratio > cRatio) {
        imgW = cW; imgH = cW / ratio;
    } else {
        imgH = cH; imgW = cH * ratio;
    }
    offX = (cW - imgW) / 2;
    offY = (cH - imgH) / 2;

    const scaledW = imgW * scale;
    const scaledH = imgH * scale;

    const maxTx = offX * scale;
    const minTx = cW - scaledW - offX * scale;
    const maxTy = offY * scale;
    const minTy = cH - scaledH - offY * scale;

    translateX = Math.min(maxTx, Math.max(minTx, translateX));
    translateY = Math.min(maxTy, Math.max(minTy, translateY));
}

// =============================================
// 초기화
// =============================================
function resetView(animated = true) {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform(animated);
}

window.addEventListener('resize', () => resetView(false));
resetBtn.addEventListener('click', () => resetView());

// =============================================
// 핀치 줌
// =============================================
let lastPinchDist = 0;
let isPinching = false;

function dist(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}
function mid(e) {
    return {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
    };
}

// =============================================
// 드래그
// =============================================
let isDragging = false;
let lastDragX = 0, lastDragY = 0;

// =============================================
// 더블탭 (단일 터치만)
// =============================================
let lastTapTime = 0;
let lastTapCount = 0; // 터치 수 기록

container.addEventListener('touchstart', (e) => {
    e.preventDefault();

    if (e.touches.length === 2) {
        isDragging = false;
        isPinching = true;
        lastPinchDist = dist(e);
    } else if (e.touches.length === 1) {
        isDragging = true;
        isPinching = false;
        lastDragX = e.touches[0].clientX;
        lastDragY = e.touches[0].clientY;
    }

    lastTapCount = e.touches.length;
}, { passive: false });

container.addEventListener('touchmove', (e) => {
    e.preventDefault();

    if (e.touches.length === 2 && isPinching) {
        const newDist = dist(e);
        const m = mid(e);
        const delta = newDist / lastPinchDist;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * delta));

        const rect = container.getBoundingClientRect();
        const ox = m.x - rect.left;
        const oy = m.y - rect.top;

        translateX = ox - (ox - translateX) * (newScale / scale);
        translateY = oy - (oy - translateY) * (newScale / scale);
        scale = newScale;

        clamp();
        applyTransform();

        lastPinchDist = newDist;

    } else if (e.touches.length === 1 && isDragging) {
        translateX += e.touches[0].clientX - lastDragX;
        translateY += e.touches[0].clientY - lastDragY;

        clamp();
        applyTransform();

        lastDragX = e.touches[0].clientX;
        lastDragY = e.touches[0].clientY;
    }
}, { passive: false });

container.addEventListener('touchend', (e) => {
    // 핀치가 끝난 경우 → 더블탭 무시
    if (isPinching || lastTapCount === 2) {
        isPinching = false;
        isDragging = false;
        return;
    }

    // 단일 터치 더블탭 감지
    const now = Date.now();
    if (now - lastTapTime < 300) {
        resetView();
        lastTapTime = 0;
    } else {
        lastTapTime = now;
    }

    isDragging = false;
});

// =============================================
// 마우스 휠 줌 (PC)
// =============================================
document.addEventListener('wheel', (e) => {
    e.preventDefault();

    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * delta));

    const rect = container.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;

    translateX = ox - (ox - translateX) * (newScale / scale);
    translateY = oy - (oy - translateY) * (newScale / scale);
    scale = newScale;

    clamp();
    applyTransform();
}, { passive: false });
