// useAutoPlayVideoOnView.js
import { useEffect, useRef } from "react";

export function useAutoPlayVideoOnView({ enabled = true } = {}) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (!enabled) return;

        const el = videoRef.current;
        if (!el) return;

        // На всякий для iOS
        el.muted = true;
        el.defaultMuted = true;

        let hasSrcSet = !!el.currentSrc || !!el.src;
        let observer;

        try {
            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const video = entry.target;

                        // 1. Ленивая подстановка src, когда элемент хоть немного вошёл
                        if (!hasSrcSet && entry.isIntersecting && entry.intersectionRatio > 0) {
                            const dataSrc = video.getAttribute("data-src");
                            if (dataSrc) {
                                video.src = dataSrc;
                                hasSrcSet = true;
                            }
                        }

                        // 2. Управление play/pause
                        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                            video
                                .play()
                                .catch(() => {
                                    // iOS может отказать до первого пользовательского жеста — это норм
                                });
                        } else {
                            video.pause();
                        }
                    });
                },
                {
                    root: null,
                    rootMargin: "100px 0px 100px 0px",
                    threshold: [0, 0.25, 0.5, 0.75, 1],
                }
            );

            observer.observe(el);
        } catch (e) {
            // На случай старых браузеров без IntersectionObserver
            // можно добавить fallback, но для iOS Safari современных он есть
        }

        return () => {
            if (observer && el) {
                observer.unobserve(el);
                observer.disconnect();
            }
        };
    }, [enabled]);

    return videoRef;
}
