// ViewerSlide.jsx
import React, {
    useState,
    useLayoutEffect,
    useRef,
    useCallback,
    useEffect,
    lazy,
} from 'react';

import { animate, createScope } from 'animejs';
import { calculateFittingSize } from '../utils/calculateFittingSize';





function ViewerSlide({media, mediaIndex, mediaList, activeTooltip, onTooltipClick, isZoomed, getSwiper, itemsShownText }) {
    const [fittingSizes, setFittingSizes] = useState({ width: 0, height: 0 });

    const [hoveredTooltipId, setHoveredTooltipId] = useState(null);
    const [mediaProductCards, setMediaProductCards] = useState(
        media.tooltips ? [...media.tooltips] : []
    );

    const [cardHeight, setCardHeight] = useState(0);
    const [cardsStartPosition, setCardsStartPosition] = useState([]);
    const [cardsHoverPosition, setCardsHoverPosition] = useState([]);
    const [containerSizes, setContainerSizes] = useState({});
    const [mobileContainerSizes, setMobileContainerSizes] = useState({});
    const [openCaptionText, setOpenCaptionText] = useState(false);

    const containerRef = useRef(null);         // контейнер под картинку
    const slideRootRef = useRef(null);         // корень всего слайда

    const imageViewportRef = useRef(null);     // обёртка, совпадающая с размерами картинки
    const pinsOverlayRef = useRef(null);       // слой, в котором живут пины

    const productsRootRef = useRef(null);
    const productsScope = useRef(null);

    const captionRootRef = useRef(null);
    const captionScope = useRef(null);
    const captionVisibleTextRef = useRef(null);
    const captionCloneRef = useRef(null);

    const [showFullCaption, setShowFullCaption] = useState(false);
    const [showAnimationFullCaption, setShowAnimationFullCaption] = useState(false);
    //const [zoomValue, setZoomValue] = useState(1);
    /*
     * Проверка, что caption обрезан (клонированный блок выше видимого)
     */


    
    const handleTooltipClick = (tooltipData, event) => {
        event.stopPropagation();
        
        const isCurrentlyActive = activeTooltip && 
                                 activeTooltip.tooltipData.id === tooltipData.id && 
                                 activeTooltip.mediaId === media.id;
        
        if (isCurrentlyActive) {
            onTooltipClick(null, null, null);
        } else {
            onTooltipClick(tooltipData, event.currentTarget, media.id);
        }
    };


    const isTooltipWindowActive = (tooltipId) => {
        return activeTooltip && 
               activeTooltip.tooltipData.id === tooltipId && 
               activeTooltip.mediaId === media.id;
    };


    const recalcFittingSizes = useCallback(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const sizes = calculateFittingSize(
            containerWidth,
            containerHeight,
            media.width,
            media.height
        );

        setFittingSizes(sizes);
    }, [media.width, media.height]);

    

    useEffect(() => {
        const checkCaptionHeight = () => {
            if (!captionVisibleTextRef.current || !captionCloneRef.current) return;
            
            const visibleHeight = captionVisibleTextRef.current.offsetHeight;
            const cloneHeight = captionCloneRef.current.offsetHeight;
            
            if (cloneHeight > visibleHeight) {
                setShowFullCaption(true);
            } else {
                setShowFullCaption(false);
            }
        };
        
        checkCaptionHeight();
        window.addEventListener('resize', checkCaptionHeight);
        return () => {
            window.removeEventListener('resize', checkCaptionHeight);
        };
    }, [media.caption]);

    /*
     * Инициализация captionScope (анимации caption)
     */
    useEffect(() => {
        if (captionScope.current) return;
        
        captionScope.current = createScope({ captionRootRef }).add(self => {
            let localVarticalTransform = 0;

            self.add('hoverClick', (e) => {
                const root = captionRootRef.current;
                if (!root) return;

                const captionParent = e.target.closest('.metagallery-item-viewer__caption-container');                     
                if (!captionParent || !root.contains(captionParent)) return;

                const fullText = captionParent.querySelector('.metagallery-item-viewer__full-text');
                if (!fullText) return;
                
                fullText.classList.add('hidden');
                localVarticalTransform = (((15 + fullText.offsetHeight) / fullText.offsetHeight) * -100) + '%';
                
                animate(fullText, {
                    visibility: 'visible',
                    opacity: [0, 1],
                    y: ["-100%", localVarticalTransform],
                    duration: 300,   
                    onComplete: () => setShowAnimationFullCaption(false),
                });
            });

            self.add('closeHoverClick', (e, place = '') => {
                const root = captionRootRef.current;
                if (!root) return;

                let fullText = null;

                if (place === 'out') {                        
                    // Закрываем активный full caption, если он был открыт
                    fullText = root.querySelector('.metagallery-item-viewer__full-text.hidden');
                    if (!fullText) return;                        
                } else {
                    const captionParent = e.target.closest('.metagallery-item-viewer__caption-container'); 
                    if (!captionParent || !root.contains(captionParent)) return;
                    fullText = captionParent.querySelector('.metagallery-item-viewer__full-text');
                    if (!fullText) return;
                }

                animate(fullText, {
                    visibility: 'visible',
                    opacity: [1, 0],
                    y: [localVarticalTransform, "-100%"],
                    duration: 300,  
                    onComplete: () => {
                        fullText.classList.remove('hidden');
                        setShowAnimationFullCaption(false);
                    },
                });
            });

            self.add('mouseEnter', (e) => {
                if (document.documentElement.clientWidth < 992) return;
                const root = captionRootRef.current;
                if (!root) return;

                const captionParent = e.target.closest('.metagallery-item-viewer__caption-container');                     
                if (!captionParent || !root.contains(captionParent)) return;
                
                const fullText = captionParent.querySelector('.metagallery-item-viewer__full-text');
                const visibleText = captionParent.querySelector('.metagallery-item-viewer__caption-visible-text');                    
                if (!fullText || !visibleText) return;
                
                fullText.classList.add('hidden');

                const visibleRect = visibleText.getBoundingClientRect();
                const fullTextRect = fullText.getBoundingClientRect();
                const mouseX = e.clientX;
                
                const relativeX = mouseX - visibleRect.left;
                const fullTextCenterOffset = fullTextRect.width / 2;
                
                const targetLeft = relativeX - fullTextCenterOffset;
                
                const containerWidth = captionParent.offsetWidth;
                const minLeft = -fullTextRect.width / 2;
                const maxLeft = containerWidth - (fullTextRect.width / 2);
                
                const clampedLeft = Math.max(minLeft, Math.min(maxLeft, targetLeft));
                
                fullText.style.left = `${clampedLeft}px`;
                
                localVarticalTransform = (((15 + fullText.offsetHeight) / fullText.offsetHeight) * -100) + '%';
                
                animate(fullText, {
                    visibility: 'visible',
                    opacity: [0, 1],
                    y: ["-100%", localVarticalTransform],
                    duration: 300, 
                    onComplete: () => setShowAnimationFullCaption(false),
                });
            });

            self.add('mouseLeave', (e) => {
                if (document.documentElement.clientWidth < 992) return;
                const root = captionRootRef.current;
                if (!root) return;

                const captionParent = e.target.closest('.metagallery-item-viewer__caption-container'); 
                if (!captionParent || !root.contains(captionParent)) return;

                const fullText = captionParent.querySelector('.metagallery-item-viewer__full-text');
                if (!fullText) return;
                
                animate(fullText, {
                    visibility: 'visible',
                    opacity: [1, 0],
                    y: [localVarticalTransform, "-100%"],
                    duration: 300,
                    onComplete: () => {
                        fullText.classList.remove('hidden');
                        fullText.style.left = '';
                        setShowAnimationFullCaption(false);
                    },
                });
            });
        });

        return () => {
            if (captionScope.current) {
                captionScope.current.revert();
                captionScope.current = null;
            }
        };
    }, []);

    /*
     * Инициализация productsScope (анимации карточек) — локализовано по productsRootRef
     */
    useEffect(() => {
        if (productsScope.current) return;
        
        productsScope.current = createScope({ productsRootRef }).add(self => {
            let localCardsHoverPosition = [];
            let localCardsStartPosition = [];
            let localContainerSizes = {};
            let localCardHeight = 0;

            self.add('placementOfCards', () => {
                const root = productsRootRef.current;
                if (!root) return;

                const productCards = root.querySelectorAll('.metagallery-item-viewer-product-card');                
                if (!productCards.length) {
                    return;
                }

                localCardHeight = getCardHeight(productCards);
                const cardsPositions = getStartCardPositions(mediaProductCards);

                localCardsStartPosition = [...cardsPositions];
                localCardsHoverPosition = [...getCardsHoverPositions(productCards, localCardHeight)];
                localContainerSizes = getContainerSizes(productCards, localCardHeight);

                setCardsStartPosition(localCardsStartPosition);
                setCardsHoverPosition(localCardsHoverPosition);
                setCardHeight(localCardHeight);

                const screenWidth = document.documentElement.clientWidth;

                if (screenWidth >= 992) {
                    setContainerSizes(localContainerSizes);
                }

                productCards.forEach((pc, index) => {
                    let setIndex = index;
                    if (index > 3) setIndex = 3;
                    if (localCardsStartPosition[setIndex]) {
                        animate(pc, {
                            x: localCardsStartPosition[setIndex].x,
                            y: localCardsStartPosition[setIndex].y,
                            rotate: localCardsStartPosition[setIndex].rotate,
                            zIndex: localCardsStartPosition[setIndex].inx,
                            height: localCardHeight,
                            ease: 'linear',
                            duration: 0,
                        });
                    }
                });
            });

            self.add('mouseEnter', () => {
                const screenWidth = document.documentElement.clientWidth;
                if (screenWidth < 992) return;

                const root = productsRootRef.current;
                if (!root) return;

                const productCards = root.querySelectorAll('.metagallery-item-viewer-product-card');
                if (!productCards.length) return;

                setContainerSizes(localContainerSizes);

                if (productCards.length && localCardsHoverPosition.length) {
                    productCards.forEach((pc, index) => {
                        if (!localCardsHoverPosition[index]) return;
                        animate(pc, {
                            x: '0%',
                            y: '0%',
                            left: `${localCardsHoverPosition[index].left}px`,
                            bottom: `${localCardsHoverPosition[index].bottom}px`,
                            rotate: '0deg',
                            ease: 'linear',
                            duration: 300,
                        });
                    });
                }
            });

            self.add('mouseLeave', () => {
                const screenWidth = document.documentElement.clientWidth;
                if (screenWidth < 992) return;

                const root = productsRootRef.current;
                if (!root) return;

                const productCards = root.querySelectorAll('.metagallery-item-viewer-product-card');
                if (!productCards.length) return;

                if (productCards.length && localCardsStartPosition.length) {
                    productCards.forEach((pc, index) => {
                        let setIndex = index;
                        if (index > 3) setIndex = 3;
                        if (!localCardsStartPosition[setIndex]) return;

                        animate(pc, {
                            x: localCardsStartPosition[setIndex].x,
                            y: localCardsStartPosition[setIndex].y,
                            left: 0,
                            bottom: 0,
                            rotate: localCardsStartPosition[setIndex].rotate,
                            ease: 'linear',
                            duration: 300,
                        });
                    });

                    setContainerSizes({});
                }
            });

            self.add('cardClick', () => {
                const screenWidth = document.documentElement.clientWidth;
                if (screenWidth >= 992) return;

                const root = productsRootRef.current;
                if (!root) return;

                const container = root.closest('.metagallery-item-viewer-card-container');
                const innerContainer = root.querySelector('.metagallery-item-viewer-card-container--inner');
                const productCards = root.querySelectorAll('.metagallery-item-viewer-product-card');

                if (!container || !innerContainer || !productCards.length) return;

                container.classList.add('mobile-open');
                setMobileContainerSizes(localContainerSizes);

                if (productCards.length && localCardsHoverPosition.length) {
                    productCards.forEach((pc, index) => {
                        if (!localCardsHoverPosition[index]) return;
                        animate(pc, { 
                            x: '0%',
                            y: '0%',  
                            right: `${localCardsHoverPosition[index].left}px`,
                            bottom: `${localCardsHoverPosition[index].bottom}px`,                              
                            rotate: '0deg',                                 
                            ease: 'linear',
                            duration: 300,
                            onComplete: () => {
                                innerContainer.scrollTop = innerContainer.scrollHeight;
                            },
                        });
                    });
                }
            });

            self.add('closeMobileCards', () => {
                const screenWidth = document.documentElement.clientWidth;
                if (screenWidth >= 992) return;

                const root = productsRootRef.current;
                if (!root) return;

                const container = root.closest('.metagallery-item-viewer-card-container');
                const productCards = root.querySelectorAll('.metagallery-item-viewer-product-card');

                if (!container || !productCards.length) return;

                if (productCards.length && localCardsStartPosition.length) {
                    productCards.forEach((pc, index) => {
                        let setIndex = index;
                        if (index > 3) setIndex = 3;
                        if (!localCardsStartPosition[setIndex]) return;

                        animate(pc, {
                            x: localCardsStartPosition[setIndex].x,
                            y: localCardsStartPosition[setIndex].y,
                            right: 0,
                            bottom: 0,
                            rotate: localCardsStartPosition[setIndex].rotate,                                
                            ease: 'linear',
                            duration: 300,
                        });
                    });

                    setMobileContainerSizes({});
                    container.classList.remove('mobile-open');
                }
            });
        });

        return () => {
            if (productsScope.current) {
                productsScope.current.revert();
                productsScope.current = null;
            }
        };
    }, [mediaProductCards]);

    /*
     * При первом монтировании слайда — посчитать размеры и разложить карточки
     */
    useLayoutEffect(() => {
        const update = () => {
            recalcFittingSizes();
        };

        update();
        window.addEventListener('resize', update);

        return () => {
            window.removeEventListener('resize', update);
        };
    }, [recalcFittingSizes]);




    // вызываем пересчёт только когда зум вернулся к 1
    useEffect(() => {
        if (isZoomed) return;

        // небольшая задержка, чтобы Swiper успел снять классы swiper-slide-zoomed и т.п.
        const t = setTimeout(() => {
            recalcFittingSizes();
        }, 50); // можно подобрать экспериментально 0 / 16 / 50

        return () => clearTimeout(t);
    }, [isZoomed, recalcFittingSizes]);

    // Запуск раскладки карточек после того, как размеры известны
    useEffect(() => {
        if (!fittingSizes.width || !fittingSizes.height) return;
        if (productsScope.current?.methods?.placementOfCards) {
            productsScope.current.methods.placementOfCards();
        }
    }, [fittingSizes]);

    /*
     * Логика активного/hover‑состояния пинов
     */
    const isTooltipActive = (tooltipId) => {
        return activeTooltip && 
               activeTooltip.tooltipData.id === tooltipId && 
               activeTooltip.mediaId === media.id;
    };

    const isTooltipHighlighted = (tooltipId) => {
        if (!hoveredTooltipId) return '';
        return hoveredTooltipId === tooltipId ? 'active-hov' : 'disabled-hov';
    };

    const handleCardMouseEnter = (tooltipId) => {
        setHoveredTooltipId(tooltipId);
    };

    const handleCardMouseLeave = () => {
        setHoveredTooltipId(null);
    };

    /*
     * Рендер изображения + Swiper Zoom
     * Пины — поверх, в отдельном overlay, но всё равно привязаны к fittingSizes
     */
    const renderViewerImage = () => {
        const imageUrl = media.type_media === 'Image'
            ? media.image
            : media.video_placeholder;

        const { width, height } = fittingSizes;

        return (
            <div
                className="metagallery-item-viewer__img-main-container"
                ref={containerRef}
                style={{ position: 'relative' }}
            >
                {/* Swiper zoom контейнер */}
                <div
                    className="swiper-zoom-container"
                    ref={imageViewportRef}
                    style={{
                        width: width || 0,
                        height: height || 0,
                        margin: 'auto',
                        position: 'relative',
                    }}
                >
                    
                    { media.type_media === "Image" ? (
                        <img
                            className="swiper-zoom-target"
                            src={imageUrl}
                            alt={media.alt || ''}
                            style={{
                                width: `${width}px` || 0,
                                height: `${height}px` || 0,
                                border: width && height ? undefined : 'none',
                            }}
                        />
                    ): (
                        <video 
                            src={media.video}
                            muted
                            loop
                            playsInline                            
                            loading="lazy"
                            poster={media.video_placeholder}
                        />

                       
                    )
                }

                    
                </div>

                {/* Пины: отдельный overlay-слой, совпадает по размерам с viewport */}
                <div
                    className="metagallery-item-viewer__outer-img-container"
                    ref={pinsOverlayRef}
                    style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: width || 0,
                        height: height || 0,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    {media.tooltips && media.tooltips.map((tooltip) => {
                        const highlightedClass = isTooltipHighlighted(tooltip.id);
                        const isActive = isTooltipActive(tooltip.id);
                        const tooltipClass = `tooltip-window-trigger ${isActive ? 'active' : highlightedClass || ''}`;

                        


                        return (
                            <button
                                key={`${media.id}-${tooltip.id}`}
                                className={tooltipClass}
                                style={{
                                    left: `${tooltip.x}%`,
                                    top: `${tooltip.y}%`,
                                    position: 'absolute',
                                    pointerEvents: 'auto',
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();

                                    handleTooltipClick(tooltip, e)

                                    /*if (onTooltipClick) {
                                        onTooltipClick({
                                            media,
                                            tooltipData: tooltip,
                                        });
                                    }*/
                                }}
                            >
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0 4.65306V3.34694H8V4.65306H0ZM3.29897 0H4.70103V8H3.29897V0Z" fill="#FAF8ED" />
                                </svg>
                            </button>
                        );
                    })}
                </div>

               
            </div>
        );
    };

    /*
     * Рендер Zoom Slider (без логики изменения масштаба — она у Swiper)
     */
  





    /*
     * Клик по карточке (mobile open/close)
     */
    const handleCardClick = (e) => {
        const screenWidth = document.documentElement.clientWidth;
        if (screenWidth >= 992) return;

        const root = productsRootRef.current;
        if (!root) return;
        const parent = root.closest('.metagallery-item-viewer-card-container');

        if (parent && !parent.classList.contains('mobile-open')) {
            e.preventDefault();
            e.stopPropagation();
            productsScope.current?.methods?.cardClick();
        } else if (parent && parent.classList.contains('mobile-open')) {
            productsScope.current?.methods?.closeMobileCards();
        }
    };

    /*
     * Клик по контейнеру с карточками на мобильном
     */
    const handleClickOnMobileContainer = (e) => {
        const screenWidth = document.documentElement.clientWidth;
        if (screenWidth >= 992) return;

        const root = productsRootRef.current;
        if (!root) return;
        const parent = root.closest('.metagallery-item-viewer-card-container');

        if (parent && parent.classList.contains('mobile-open')) {
            e.stopPropagation();
            productsScope.current?.methods?.closeMobileCards();
        }
    };

    /*
     * Клик по свободному месту — закрытие caption, если он открыт
     */
    const handleCaptionOutsideClick = (e) => {
        const testParent = e.target.closest('.metagallery-item-viewer__caption-container');
        if (showAnimationFullCaption || testParent || !openCaptionText) return;

        captionScope.current?.methods?.closeHoverClick(e, 'out');
        setOpenCaptionText(false);
        setShowAnimationFullCaption(true);
    };

    /*
     * Рендер Caption
     */
    const renderCaption = () => {
        if (!media.caption) return null;

        return (
            <div
                className="metagallery-item-viewer__caption-container"
                ref={captionRootRef}
            >
                <div
                    className="metagallery-item-viewer__outer-container"
                    onMouseEnter={(e) => {
                        if (showAnimationFullCaption || openCaptionText) return;
                        captionScope.current?.methods?.mouseEnter(e);
                        setOpenCaptionText(true);
                        setShowAnimationFullCaption(true);
                    }}
                    onMouseLeave={(e) => {
                        if (showAnimationFullCaption && !openCaptionText) return;
                        captionScope.current?.methods?.mouseLeave(e);
                        setOpenCaptionText(false);
                        setShowAnimationFullCaption(true);
                    }}
                >
                    {showFullCaption && (
                        <div className="metagallery-item-viewer__full-text">
                            {media.caption}
                            <div
                                className="metagallery-item-viewer__close-caption"
                                onClick={(e) => {
                                    if (showAnimationFullCaption) return;
                                    captionScope.current?.methods?.closeHoverClick(e);
                                    setOpenCaptionText(false);
                                    setShowAnimationFullCaption(true);
                                }}
                            >
                                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4.05078 12.1504L12.1504 4.05078" stroke="#121212" strokeLinecap="square" strokeLinejoin="round" />
                                    <path d="M4.05078 4.04881L12.1504 12.1484" stroke="#121212" strokeLinecap="square" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    )}

                    <div
                        className="metagallery-item-viewer__caption-visible-text"
                        ref={captionVisibleTextRef}
                        onClick={(e) => {
                            if (showAnimationFullCaption) return;

                            if (!openCaptionText) {
                                captionScope.current?.methods?.hoverClick(e);
                                setOpenCaptionText(true);
                                setShowAnimationFullCaption(true);
                            } else {
                                captionScope.current?.methods?.closeHoverClick(e);
                                setOpenCaptionText(false);
                                setShowAnimationFullCaption(true);
                            }
                        }}
                    >
                        {media.caption}
                    </div>

                    <div
                        className="metagallery-item-viewer__caption-visible-text--clone"
                        ref={captionCloneRef}
                    >
                        {media.caption}
                    </div>
                </div>
            </div>
        );
    };

    /*
     * Вспомогательные функции по карточкам (как у тебя, только вынесены)
     */
    const getStartCardPositions = (cards) => {
        const screenWidth = document.documentElement.clientWidth;

        if (screenWidth >= 992) {
            if (cards.length === 1) {
                return [{ x: "-40%", y: "-2%", rotate: "18deg", inx: 1 }];
            }

            if (cards.length === 2) {
                return [
                    { x: "0%", y: "-2%", rotate: "30deg", inx: 1 },
                    { x: "-50%", y: "-1%", rotate: "15deg", inx: 2 },
                ];
            }

            if (cards.length > 2) {
                return [
                    { x: "-32%", y: "-6%", rotate: "10deg", inx: 3 },
                    { x: "-10%", y: "-20%", rotate: "30deg", inx: 2 },
                    { x: "25%", y: "-10%", rotate: "45deg", inx: 1 },
                    { x: "-32%", y: "-6%", rotate: "10deg", inx: 1 },
                ];
            }
        } else {
            if (cards.length === 1) {
                return [{ x: "125%", y: "36%", rotate: "-40deg", inx: 1 }];
            }

            if (cards.length === 2) {
                return [
                    { x: "80%", y: "62%", rotate: "-32deg", inx: 2 },
                    { x: "95%", y: "42%", rotate: "-32deg", inx: 1 },
                ];
            }

            if (cards.length > 2) {
                return [
                    { x: "85%", y: "64%", rotate: "-40deg", inx: 3 },
                    { x: "90%", y: "48%", rotate: "-39deg", inx: 2 },
                    { x: "115%", y: "20%", rotate: "-40deg", inx: 1 },
                    { x: "260%", y: "28%", rotate: "-40deg", inx: 1 },
                ];
            }
        }

        return [];
    };

    const getCardHeight = (cards) => {
        let maxHeight = 0;
        if (cards.length) {
            cards.forEach(card => {
                if (card.offsetHeight > maxHeight) {
                    maxHeight = card.offsetHeight;
                }
            });
        }
        return maxHeight;
    };

    const getCardsHoverPositions = (cards, height) => {
        const positions = [];
        const cardCount = cards.length;

        if (!cardCount) return positions;
        
        const gapX = 6;
        const gapY = 6;
        
        const firstCard = cards[0];
        const cardWidth = firstCard.offsetWidth;
        const cardHeight = height || firstCard.offsetHeight;
        
        const screenWidth = document.documentElement.clientWidth;
        let columns;
        const startOffset = screenWidth < 992 ? 10 : 0;
        
        if (screenWidth >= 992) {
            if (cardCount === 1) columns = 1;
            else if (cardCount === 2) columns = 2;
            else if (cardCount === 3) columns = 3;
            else if (cardCount === 4) columns = 2;
            else if (cardCount === 5) columns = 3;
            else if (cardCount === 6) columns = 3;
            else columns = 3;
        } else {
            columns = cardCount === 1 ? 1 : 2;
        }
        
        const rows = Math.ceil(cardCount / columns);

        for (let i = 0; i < cardCount; i++) {
            const column = i % columns;
            const row = Math.floor(i / columns);
            
            const left = startOffset + column * (cardWidth + gapX);
            const bottom = startOffset + row * (cardHeight + gapY);
            positions.push({ bottom, left });
        }
        
        return positions;
    };

    const getContainerSizes = (cards, cheight) => {
        const cardCount = cards.length;
        if (!cardCount) return { width: 0, height: 0 };
        
        const gapX = 6;
        const gapY = 6;
        
        const firstCard = cards[0];
        const cardWidth = firstCard.offsetWidth;
        const cardHeight = cheight || firstCard.offsetHeight;
        
        const screenWidth = document.documentElement.clientWidth;
        const extraHeight = screenWidth < 992 ? 60 : 0;
        
        let columns;
        if (screenWidth >= 992) {
            if (cardCount === 1) columns = 1;
            else if (cardCount === 2) columns = 2;
            else if (cardCount === 3) columns = 3;
            else if (cardCount === 4) columns = 2;
            else if (cardCount === 5) columns = 3;
            else if (cardCount === 6) columns = 3;
            else columns = 3;
        } else {
            columns = cardCount === 1 ? 1 : 2;
        }
        
        const rows = Math.ceil(cardCount / columns);
        
        const width = columns * cardWidth + (columns - 1) * gapX;
        const height = rows * cardHeight + (rows - 1) * gapY + extraHeight;
        
        return { width, height };
    };

    /*
     * Финальный render одного слайда
     */
    return (
        <div
            className="metagallery-item-viewer__slide-root"
            ref={slideRootRef}
            onClick={handleCaptionOutsideClick}
        >
            {media.tooltips && media.tooltips.length > 0 && (
                <div
                    className="metagallery-item-viewer-card-container"
                    ref={productsRootRef}
                    onMouseEnter={() => {
                        const screenWidth = document.documentElement.clientWidth;
                        if (screenWidth < 992) return;
                        const container = productsRootRef.current?.closest('.metagallery-item-viewer-card-container');
                        if (container) container.classList.add('hover-state');
                        productsScope.current?.methods?.mouseEnter();
                    }}
                    onMouseLeave={() => {
                        const screenWidth = document.documentElement.clientWidth;
                        if (screenWidth < 992) return;
                        const container = productsRootRef.current?.closest('.metagallery-item-viewer-card-container');
                        if (container) container.classList.remove('hover-state');
                        productsScope.current?.methods?.mouseLeave();
                    }}
                    onClick={handleClickOnMobileContainer}
                    style={
                        (containerSizes.width && containerSizes.height) || cardHeight > 0
                            ? { 
                                ...(containerSizes.width && containerSizes.height && {
                                    width: `${containerSizes.width}px`, 
                                    height: `${containerSizes.height}px`,
                                }),
                                ...(cardHeight > 0 && { minHeight: `${cardHeight}px` }),
                            }
                            : {}
                    }
                >
                    <div
                        className="metagallery-item-viewer-card-container--inner"
                        style={
                            cardHeight > 0 || mobileContainerSizes.width || mobileContainerSizes.height
                                ? {
                                    ...(cardHeight > 0 && { minHeight: `${cardHeight}px` }),
                                    ...(mobileContainerSizes.width && { width: `${mobileContainerSizes.width}px` }),
                                    ...(mobileContainerSizes.height && { height: `${mobileContainerSizes.height}px` }),
                                }
                                : {}
                        }
                    >
                        <div
                            className="metagallery-item-viewer-card-container__controls-container"
                            onClick={handleCardClick}
                        >
                            <button className="metagallery-item-viewer-card-container__items-shown">
                                { itemsShownText }
                            </button>
                            <button className="metagallery-item-viewer-card-container__close">
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5.94922 15.9492L15.8487 6.04972" stroke="#121212" strokeLinecap="square" strokeLinejoin="round" />
                                    <path d="M5.94922 6.05078L15.8487 15.9503" stroke="#121212" strokeLinecap="square" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {media.tooltips.map((tooltip) => (
                            <a
                                className="metagallery-item-viewer-product-card"
                                href={tooltip.link}
                                key={tooltip.id}
                                onMouseEnter={() => handleCardMouseEnter(tooltip.id)}
                                onMouseLeave={handleCardMouseLeave}
                                onClick={handleCardClick}
                            >
                                <div className="metagallery-item-viewer-product-card__img">
                                    <img src={tooltip.image} alt={tooltip.title} />
                                </div>
                                <div className="metagallery-item-viewer-product-card__text-block">
                                    <div className="metagallery-item-viewer-product-card__title">
                                        {tooltip.title}
                                    </div>
                                    <div className="metagallery-item-viewer-product-card__price">
                                        {tooltip.price}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Картинка + zoom + пины */}
            {renderViewerImage()}

            {/* Caption */}
            {renderCaption()}
        </div>
    );
}

export default ViewerSlide;
