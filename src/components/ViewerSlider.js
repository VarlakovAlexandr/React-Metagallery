// ViewerSlider.jsx
import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Zoom, Navigation } from 'swiper/modules';
import ViewerSlide from './ViewerSlide';
import { Range, Direction } from 'react-range';

function ViewerSlider({
    mediaList,
    initialIndex = 0,
    onClose,
    activeTooltip,
    onTooltipClick,
    itemsShownText
}) {
    const MIN_ZOOM = 1;
    const MAX_ZOOM = 3.1;
    const STEP_ZOOM = 0.1;

    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const swiperRef = useRef(null);
    const [zoomValue, setZoomValue] = useState(1);
    const [isZoomed, setIsZoomed] = useState(false); // <-- новое состояние
    
    const prevIndexRef = useRef(initialIndex);





    const handleZoomChange = useCallback((values) => {
        const raw = values[0];
        const value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, raw));

        const swiper = swiperRef.current;
        if (!swiper || !swiper.zoom) {
            setZoomValue(value);
            return;
        }

        const zoom = swiper.zoom;

        if (value === MIN_ZOOM) {
            zoom.out();
            setZoomValue(MIN_ZOOM);
            return;
        }

        // задаём нужный zoom ratio через Swiper
        zoom.in(value);
        setZoomValue(value);
    }, []);

    const handlePlusClick = () => {
        setZoomValue((prev) => {
            const next = Math.min(prev + STEP_ZOOM, MAX_ZOOM);
            handleZoomChange([next]);
            return next;
        });
    };

    const handleMinusClick = () => {
        setZoomValue((prev) => {
            const next = Math.max(prev - STEP_ZOOM, MIN_ZOOM);
            handleZoomChange([next]);
            return next;
        });
    };
    useEffect(() => {
        // создаём тег <style>
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-viewer-style', 'hide-jdiv');
        styleEl.textContent = `
            jdiv {
                display: none !important;
            }
        `;

        document.head.appendChild(styleEl);

        return () => {
            // при размонтировании удаляем добавленный стиль
            if (styleEl.parentNode) {
                styleEl.parentNode.removeChild(styleEl);
            }
        };
    }, []);

    useEffect(() => {
        document.body.classList.add('media-viewer-open', 'gallery-fullscreen-mode');
        document.documentElement.classList.add('gallery-fullscreen-mode');

        return () => {
            document.body.classList.remove('media-viewer-open', 'gallery-fullscreen-mode');
            document.documentElement.classList.remove('gallery-fullscreen-mode');
        };
    }, []);

    useEffect(() => {
        const swiper = swiperRef.current;
        if (!swiper || !swiper.zoom) return;

        const onZoomChange = (swiperInstance, scale /*, imageEl, slideEl */) => {
            setZoomValue(scale);    // храним реальный текущий scale Swiper'а
        };

        swiper.on('zoomChange', onZoomChange);

        return () => {
            swiper.off('zoomChange', onZoomChange);
        };
    }, []);

    const slides = useMemo(() => mediaList || [], [mediaList]);

    const playVideoOnSlide = useCallback((index) => {
        const media = slides[index];
        if (!media || media.type_media !== 'Video') return;

        const swiperEl = document.querySelector('.metagallery-item-viewer__swiper');
        if (!swiperEl) return;

        // Находим все слайды Swiper
        const slideEls = swiperEl.querySelectorAll('.swiper-slide');

        // Учитываем loop: реальный индекс — swiper.realIndex,
        // а слайды могут дублироваться. Проще пройтись по всем и взять те,
        // у которых data-swiper-slide-index совпадает.
        slideEls.forEach(slideEl => {
            const slideIndexAttr = slideEl.getAttribute('data-swiper-slide-index');
            if (slideIndexAttr === String(index)) {
                const videoEl = slideEl.querySelector('video');
                if (videoEl) {
                    videoEl.play?.();
                }
            }
        });
    }, [slides]);

    const pauseVideoOnSlide = useCallback((index) => {
        const media = slides[index];
        if (!media || media.type_media !== 'Video') return;

        const swiperEl = document.querySelector('.metagallery-item-viewer__swiper');
        if (!swiperEl) return;

        const slideEls = swiperEl.querySelectorAll('.swiper-slide');

        slideEls.forEach(slideEl => {
            const slideIndexAttr = slideEl.getAttribute('data-swiper-slide-index');
            if (slideIndexAttr === String(index)) {
                const videoEl = slideEl.querySelector('video');
                if (videoEl) {
                    videoEl.pause?.();
                    // по желанию можно сбрасывать позицию:
                    // videoEl.currentTime = 0;
                }
            }
        });
    }, [slides]);

    const isCurrentImage = useMemo(() => {
        const media = slides[currentIndex];
        return media && media.type_media === 'Image';
    }, [slides, currentIndex]);

    useEffect(() => {
        // когда компонент смонтировался и слайды известны
        if (!slides.length) return;
        if (!swiperRef.current) return;

        const initial = initialIndex ?? 0;
        const media = slides[initial];

        if (!media || media.type_media !== 'Video') return;

        // небольшая задержка, чтобы Swiper успел проставить data-swiper-slide-index и классы
        const t = setTimeout(() => {
            playVideoOnSlide(initial);
        }, 0);

        // запомним, что текущий "предыдущий" индекс — тоже initial
        prevIndexRef.current = initial;
        setCurrentIndex(initial);

        return () => clearTimeout(t);
    }, [slides, initialIndex, playVideoOnSlide]);


    return (
        <div className="metagallery-item-viewer">
            <div className="metagallery-item-viewer__close" onClick={onClose}>                
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.9502 15.9492L15.8497 6.04972" stroke="#121212" stroke-linecap="square" stroke-linejoin="round"/>
                    <path d="M5.9502 6.05078L15.8497 15.9503" stroke="#121212" stroke-linecap="square" stroke-linejoin="round"/>
                </svg>

            </div>

            <div className='metagallery-item-viewer__slider-btn-container'>
                <div className='viewer-prev'>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.64645 11.3536C6.45118 11.1583 6.45118 10.8417 6.64645 10.6464L9.82843 7.46447C10.0237 7.2692 10.3403 7.2692 10.5355 7.46447C10.7308 7.65973 10.7308 7.97631 10.5355 8.17157L7.70711 11L10.5355 13.8284C10.7308 14.0237 10.7308 14.3403 10.5355 14.5355C10.3403 14.7308 10.0237 14.7308 9.82843 14.5355L6.64645 11.3536ZM15 11V11.5H7V11V10.5H15V11Z" fill="#121212"/>
                    </svg>
                </div>
                <div className='viewer-next'>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.3536 11.3536C15.5488 11.1583 15.5488 10.8417 15.3536 10.6464L12.1716 7.46447C11.9763 7.2692 11.6597 7.2692 11.4645 7.46447C11.2692 7.65973 11.2692 7.97631 11.4645 8.17157L14.2929 11L11.4645 13.8284C11.2692 14.0237 11.2692 14.3403 11.4645 14.5355C11.6597 14.7308 11.9763 14.7308 12.1716 14.5355L15.3536 11.3536ZM7 11V11.5H15V11V10.5H7V11Z" fill="#121212"/>
                    </svg>
                </div>
            </div>
            
            { isCurrentImage && 
                (
                    <div className='zoom-slider-container'>
                        <div className="metagallery-zoom-slider">
                        <div 
                            className={`metagallery-zoom-btn plus${zoomValue >= MAX_ZOOM ? ' disabled' : ''}`}
                            onClick={handlePlusClick}
                            disabled={zoomValue >= MAX_ZOOM}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <line x1="8.3877" y1="1.45313" x2="8.38769" y2="13.8168" stroke="#121212"/>
                                <line x1="2.18164" y1="7.61328" x2="14.5453" y2="7.61328" stroke="#121212"/>
                            </svg>
                        </div>
                        <Range
                            step={0.1}
                            min={1}
                            max={3.1}
                            values={[zoomValue]}
                            onChange={handleZoomChange}
                            direction={Direction.Up}
                            renderTrack={({ props, children }) => (
                                <div
                                    {...props}
                                    style={{
                                        ...props.style,
                                        height: "200px",
                                        width: "1px",
                                        backgroundColor: "#ECE7D8",
                                        borderRadius: "3px",
                                        margin: "0 auto",
                                    }}
                                >
                                    {children}
                                </div>
                            )}
                            renderThumb={({ props }) => (
                                <div
                                    className="metagallery-zoom-thumb"
                                    {...props}
                                    style={{
                                        ...props.style,
                                        height: "10px",
                                        width: "28px",
                                        outline: "none",
                                    }}
                                />
                            )}
                        />
                        <div                    
                            className={`metagallery-zoom-btn minus${zoomValue <= MIN_ZOOM ? ' disabled' : ''}`}
                            onClick={handleMinusClick}
                            disabled={zoomValue <= MIN_ZOOM}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <line x1="2.18164" y1="7.60938" x2="14.5453" y2="7.60938" stroke="#121212"/>
                            </svg>
                        </div>
                    </div>
                    </div>
                )
            }
            
            <Swiper
                modules={[EffectFade, Zoom, Navigation]}
                effect="fade"
                loop={true}
                zoom={{ maxRatio: 3, minRatio: 1 }}
                initialSlide={initialIndex}
                onSwiper={(swiper) => { swiperRef.current = swiper; }}
                onSlideChange={(swiper) => {
                    const newIndex = swiper.realIndex;
                    const prevIndex = prevIndexRef.current;

                    // Зум‑логика как была
                    setCurrentIndex(newIndex);
                    setZoomValue(1);
                    swiper.zoom?.out?.();

                    // 1) Поставить на паузу видео на старом слайде
                    if (prevIndex !== null && prevIndex !== undefined) {
                        pauseVideoOnSlide(prevIndex);
                    }

                    // 2) Запустить видео на новом слайде
                    playVideoOnSlide(newIndex);

                    // 3) Обновить prevIndex
                    prevIndexRef.current = newIndex;
                }}
                className="metagallery-item-viewer__swiper"
                allowTouchMove={false}
                navigation={{
                    prevEl: '.viewer-prev',
                    nextEl: '.viewer-next',
                }}
            >
                {slides.map((media, index) => (
                    <SwiperSlide key={media.id}>
                        <ViewerSlide
                            media={media}
                            mediaIndex={index}
                            mediaList={slides}
                            activeTooltip={activeTooltip}
                            onTooltipClick={onTooltipClick}
                            getSwiper={() => swiperRef.current}
                            isZoomed={zoomValue > 1}
                            itemsShownText = { itemsShownText }
                        />
                    </SwiperSlide>
                ))}
            </Swiper>

        </div>
    );
}

                
export default ViewerSlider;
