import { useState, useLayoutEffect, useRef, useCallback, useEffect } from "react";
import { Range, Direction } from "react-range";
import { animate, createScope } from 'animejs';
import { nanoid } from 'nanoid';

function calculateFittingSize(containerWidth, containerHeight, imageWidth, imageHeight) {
    if (!containerWidth || !containerHeight) return { width: 0, height: 0 };
    
    const containerRatio = containerWidth / containerHeight;
    const imageRatio = imageWidth / imageHeight;
    
    let newWidth, newHeight;
    
    if (imageRatio > containerRatio) {
        newWidth = containerWidth;
        newHeight = containerWidth / imageRatio;
    } else {
        newHeight = containerHeight;
        newWidth = containerHeight * imageRatio;
    }
    
    return {
        width: newWidth,
        height: newHeight
    };
}

function ViewerMedia({ media, mediaIndex, mediaList, onClose, onTooltipClick, activeTooltip }) {
    
    const [currentIndex, setCurrentIndex] = useState(mediaIndex);
    const [fittingSizes, setFittingSizes] = useState({ width: 0, height: 0 });
    
    

    const [hoveredTooltipId, setHoveredTooltipId] = useState(null);
    const [ mediaProductCards, setMediaProductCards ] = useState( [...media.tooltips] );
    
    const [ cardHeight, setCardHeight ] = useState( 0 );
    const [ cardsStartPosition, setCardsStartPosition ] = useState( [] );
    const [ cardsHoverPosition, setCardsHoverPosition ] = useState( [] );
    const [ containerSizes, setContainerSizes ] = useState( {} );
    const [ mobileContainerSizes, setMobileContainerSizes ] = useState( {} );
    const [ openCaptionText, setOpenCaptionText ] = useState( false );




    const containerRef = useRef(null);
    

    const imageContainerRef = useRef(null); // уже был — внутренний блок с изображением
    const productsRootRef = useRef(null);
    const productsScope = useRef(null);

    /*РАБОТАЕМ С ЗУМОМ*/




    /**************** */
        const captionRootRef = useRef(null);
        const captionScope = useRef(null);
        const captionVisibleTextRef = useRef(null);
        const captionCloneRef = useRef(null);

        const [showFullCaption, setShowFullCaption] = useState(false);
        const [showAnimationFullCaption, setShowAnimationFullCaption] = useState(false);

        useEffect(() => {
            const checkCaptionHeight = () => {
                if (!captionVisibleTextRef.current || !captionCloneRef.current) return;
                
                const visibleHeight = captionVisibleTextRef.current.offsetHeight;
                const cloneHeight = captionCloneRef.current.offsetHeight;
                
                // Если высота клона больше видимой высоты, значит текст обрезан
                if (cloneHeight > visibleHeight) {
                    setShowFullCaption(true);
                } else {
                    setShowFullCaption(false);
                }
            };
            
            // Проверяем при монтировании и при изменении медиа
            checkCaptionHeight();
            
            // Также проверяем при ресайзе окна
            window.addEventListener('resize', checkCaptionHeight);
            
            return () => {
                window.removeEventListener('resize', checkCaptionHeight);
            };
        }, [currentIndex, media.caption]);


        // Обновленный рендеринг caption с условием
        const renderCaption = () => {
            if (!media.caption) return null;
            
            return (
                <div className="metagallery-item-viewer__caption-container" ref={ captionRootRef }>
                    <div                     
                        className="metagallery-item-viewer__outer-container"
                        onMouseEnter={ (e) => {
                            if ( showAnimationFullCaption || openCaptionText ) return;

                            captionScope.current.methods.mouseEnter( e );
                            setOpenCaptionText( true );
                            setShowAnimationFullCaption(true);
                        } }
                        onMouseLeave={ (e) => {
                            
                            if ( showAnimationFullCaption && !openCaptionText ) return;

                            captionScope.current.methods.mouseLeave( e );
                            setOpenCaptionText( false );
                            setShowAnimationFullCaption(true);
                        } }
                    >
                        {showFullCaption && (
                            <div className="metagallery-item-viewer__full-text">
                                {media.caption}
                                <div 
                                    className="metagallery-item-viewer__close-caption"
                                    onClick = { (e) => {
                                        if ( showAnimationFullCaption ) return;

                                        captionScope.current.methods.closeHoverClick( e );
                                        setOpenCaptionText( false );
                                        setShowAnimationFullCaption(true);
                                    } }
                                >
                                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4.05078 12.1504L12.1504 4.05078" stroke="#121212" strokeLinecap="square" strokeLinejoin="round"/>
                                        <path d="M4.05078 4.04881L12.1504 12.1484" stroke="#121212" strokeLinecap="square" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>    
                        )}
                        <div 
                            className="metagallery-item-viewer__caption-visible-text"
                            ref={captionVisibleTextRef}
                            onClick={ (e) => { 

                                if ( showAnimationFullCaption ) return

                                if ( !openCaptionText ){
                                    captionScope.current.methods.hoverClick( e );
                                    setOpenCaptionText( true );
                                    setShowAnimationFullCaption(true);
                                } else {
                                    captionScope.current.methods.closeHoverClick( e );
                                    setOpenCaptionText( false );
                                    setShowAnimationFullCaption(true);
                                }
                             } }
                            
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




        useEffect(() => {
            if (captionScope.current) return;
            
            captionScope.current = createScope({ captionRootRef }).add(self => {
                
                let localVarticalTransform = 0;
                let localHorizontalTransform = 0;
                
                
                self.add('hoverClick', (e) => {
                    
                    const captionParent = e.target.closest('.metagallery-item-viewer__caption-container');                     
                    
                    if ( !captionParent ) return;
                    const fullText = captionParent.querySelector('.metagallery-item-viewer__full-text');

                    if ( !fullText ) return;
                    
                    fullText.classList.add('hidden');
                    
                    localVarticalTransform = ( ( (15 + fullText.offsetHeight) / fullText.offsetHeight ) * -100 ) + '%';
                    
                    
                    animate(fullText, {
                        visibility: 'visible',
                        opacity: [0, 1],
                        y: ["-100%", localVarticalTransform],
                        duration: 300,   
                        onComplete: () => setShowAnimationFullCaption(false)                     
                    })
                });

                self.add('closeHoverClick', (e, place = '') => {
                    let fullText = null;

                    if ( place === 'out' ){                        
                        fullText = document.querySelector('.metagallery-item-viewer__full-text.hidden');
                        if ( !fullText ) return;                        
                    } else {
                        const captionParent = e.target.closest('.metagallery-item-viewer__caption-container'); 

                        if ( !captionParent ) return;
                        fullText = captionParent.querySelector('.metagallery-item-viewer__full-text');

                        if ( !fullText ) return;
                    }
     

                    animate(fullText, {
                        visibility: 'visible',
                        opacity: [1, 0],
                        y: [localVarticalTransform, "-100%", ],
                        duration: 300,  
                        onComplete: () => {
                            fullText.classList.remove('hidden');
                            setShowAnimationFullCaption(false);
                        }                      
                    })
                })

                self.add('mouseEnter', (e) => {
                    // Проверяем desktop
                    if (document.documentElement.clientWidth < 992) return;
                    
                    const captionParent = e.target.closest('.metagallery-item-viewer__caption-container');                     
                    
                    if (!captionParent) return;
                    
                    const fullText = captionParent.querySelector('.metagallery-item-viewer__full-text');
                    const visibleText = captionParent.querySelector('.metagallery-item-viewer__caption-visible-text');
                    
                    if (!fullText || !visibleText) return;
                    
                    fullText.classList.add('hidden');

                    // Получаем положение курсора внутри visibleText
                    const visibleRect = visibleText.getBoundingClientRect();
                    const fullTextRect = fullText.getBoundingClientRect();
                    const mouseX = e.clientX;
                    
                    // Вычисляем положение курсора внутри видимого текста
                    const relativeX = mouseX - visibleRect.left;
                    
                    // Вычисляем центр всплывающего окна (50% от его ширины)
                    const fullTextCenterOffset = fullTextRect.width / 2;
                    
                    // Вычисляем смещение: курсор должен быть в центре окна
                    const targetLeft = relativeX - fullTextCenterOffset;
                    
                    // Ограничиваем: может вылезать влево/вправо на половину своей ширины
                    const containerWidth = captionParent.offsetWidth;
                    const minLeft = -fullTextRect.width / 2; // Может выйти на половину ширины за левый край
                    const maxLeft = containerWidth - (fullTextRect.width / 2); // Может выйти на половину ширины за правый край
                    
                    const clampedLeft = Math.max(minLeft, Math.min(maxLeft, targetLeft));
                    
                    fullText.style.left = `${clampedLeft}px`;
                    
                    localVarticalTransform = (((15 + fullText.offsetHeight) / fullText.offsetHeight) * -100) + '%';
                    
                    animate(fullText, {
                        visibility: 'visible',
                        opacity: [0, 1],
                        y: ["-100%", localVarticalTransform],
                        duration: 300, 
                        onComplete: () => setShowAnimationFullCaption(false)
                    });
                });


                self.add('mouseLeave', (e) => {
                    // Проверяем desktop
                    if (document.documentElement.clientWidth < 992) return;
                    
                    const captionParent = e.target.closest('.metagallery-item-viewer__caption-container'); 
                    
                    if (!captionParent) return;
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
                            setShowAnimationFullCaption(false)
                        }
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

    /**************** */
    


    const getStartCardPositions = ( cards ) => {
        
        const screenWidth = document.documentElement.clientWidth;

        if ( screenWidth >= 992 ) {
            if ( cards.length === 1 ) {
                return [ {x: "-40%", y: "-2%", rotate: "18deg", inx: 1 } ];
            }

            if ( cards.length === 2 ) {
                return [ 
                    {x: "0%", y: "-2%", rotate: "30deg", inx: 1 }, 
                    {x: "-50%", y: "-1%", rotate: "15deg", inx: 2 }, 
                ];
            }

            if ( cards.length > 2 ) {
                return [ 
                    {x: "-32%", y: "-6%", rotate: "10deg", inx: 3 }, 
                    {x: "-10%", y: "-20%", rotate: "30deg", inx: 2 },
                    {x: "25%", y: "-10%", rotate: "45deg", inx: 1 }, 
                    {x: "-32%", y: "-6%", rotate: "10deg", inx: 1 }, 
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


        
    }


    const getCardHeight = ( cards ) => {
        let maxHeight = 0;

        if ( cards.length ){
            cards.forEach( card => {
                if ( card.offsetHeight > maxHeight ){
                    maxHeight =  card.offsetHeight;
                }
                    
            } )
        }

        return maxHeight;
    } 


    const getCardsHoverPositions = (cards, height) => {
        const positions = [];
        const cardCount = cards.length;
        
        if (cardCount === 0) return positions;
        
        const gapX = 6;
        const gapY = 6;
        
        // Используем первую карточку для измерений
        const firstCard = cards[0];
        
        // Используем offsetWidth, а не getBoundingClientRect().width
        const cardWidth = firstCard.offsetWidth; // 116px
        const cardHeight = height || firstCard.offsetHeight; // Используем переданную высоту или высоту карточки
        
                
        // Проверяем ширину экрана
        const screenWidth = document.documentElement.clientWidth;
        
        let columns;
        const startOffset = screenWidth < 992 ? 10 : 0; // отступ для маленьких экранов
        
        if (screenWidth >= 992) {
            // Большие экраны - старая логика
            if (cardCount === 1) {
                columns = 1;
            } else if (cardCount === 2) {
                columns = 2;
            } else if (cardCount === 3) {
                columns = 3;
            } else if (cardCount === 4) {
                columns = 2;
            } else if (cardCount === 5) {
                columns = 3;
            } else if (cardCount === 6) {
                columns = 3;
            } else {
                const maxColumns = 3;
                columns = maxColumns;
            }
        } else {
            // Маленькие экраны - максимум 2 колонки
            if (cardCount === 1) {
                columns = 1;
            } else {
                columns = 2;
            }
        }
        
        const rows = Math.ceil(cardCount / columns);
        
        
        
        // Рассчитываем позиции для каждой карточки
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
        
        if (cardCount === 0) return { width: 0, height: 0 };
        
        const gapX = 6;
        const gapY = 6;
        
        // Используем первую карточку для измерений
        const firstCard = cards[0];
        const cardWidth = firstCard.offsetWidth; // 116px
        
        const cardHeight = cheight || firstCard.offsetHeight;
        
        
        // Проверяем ширину экрана
        const screenWidth = document.documentElement.clientWidth;
        
        let columns;
        const extraHeight = screenWidth < 992 ? 60 : 0; // дополнительная высота для маленьких экранов
        
        if (screenWidth >= 992) {
            // Большие экраны - старая логика
            if (cardCount === 1) {
                columns = 1;
            } else if (cardCount === 2) {
                columns = 2;
            } else if (cardCount === 3) {
                columns = 3;
            } else if (cardCount === 4) {
                columns = 2;
            } else if (cardCount === 5) {
                columns = 3;
            } else if (cardCount === 6) {
                columns = 3;
            } else {
                const maxColumns = 3;
                columns = maxColumns;
            }
        } else {
            // Маленькие экраны - максимум 2 колонки
            if (cardCount === 1) {
                columns = 1;
            } else {
                columns = 2;
            }
        }
        
        const rows = Math.ceil(cardCount / columns);
        
        // Рассчитываем размеры контейнера
        const width = columns * cardWidth + (columns - 1) * gapX;
        const height = rows * cardHeight + (rows - 1) * gapY + extraHeight;
        
        
        
        return { width, height };
    };

    useEffect(() => {
        if (productsScope.current) return;
        
        productsScope.current = createScope({ productsRootRef }).add(self => {
            
            let localCardsHoverPosition = [];
            let localCardsStartPosition = [];
            let localContainerSizes = {};
            let localCardHeight = 0;
            const screenWidth = document.documentElement.clientWidth;

        
            let mobileContainerWidth = 0;
            let mobileContainerHeight = 0;

            
            self.add('placementOfCards', () => {
                let productCards = document.querySelectorAll('.metagallery-item-viewer-product-card');
                
                if (!productCards.length) {
                    console.log('No cards found yet');
                    return;
                }
                
                localCardHeight = getCardHeight(productCards);
                
                
                const cardsPositions = getStartCardPositions(mediaProductCards);
                
                // Сохраняем в локальные переменные
                localCardsStartPosition = [...cardsPositions];
                localCardsHoverPosition = [...getCardsHoverPositions(productCards, localCardHeight)];
                localContainerSizes = getContainerSizes(productCards, localCardHeight);
                
                // Также сохраняем в состояния для React компонента
                setCardsStartPosition(localCardsStartPosition);
                setCardsHoverPosition(localCardsHoverPosition);

                
                
                if ( screenWidth >= 992 ) {
                    //setContainerSizes(localContainerSizes);
                    
                    setCardHeight( localCardHeight );
                } else {
                    setCardHeight( localCardHeight );
                }


                
                if (productCards.length) {
                    productCards.forEach((pc, index) => {


                        let setIndex = index;
                        if (index > 3) {
                            setIndex = 3;
                        }
                        
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
                }
            });

            self.add('mouseEnter', () => {
                
                const screenWidth = document.documentElement.clientWidth;

                if ( screenWidth < 992 ) {
                    return ;
                }


                let productCards = document.querySelectorAll('.metagallery-item-viewer-product-card');
                
                if (!productCards.length) {
                    console.log('No cards found yet');
                    return;
                }

                
                setContainerSizes(localContainerSizes);
                if (productCards.length && localCardsHoverPosition.length) {
                    productCards.forEach((pc, index) => {
                        if (localCardsHoverPosition[index]) {
                            animate(pc, {
                                x: '0%',
                                y: '0%',  
                                left: `${localCardsHoverPosition[index].left}px`,
                                bottom: `${localCardsHoverPosition[index].bottom}px`,
                                
                                rotate: '0deg',                                
                                ease: 'linear',
                                duration: 300,
                            })
                        }
                    });
                }
            });
            
            self.add('mouseLeave', () => {
                
                const screenWidth = document.documentElement.clientWidth;
                if ( screenWidth < 992 ) {
                    return ;
                }


                let productCards = document.querySelectorAll('.metagallery-item-viewer-product-card');
                
                if (!productCards.length) {
                    console.log('No cards found yet');
                    return;
                }


                if (productCards.length && localCardsStartPosition.length) {
                    productCards.forEach((pc, index) => {
                        let setIndex = index;
                        if (index > 3) {
                            setIndex = 3;
                        }
                        
                        if (localCardsStartPosition[setIndex]) {

                            animate(pc, {
                                x: localCardsStartPosition[setIndex].x,
                                y: localCardsStartPosition[setIndex].y,
                                left: 0,
                                bottom: 0,
                                rotate: localCardsStartPosition[setIndex].rotate,
                                
                                ease: 'linear',
                                duration: 300,
                            });


                            
                        }

                        setContainerSizes({});
                    });
                }
            });


            self.add('cardClick', () => {
                const screenWidth = document.documentElement.clientWidth;
                if ( screenWidth >= 992 ) {
                    return ;
                }
                
                const container = document.querySelector('.metagallery-item-viewer-card-container');  
                const innerContainer = document.querySelector('.metagallery-item-viewer-card-container--inner');
                let productCards = document.querySelectorAll('.metagallery-item-viewer-product-card');


                mobileContainerWidth = container.offsetWidth;
                mobileContainerHeight = container.height;

                container.classList.add('mobile-open');

                if (!productCards.length) {
                    console.log('No cards found yet');
                    return;
                }
                setMobileContainerSizes(localContainerSizes);
                
                
                if (productCards.length && localCardsHoverPosition.length) {
                    productCards.forEach((pc, index) => {
                        if (localCardsHoverPosition[index]) {
                            animate(pc, { 
                                x: '0%',
                                y: '0%',  
                                right: `${localCardsHoverPosition[index].left}px`,
                                bottom: `${localCardsHoverPosition[index].bottom}px`,                              
                                rotate: '0deg',                                
                                ease: 'linear',
                                duration: 300,
                                //postion: 'absolute',
                                onComplete: self => {
                                    innerContainer.scrollTop = innerContainer.scrollHeight;
                                    
                                }
                            })
                        }
                    });
                }

            })


            

            self.add('closeMobileCards', () => {
                
                const screenWidth = document.documentElement.clientWidth;
                if ( screenWidth >= 992 ) {
                    return ;
                }

                
                const container = document.querySelector('.metagallery-item-viewer-card-container');  
                const innerContainer = document.querySelector('.metagallery-item-viewer-card-container--inner');
                let productCards = document.querySelectorAll('.metagallery-item-viewer-product-card');


                mobileContainerWidth = container.offsetWidth;
                mobileContainerHeight = container.height;

                
                if (!productCards.length) {
                    console.log('No cards found yet');
                    return;
                }                

                if (productCards.length && localCardsStartPosition.length) {
                    productCards.forEach((pc, index) => {
                        let setIndex = index;
                        if (index > 3) {
                            setIndex = 3;
                        }
                        
                        if (localCardsStartPosition[setIndex]) {

                            animate(pc, {
                                x: localCardsStartPosition[setIndex].x,
                                y: localCardsStartPosition[setIndex].y,
                                right: 0,
                                bottom: 0,
                                rotate: localCardsStartPosition[setIndex].rotate,                                
                                ease: 'linear',
                                duration: 300,
                                
                            });


                            
                        }

                        setMobileContainerSizes({});
                        container.classList.remove('mobile-open');
                    });
                }
            });
        });

        return () => {
            if (productsScope.current) {
                productsScope.current.revert();
                productsScope.current = null;
            }
        };
    }, []);



    // Вызываем placementOfCards при изменении контента
    useEffect(() => {
        if (productsScope.current && productsScope.current.methods) {
            productsScope.current.methods.placementOfCards();
        }
    }, [currentIndex]); // Зависимости, которые требуют перерасчета карточек

    const isTooltipActive = (tooltipId) => {
        return activeTooltip && 
               activeTooltip.tooltipData.id === tooltipId && 
               activeTooltip.mediaId === media.id;
    };

    const isTooltipHighlighted = (tooltipId) => {
        if (!hoveredTooltipId) return false;
        
        if (hoveredTooltipId === tooltipId) {
            return 'active-hov';
        } else {
            return 'disabled-hov';
        }
    };

    const handleCardMouseEnter = (tooltipId) => {
        setHoveredTooltipId(tooltipId);
    };

    const handleCardMouseLeave = () => {
        setHoveredTooltipId(null);
    };





    
    


    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const update = () => {
            const container = containerRef.current;
            if (!container) return;
            const currentMedia = mediaList[currentIndex];
            if (!currentMedia) return;

            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            const sizes = calculateFittingSize(
                containerWidth,
                containerHeight,
                currentMedia.width,
                currentMedia.height
            );

            

            setFittingSizes(sizes);

            
        };

        update();
        window.addEventListener('resize', update);
        const t = setTimeout(update, 120);
        return () => {
            window.removeEventListener('resize', update);
            clearTimeout(t);
        };
    }, [currentIndex, mediaList]);




    const renderViewerImage = () => {
    if (!mediaList[currentIndex]) return null;
    const currentMedia = mediaList[currentIndex];
    const imageUrl = currentMedia.type_media === 'Image' ? currentMedia.image : currentMedia.video_placeholder;

    const baseW = fittingSizes.width || 0;
    const baseH = fittingSizes.height || 0;
   
    



    

    return (
        <div className="metagallery-item-viewer__outer-img-container" >
        {mediaList[currentIndex].tooltips && mediaList[currentIndex].tooltips.map((tooltip) => {
            const highlightedClass = isTooltipHighlighted(tooltip.id);
            const isActive = isTooltipActive(tooltip.id);

            const tooltipClass = `tooltip-window-trigger ${isActive ? 'active' : highlightedClass || ''}`;

            return (
            <button
                
                key={`${nanoid()}-${mediaList[currentIndex].id}-${tooltip.id}`}                
                className={tooltipClass}
                style={{
                left: `${tooltip.x}%`,
                top: `${tooltip.y}%`,
                position: 'absolute',
                }}
            >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 4.65306V3.34694H8V4.65306H0ZM3.29897 0H4.70103V8H3.29897V0Z" fill="#FAF8ED" />
                </svg>
            </button>
            );
        })}

        <div
            
            className="metagallery-item-viewer__img-inner-container"
            style={{
                width: `${fittingSizes.width}px`,
                height: `${fittingSizes.height}px`,
            }}
            // drag handlers attached on containerRef (ниже)
        >
            <img
            src={imageUrl}
            alt={currentMedia.alt || ''}
            style={{
                width: `${fittingSizes.width}px`,
                height: `${fittingSizes.height}px`,
            }}
            />
        </div>
        </div>
    );
    };






    //Отрисовка Zoom слайдера
    const renderZoomSlider = useCallback(() => {
        return (
            <div className="metagallery-zoom-slider">
                <div 
                    className={`metagallery-zoom-btn plus `}
                    
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="8.3877" y1="1.45313" x2="8.38769" y2="13.8168" stroke={true ? "#D0D0D0" : "#121212"}/>
                        <line x1="2.18164" y1="7.61328" x2="14.5453" y2="7.61328" stroke={true ? "#D0D0D0" : "#121212"}/>
                    </svg>
                </div>
                <Range
                    step={0.1}
                    min={1}
                    max={3}
                    values={[1]}
                    
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
                                margin: "0 auto"
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
                                outline: "none"
                            }}
                        />
                    )}
                />
                <div 
                    className={`metagallery-zoom-btn minus ${true ? 'disabled' : ''}`}
                    
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="2.18164" y1="7.60938" x2="14.5453" y2="7.60938" stroke={true ? "#D0D0D0" : "#121212"}/>
                    </svg>
                </div>
            </div>
        );
    }, [ ]);

    //Клик по карточке
    const handleCardClick = (e) => {
        const screenWidth = document.documentElement.clientWidth;
        
        if ( screenWidth < 992 ) {
            const parent = e.target.closest('.metagallery-item-viewer-card-container');
            if ( parent && !parent.classList.contains('mobile-open') ){
                e.preventDefault();
                e.stopPropagation();
                productsScope.current.methods.cardClick();
            } else if ( parent && parent.classList.contains('mobile-open') ){
                productsScope.current.methods.closeMobileCards();
            } 

            
        } else {
            return ;                
        }
    }

    //Клик по контейнеру с карточками
    const handleClickOnMobileContainer = ( e ) => {
        const screenWidth = document.documentElement.clientWidth;
        if ( screenWidth < 992 ) {
            const parent = e.target.closest('.metagallery-item-viewer-card-container');
            if ( parent && parent.classList.contains('mobile-open') ){
                e.stopPropagation();
                productsScope.current.methods.closeMobileCards();
            } 
        } else {
            return ;
        }
    }

    //Клик по Caption
    const handleCaptionClick = ( e ) => {
        

        let testParent = e.target.closest('.metagallery-item-viewer__caption-container');
        if ( showAnimationFullCaption || testParent || !openCaptionText) return;

        captionScope.current.methods.closeHoverClick( e, 'out' );
        setOpenCaptionText( false );
        setShowAnimationFullCaption(true);
    }

    return (


        <div 
            className={ `metagallery-item-viewer` }
            onClick = { ( e ) => {
                handleCaptionClick(e)

                
            } }
        
        >
            <div 
                className="metagallery-item-viewer__close"
                onClick={onClose}
            >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.94922 15.9492L15.8487 6.04972" stroke="#121212" strokeWidth="2" strokeLinecap="square" strokeLinejoin="round"/>
                    <path d="M5.94922 6.05078L15.8487 15.9503" stroke="#121212" strokeWidth="2" strokeLinecap="square" strokeLinejoin="round"/>
                </svg>
            </div>

            { media.tooltips && (
                <div 
                    className="metagallery-item-viewer-card-container" 
                    ref={productsRootRef} 
                    onMouseEnter={() => { 
                        
                        const screenWidth = document.documentElement.clientWidth;
                        if ( screenWidth < 992 ) return;

                        const container = productsRootRef.current;
                        if (container) {
                            container.classList.add('hover-state');
                        }
                        if (productsScope.current?.methods?.mouseEnter) {
                            productsScope.current.methods.mouseEnter();
                        }
                    }}
                    onMouseLeave={() => { 

                        const screenWidth = document.documentElement.clientWidth;
                        if ( screenWidth < 992 ) return;


                        const container = productsRootRef.current;
                        if (container) {
                            container.classList.remove('hover-state');
                        }
                        if (productsScope.current?.methods?.mouseLeave) {
                            productsScope.current.methods.mouseLeave();
                        }
                    }}

                    onClick={ handleClickOnMobileContainer }

                    style={ 
                        (containerSizes.width && containerSizes.height) || cardHeight > 0 
                            ? { 
                                ...(containerSizes.width && containerSizes.height && {
                                    width: `${containerSizes.width}px`, 
                                    height: `${containerSizes.height}px`
                                }),
                                ...(cardHeight > 0 && { minHeight: `${cardHeight}px` })
                            } 
                            : {} 
                    }
                >
                    <div 
                        className="metagallery-item-viewer-card-container--inner"
                       style={
                                cardHeight > 0 || containerSizes.width || containerSizes.height 
                                ? {
                                    ...(cardHeight > 0 && { minHeight: `${cardHeight}px` }),
                                    ...(mobileContainerSizes.width && { width: `${mobileContainerSizes.width}px` }),
                                    ...(mobileContainerSizes.height && { height: `${mobileContainerSizes.height}px` })
                                    }
                                : {}
                            }
                    >
                        <div 
                            className="metagallery-item-viewer-card-container__controls-container" 
                            onClick={handleCardClick}
                        >
                            <button className="metagallery-item-viewer-card-container__items-shown">
                                ITEMS SHOWN
                            </button>
                            <button className="metagallery-item-viewer-card-container__close">
                                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5.94922 15.9492L15.8487 6.04972" stroke="#121212" stroke-linecap="square" stroke-linejoin="round"/>
                                    <path d="M5.94922 6.05078L15.8487 15.9503" stroke="#121212" stroke-linecap="square" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>

                        {                        
                            media.tooltips.map((tooltip) => (
                                <a 
                                    className="metagallery-item-viewer-product-card"
                                    href={tooltip.link}
                                    key={tooltip.id}
                                    onMouseEnter={() => handleCardMouseEnter(tooltip.id)}
                                    onMouseLeave={handleCardMouseLeave}
                                    onClick={ handleCardClick }
                                >
                                    <div className="metagallery-item-viewer-product-card__img">
                                        <img src={tooltip.image} alt={tooltip.title} />
                                    </div>
                                    <div className="metagallery-item-viewer-product-card__text-block">
                                        <div className="metagallery-item-viewer-product-card__title">{tooltip.title}</div>
                                        <div className="metagallery-item-viewer-product-card__price">{tooltip.price}</div>                                            
                                    </div>
                                </a>
                            ))
                        }
                    </div>
                    
                    
                </div>
            )} 

                <div
                    className="metagallery-item-viewer__img-main-container"
                    ref={containerRef}
                    style={{ position: 'relative'}}
                
                >
                {renderViewerImage()}
                
                <div className="zoom-slider-container">
                    {renderZoomSlider()}
                </div>
            </div>

            { renderCaption() }
            

        </div>
    );
}

export default ViewerMedia;