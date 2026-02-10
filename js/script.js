function fitClickableAreas() {
    const overlayImage = document.querySelector('.overlay-image');
    const clickableAreas = document.querySelector('.clickable-areas');
    if (!overlayImage || !clickableAreas) return;

    const containerW = window.innerWidth;
    const containerH = window.innerHeight;

    // overlay 이미지 원본 비율 (390:700)
    const imgRatio = 390 / 700;
    const containerRatio = containerW / containerH;

    let renderedW, renderedH, offsetX, offsetY;

    if (containerRatio > imgRatio) {
        // 화면이 더 넓음 → 높이 기준으로 맞춰짐
        renderedH = containerH;
        renderedW = containerH * imgRatio;
        offsetX = (containerW - renderedW) / 2;
        offsetY = 0;
    } else {
        // 화면이 더 좁음 → 너비 기준으로 맞춰짐
        renderedW = containerW;
        renderedH = containerW / imgRatio;
        offsetX = 0;
        offsetY = (containerH - renderedH) / 2;
    }

    // clickable-areas를 overlay 이미지 위치/크기에 정확히 맞춤
    clickableAreas.style.width = `${renderedW}px`;
    clickableAreas.style.height = `${renderedH}px`;
    clickableAreas.style.left = `${offsetX}px`;
    clickableAreas.style.top = `${offsetY}px`;
}

// 로드 & 리사이즈 시 재계산
window.addEventListener('resize', fitClickableAreas);
window.addEventListener('load', fitClickableAreas);
document.addEventListener('DOMContentLoaded', fitClickableAreas);

// =============================================
// 페이지 전환 효과 (View Transitions API)
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const links = document.querySelectorAll('a:not([target="_blank"])');

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('javascript:')) {
                return;
            }

            e.preventDefault();

            if (document.startViewTransition) {
                document.startViewTransition(() => {
                    window.location.href = href;
                });
            } else {
                const container = document.querySelector('.container');
                container.classList.remove('fade-enter');
                container.classList.add('fade-exit');
                setTimeout(() => { window.location.href = href; }, 400);
            }
        });
    });
});

// 터치 피드백
document.addEventListener('touchstart', function () { }, { passive: true });
