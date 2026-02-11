const container = document.getElementById('mapContainer');
const img = document.getElementById('mapImage');
const resetBtn = document.getElementById('resetBtn');

let scale = 1;
let posX = 0;
let posY = 0;
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_SENSITIVITY = 0.1;

// =============================================
// Transform 적용
// =============================================
function updateTransform(animated = false) {
    img.style.transition = animated ? 'transform 0.3s ease-out' : 'none';
    img.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}

// =============================================
// 경계 제한 (이미지가 화면 밖으로 나가지 않도록)
// =============================================
function constrainPosition() {
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // 확대된 이미지의 실제 크기
    const scaledWidth = imgRect.width;
    const scaledHeight = imgRect.height;
    
    // 컨테이너 크기
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // 이미지가 컨테이너보다 작으면 중앙 정렬
    if (scaledWidth <= containerWidth) {
        posX = 0;
    } else {
        // 이미지가 컨테이너보다 크면 경계 제한
        const maxX = (scaledWidth - containerWidth) / 2;
        posX = Math.max(-maxX, Math.min(maxX, posX));
    }
    
    if (scaledHeight <= containerHeight) {
        posY = 0;
    } else {
        const maxY = (scaledHeight - containerHeight) / 2;
        posY = Math.max(-maxY, Math.min(maxY, posY));
    }
}

// =============================================
// 초기화
// =============================================
function resetView(animated = true) {
    scale = 1;
    posX = 0;
    posY = 0;
    updateTransform(animated);
}

// 창 크기 변경 시 초기화
window.addEventListener('resize', () => {
    resetView(false);
});

// 리셋 버튼 (주석 처리되어 있지만 기능 유지)
if (resetBtn) {
    resetBtn.addEventListener('click', () => resetView());
}

// =============================================
// 터치 관련 유틸리티 함수
// =============================================
function getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function getTouchCenter(touch1, touch2) {
    return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
    };
}

// =============================================
// 핀치 줌 (모바일)
// =============================================
let initialDistance = 0;
let initialScale = 1;
let isPinching = false;
let pinchCenter = { x: 0, y: 0 };

// 드래그 관련 변수
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartPosX = 0;
let dragStartPosY = 0;

// 더블탭 관련 변수
let lastTapTime = 0;
const DOUBLE_TAP_DELAY = 300;

// =============================================
// 터치 이벤트 핸들러
// =============================================
container.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    const touches = e.touches;
    
    if (touches.length === 2) {
        // 핀치 줌 시작
        isPinching = true;
        isDragging = false;
        
        initialDistance = getTouchDistance(touches[0], touches[1]);
        initialScale = scale;
        pinchCenter = getTouchCenter(touches[0], touches[1]);
        
    } else if (touches.length === 1) {
        // 드래그 또는 더블탭
        const touch = touches[0];
        const currentTime = Date.now();
        
        // 더블탭 감지
        if (currentTime - lastTapTime < DOUBLE_TAP_DELAY) {
            resetView();
            lastTapTime = 0;
            return;
        }
        lastTapTime = currentTime;
        
        // 드래그 시작
        if (!isPinching) {
            isDragging = true;
            dragStartX = touch.clientX;
            dragStartY = touch.clientY;
            dragStartPosX = posX;
            dragStartPosY = posY;
        }
    }
}, { passive: false });

container.addEventListener('touchmove', (e) => {
    e.preventDefault();
    
    const touches = e.touches;
    
    if (touches.length === 2 && isPinching) {
        // 핀치 줌 진행
        const currentDistance = getTouchDistance(touches[0], touches[1]);
        const currentCenter = getTouchCenter(touches[0], touches[1]);
        
        // 스케일 변화 계산
        const scaleChange = currentDistance / initialDistance;
        let newScale = initialScale * scaleChange;
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        
        // 줌 중심점을 기준으로 위치 조정
        const containerRect = container.getBoundingClientRect();
        const centerX = currentCenter.x - containerRect.left - containerRect.width / 2;
        const centerY = currentCenter.y - containerRect.top - containerRect.height / 2;
        
        // 새로운 위치 계산 (중심점 유지)
        const scaleRatio = newScale / scale;
        posX = centerX - (centerX - posX) * scaleRatio;
        posY = centerY - (centerY - posY) * scaleRatio;
        scale = newScale;
        
        constrainPosition();
        updateTransform();
        
    } else if (touches.length === 1 && isDragging && !isPinching) {
        // 드래그 진행
        const touch = touches[0];
        const deltaX = touch.clientX - dragStartX;
        const deltaY = touch.clientY - dragStartY;
        
        posX = dragStartPosX + deltaX;
        posY = dragStartPosY + deltaY;
        
        constrainPosition();
        updateTransform();
    }
}, { passive: false });

container.addEventListener('touchend', (e) => {
    const touches = e.touches;
    
    if (touches.length < 2) {
        isPinching = false;
    }
    
    if (touches.length === 0) {
        isDragging = false;
    }
});

container.addEventListener('touchcancel', () => {
    isPinching = false;
    isDragging = false;
});

// =============================================
// 마우스 이벤트 (PC)
// =============================================
let isMouseDragging = false;
let mouseStartX = 0;
let mouseStartY = 0;
let mouseDragStartPosX = 0;
let mouseDragStartPosY = 0;

container.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isMouseDragging = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    mouseDragStartPosX = posX;
    mouseDragStartPosY = posY;
    img.style.cursor = 'grabbing';
});

container.addEventListener('mousemove', (e) => {
    if (!isMouseDragging) return;
    
    e.preventDefault();
    const deltaX = e.clientX - mouseStartX;
    const deltaY = e.clientY - mouseStartY;
    
    posX = mouseDragStartPosX + deltaX;
    posY = mouseDragStartPosY + deltaY;
    
    constrainPosition();
    updateTransform();
});

container.addEventListener('mouseup', () => {
    isMouseDragging = false;
    img.style.cursor = 'grab';
});

container.addEventListener('mouseleave', () => {
    isMouseDragging = false;
    img.style.cursor = 'grab';
});

// =============================================
// 마우스 휠 줌 (PC)
// =============================================
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left - containerRect.width / 2;
    const mouseY = e.clientY - containerRect.top - containerRect.height / 2;
    
    // 휠 방향에 따라 확대/축소
    const delta = e.deltaY > 0 ? -ZOOM_SENSITIVITY : ZOOM_SENSITIVITY;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * (1 + delta)));
    
    // 마우스 위치를 중심으로 확대/축소
    const scaleRatio = newScale / scale;
    posX = mouseX - (mouseX - posX) * scaleRatio;
    posY = mouseY - (mouseY - posY) * scaleRatio;
    scale = newScale;
    
    constrainPosition();
    updateTransform();
}, { passive: false });

// =============================================
// 초기 로드 시 이미지가 로드된 후 설정
// =============================================
img.addEventListener('load', () => {
    resetView(false);
});

// 이미지가 이미 로드된 경우
if (img.complete) {
    resetView(false);
}
