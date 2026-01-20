//App.js
import React, { useState, useEffect, useCallback, useRef } from 'react';

import GalleryGrid from './components/GalleryGrid';
import TooltipWindow from './components/TooltipWindow';
import TooltipFog from './components/TooltipFog';
import GalleryLoader from './components/GalleryLoader';
import TaxonomyFilter from './components/TaxonomyFilter';
import RiveLoader from './components/RiveLoader';
import { animate, createScope } from 'animejs';


import 'swiper/css';


function App() {
    let newPostLoad = [];

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isFirstLoading, setIsFirstLoading] = useState(true);


    const [mediaList, setMediaList] = useState([]);
    const [postsCount, setPostsCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [screenWidth, setScreenWidth] = useState(0);
    const [colCount, setColCount] = useState(2);
    const [baseGap, setBaseGap] = useState(4);
    const [baseWidth, setBaseWidth] = useState(0);
    const [gridHeight, setGridHeight] = useState(0);
    
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [tooltipPhase, setTooltipPhase] = useState('idle'); 
  
    const [pendingTooltip, setPendingTooltip] = useState(null);



    const [showFog, setShowFog] = useState(false);
    
    const [fullscreenMode, setFullscreenMode] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [vh100, setVh100] = useState(0);
    
    const [loadBtnText, setLoadBtnText] = useState('');
    const [loadBtnTextLoading, setLoadBtnTextLoading] = useState('');
    const [exitFullScreenText,  setExitFullScreenText] = useState('');
    const [itemsShownText, setItemsShownText ]= useState('');

    const [isViewerCaller, setIsViewerCaller ]= useState(false);
    

    
    const [shuffled, setShuffled] = useState(false);
    
    const [taxonomies, setTaxonomies] = useState([]);
    const [selectedTaxonomies, setSelectedTaxonomies] = useState({
        group: null,
        product_type: null
    });
    const [filteredPostsCount, setFilteredPostsCount] = useState(0);
    const [showContentLoader, setShowContentLoader] = useState(false);
    
    const [isShuffling, setIsShuffling] = useState(false);
    const [forceLoader, setForceLoader] = useState(false);

    const loaderRef = useRef( null );


    const [ tooltipClosingAnimation, setTooltipClosingAnimation ] = useState(false);

    const btnsRootRef = useRef(null);
    const btnsScope = useRef(null);


    


    useEffect( () => {
        // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
        let vh = window.innerHeight * 0.01;
        // Then we set the value in the --vh custom property to the root of the document
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        window.addEventListener('resize', () => {
        // We execute the same script as before
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);

            
        });
    }, [])





    //  изменяем эффект для Intersection Observer
    useEffect(() => {
        if (!hasMore || isLoadingMore || !loaderRef.current) return ;
        
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore) {
                    loadMoreData();
                }
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            }
        );
        
        const currentLoaderRef = loaderRef.current;
        observer.observe(currentLoaderRef);
        
        return () => {
            if (currentLoaderRef) {
                observer.unobserve(currentLoaderRef);
            }
        };
    }, [hasMore, isLoadingMore]); 

    
    // Функция для получения AJAX nonce
    const getNonce = () => {
        if (window.mediaGalleryAjax && window.mediaGalleryAjax.nonce) {
            return window.mediaGalleryAjax.nonce;
        }
        return '';
    };
    
    // Функция для получения AJAX URL
    const getAjaxUrl = () => {
        if (window.mediaGalleryAjax && window.mediaGalleryAjax.ajaxurl) {
            return window.mediaGalleryAjax.ajaxurl;
        }
        return `${window.location.origin}/wp-admin/admin-ajax.php`;
    };

    // Функция для загрузки данных через AJAX
    const fetchMediaGallery = async (params = {}) => {
        const defaultParams = {
            action: 'media_gallery',
            nonce: getNonce(),
            ...params
        };
        
        // Добавляем параметр img-size для мобильных
        if (window.innerWidth < 500) {
            defaultParams['img-size'] = 'medium';
        }
        
        try {
            // Используем URLSearchParams для лучшей совместимости с Safari
            const searchParams = new URLSearchParams();
            Object.keys(defaultParams).forEach(key => {
                if (defaultParams[key] !== undefined && defaultParams[key] !== '') {
                    searchParams.append(key, String(defaultParams[key]));
                }
            });
            
            // Для старых Safari можно добавить полифил для URLSearchParams
            const response = await fetch(getAjaxUrl(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                },
                body: searchParams.toString(),
                // credentials: 'same-origin' // Safari может иметь проблемы с этим
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

                        
            // Проверяем структуру ответа
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format');
            }
            
            return data;
            
        } catch (error) {
            console.error('Error fetching media gallery:', error);
            // Возвращаем структурированный fallback
            return { 
                success: false, 
                posts: [], 
                posts_count: 0, 
                groups: [], 
                product_type: [] 
            };
        }
    };

    const handleTaxonomyToggle = (taxonomy) => {
        const isCurrentlySelected = (
            (taxonomy.type === 'group' && selectedTaxonomies.group?.id === taxonomy.id) ||
            (taxonomy.type === 'product-type' && selectedTaxonomies.product_type?.id === taxonomy.id)
        );
        
        const newSelectedTaxonomies = { ...selectedTaxonomies };
        
        if (isCurrentlySelected) {
            if (taxonomy.type === 'group') {
                newSelectedTaxonomies.group = null;
            } else if (taxonomy.type === 'product-type') {
                newSelectedTaxonomies.product_type = null;
            }
            
            const path = window.location.pathname;
            const pathParts = path.split('/').filter(part => part);
            const langPrefix = pathParts[0] !== 'gallery' ? `/${pathParts[0]}` : '';
            window.history.pushState({}, '', `${langPrefix}/gallery/`);
        } else {
            if (taxonomy.type === 'group') {
                newSelectedTaxonomies.group = taxonomy;
                newSelectedTaxonomies.product_type = null;
            } else if (taxonomy.type === 'product-type') {
                newSelectedTaxonomies.product_type = taxonomy;
                newSelectedTaxonomies.group = null;
            }
            
            const urlType = taxonomy.type;
            const path = window.location.pathname;
            const pathParts = path.split('/').filter(part => part);
            const langPrefix = pathParts[0] !== 'gallery' ? `/${pathParts[0]}` : '';
            
            window.history.pushState({}, '', `${langPrefix}/gallery/${urlType}/${taxonomy.slug}`);
        }
        
        setSelectedTaxonomies(newSelectedTaxonomies);
        loadingData(newSelectedTaxonomies.group, newSelectedTaxonomies.product_type);
    };

    const handleResetFilters = () => {
        setSelectedTaxonomies({
            group: null,
            product_type: null
        });
        
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(part => part);
        const langPrefix = pathParts[0] !== 'gallery' ? `/${pathParts[0]}` : '';
        
        window.history.pushState({}, '', `${langPrefix}/gallery/`);
        loadingData();
    };

    const hasActiveFilters = selectedTaxonomies.group || selectedTaxonomies.product_type;

    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const getFiltersFromURL = () => {
        const path = window.location.pathname;
        const pathParts = path.split('/').filter(part => part);
        const galleryIndex = pathParts.indexOf('gallery');
        
        if (galleryIndex === -1) return null;
        
        if (pathParts.length > galleryIndex + 2) {
            const typeFromURL = pathParts[galleryIndex + 1];
            const slug = pathParts[galleryIndex + 2];
            
            if ((typeFromURL === 'group' || typeFromURL === 'product-type') && slug) {
                return { 
                    type: typeFromURL,
                    slug 
                };
            }
        }
        return null;
    };

    const shuffleMedia = () => {
        setIsShuffling(true);
        setForceLoader(true);
        
        setTimeout(() => {
            const shuffledArray = [...mediaList];
            for (let i = shuffledArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
            }
            
            if (document.documentElement.clientWidth >= 992) {
                setMediaList([...placementElements3Col(shuffledArray, getBaseGap(), getBaseWidth())]);
            } else {
                setMediaList([...placementElements2Col(shuffledArray, getBaseGap(), getBaseWidth())]);
            }
            
            setShuffled(true);
            
            setTimeout(() => {
                setIsShuffling(false);
                setForceLoader(false);
            }, 700);
        }, 300);
    };




    const handleTooltipOpen = useCallback((tooltipData, triggerElement, mediaId) => {
        

       if ( triggerElement ) {
            const testViewerCalled = triggerElement.closest('.metagallery-item-viewer__slide-root')
            setIsViewerCaller(testViewerCalled);
       }
        

        

        // 1. Явное закрытие (onTooltipClick(null, ...))
        if (!tooltipData) {
            

            if (!activeTooltip) return;
            setTooltipPhase('closing');
            setShowFog(false);
            return;
        }

        // 2. Нет активного — обычное открытие
        if (!activeTooltip) {
            
            setActiveTooltip({ tooltipData, triggerElement, mediaId });
            setTooltipPhase('opening');
            if (window.innerWidth < 992) setShowFog(true);
            return;
        }

        const isSame = activeTooltip && 
                  activeTooltip.tooltipData.id === tooltipData.id && 
                  activeTooltip.mediaId === mediaId &&
                  activeTooltip.tooltipData.sourceMediaId === tooltipData.sourceMediaId;

        

        // 3. Клик по тому же — закрываем
        if (isSame) {
            
            setTooltipPhase('closing');
            setShowFog(false);
            return;
        }

        // 4. Клик по другому — переключение
        setPendingTooltip({ tooltipData, triggerElement, mediaId });
        setTooltipPhase('switching');

        
        if (window.innerWidth < 992) setShowFog(true);
    }, [activeTooltip]);


    const handleTooltipClose = useCallback(() => {
        if (!activeTooltip) return;
        setTooltipPhase('closing');
        setShowFog(false);
    }, [activeTooltip]);

    const handleTooltipAnimationCloseEnd = useCallback(() => {
        // Закрытие без переключения
        if (tooltipPhase === 'closing') {
            setActiveTooltip(null);
            setPendingTooltip(null);
            setTooltipPhase('idle');
            return;
        }

        // Переключение тултипов
        if (tooltipPhase === 'switching') {
            if (pendingTooltip) {
                // Подставляем новый тултип и запускаем его открытие
                setActiveTooltip(pendingTooltip);
                setPendingTooltip(null);
                setTooltipPhase('opening');
            } else {
                // На всякий случай, если по какой-то причине pendingTooltip нет
                setActiveTooltip(null);
                setTooltipPhase('idle');

                
            }
        }
    }, [tooltipPhase, pendingTooltip]);


    const handleTooltipAnimationOpenEnd = useCallback(() => {
        setTooltipPhase('open');
    }, []);


    // ОБРАБОТЧИК КЛИКА ВНЕ ТУЛТИПА
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeTooltip && 
                !event.target.closest('.tooltip-window') && 
                !event.target.closest('.tooltip-window-trigger')) {
                handleTooltipClose();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeTooltip, handleTooltipClose]);

    // ПЕРЕСЧЕТ ПОЗИЦИИ ПРИ РЕСАЙЗЕ
    useEffect(() => {
        const handleResize = () => {
            if (activeTooltip && activeTooltip.triggerElement) {
                handleTooltipOpen(activeTooltip.tooltipData, activeTooltip.triggerElement);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeTooltip, handleTooltipOpen]);

    // ПРОВЕРКА ВИДИМОСТИ ТУЛТИПА ПРИ СКРОЛЛЕ 
    useEffect(() => {
        const testOutsideTooltipPosition = (tooltipElement) => {
            const rect = tooltipElement.getBoundingClientRect();
            const header = document.querySelector('.site-header');
            const headerHeight = header ? header.offsetHeight : 0;
            
            return (
                (rect.top + tooltipElement.offsetHeight - headerHeight < 0) || 
                (rect.top > window.innerHeight) 
            );
        };

        const handleScroll = () => {
            if (activeTooltip) {
                const tooltipElement = document.querySelector('.tooltip-window.active');
                if (tooltipElement && testOutsideTooltipPosition(tooltipElement)) {
                    handleTooltipClose();
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [activeTooltip, handleTooltipClose]);

    

    //loadMoreData

    const loadMoreData = async () => {
        if (isLoadingMore || !hasMore) return;
        
        setIsLoadingMore(true);
        
        const startTime = Date.now();
        const MIN_LOADER_TIME = 300;
        
        try {
            const params = {
                group: selectedTaxonomies.group?.slug || '',
                product_type: selectedTaxonomies.product_type?.slug || '',
                offset: mediaList.length
            };

            if (window.innerWidth < 500) {
                params['img-size'] = 'medium';
            }
            
            const data = await fetchMediaGallery(params);
            
            if (!data.success) {
                throw new Error('Failed to load more data');
            }
            
            const newPosts = data.posts || [];
            
            // Создаем новый массив с уже существующими данными
            const allPosts = [...mediaList, ...newPosts];
            
            let updatedPosts;
            if (document.documentElement.clientWidth >= 992) {
                updatedPosts = placementElements3Col(
                    [...allPosts], 
                    getBaseGap(), 
                    getBaseWidth(),
                    data.posts_count || 0 // Передаем общее количество постов
                );
            } else {
                updatedPosts = placementElements2Col(
                    [...allPosts], 
                    getBaseGap(), 
                    getBaseWidth(),
                    data.posts_count || 0 // Передаем общее количество постов
                );
            }
            
            // Обновляем состояние
            setMediaList([...updatedPosts]);
            setHasMore(allPosts.length < (data.posts_count || 0));
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        } finally {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, MIN_LOADER_TIME - elapsedTime);
            
            setTimeout(() => {
                setIsLoadingMore(false);
                setForceLoader(false);
            }, remainingTime);
        }
    };



    // ФУНКЦИИ ДЛЯ РАСЧЕТА ГРИДА
    const calculateImageHeight = (initialWidth, initialHeight, baseWidth) => {
        return (baseWidth * initialHeight) / initialWidth;
    }


    /**
     * Функция для размещения элементов в 3 колонки с иммутабельным подходом
     */
    const placementElements3Col = (posts, gap, baseWidth, totalPostsCount = 0) => {
        // Создаем полностью новые объекты для каждого поста
        let updatedPosts = posts.map(post => ({
            id: post.id,
            type_media: post.type_media,
            image: post.image,
            video: post.video,
            width: post.width,
            height: post.height,
            filesize: post.filesize,
            video_placeholder: post.video_placeholder,
            thumbnail: post.thumbnail,
            caption: post.caption,
            alt: post.alt,
            // Глубокое копирование массива tooltips
            tooltips: post.tooltips ? post.tooltips.map(tip => ({
                x: tip.x,
                y: tip.y,
                test_x: tip.test_x,
                test_y: tip.test_y,
                id: tip.id,
                title: tip.title,
                price: tip.price,
                link: tip.link,
                image: tip.image,
                description: tip.description,
                link_text: tip.link_text
            })) : [],
            left: 0,
            top: 0
        }));

        let colHeights = [0, 0, 0];

        for (let i = 0; i < updatedPosts.length; i += 3) {
            const group = updatedPosts.slice(i, i + 3);
            
            const heights = group.map(post => 
                calculateImageHeight(post.width, post.height, baseWidth)
            );
            
            // Создаем копию группы для сортировки
            const sortedGroup = group.map(post => ({...post})).sort((a, b) => {
                const heightA = calculateImageHeight(a.width, a.height, baseWidth);
                const heightB = calculateImageHeight(b.width, b.height, baseWidth);
                return heightB - heightA;
            });

            const sortedCols = colHeights
                .map((height, index) => ({ height, index }))
                .sort((a, b) => a.height - b.height);
            
            for (let j = 0; j < sortedGroup.length; j++) {
                const post = sortedGroup[j];
                const colIndex = sortedCols[j].index;
                const colHeight = colHeights[colIndex];
                
                // Находим соответствующий пост в updatedPosts и обновляем его
                const postIndex = updatedPosts.findIndex(p => p.id === post.id);
                if (postIndex !== -1) {
                    updatedPosts[postIndex].left = colIndex * (baseWidth + gap);
                    updatedPosts[postIndex].top = colHeight;
                    colHeights[colIndex] += calculateImageHeight(
                        updatedPosts[postIndex].width, 
                        updatedPosts[postIndex].height, 
                        baseWidth
                    ) + gap;
                }
            }
        }

        // Определяем, все ли загружено
        const isEverythingLoaded = totalPostsCount > 0 && posts.length >= totalPostsCount;
        
        // Используем максимальную высоту для стабильности
        const finalGridHeight = Math.max(...colHeights);
        setGridHeight(finalGridHeight);

        return updatedPosts;
    };

    /**
     * Функция для размещения элементов в 2 колонки с иммутабельным подходом
     */
    const placementElements2Col = (posts, gap, baseWidth, totalPostsCount = 0) => {
        // Создаем полностью новые объекты для каждого поста
        let updatedPosts = posts.map(post => ({
            id: post.id,
            type_media: post.type_media,
            image: post.image,
            video: post.video,
            width: post.width,
            height: post.height,
            filesize: post.filesize,
            video_placeholder: post.video_placeholder,
            thumbnail: post.thumbnail,
            caption: post.caption,
            alt: post.alt,
            // Глубокое копирование массива tooltips
            tooltips: post.tooltips ? post.tooltips.map(tip => ({
                x: tip.x,
                y: tip.y,
                test_x: tip.test_x,
                test_y: tip.test_y,
                id: tip.id,
                title: tip.title,
                price: tip.price,
                link: tip.link,
                image: tip.image,
                description: tip.description,
                link_text: tip.link_text
            })) : [],
            left: 0,
            top: 0
        }));

        let colHeights = [0, 0];

        for (let i = 0; i < updatedPosts.length; i += 2) {
            const group = updatedPosts.slice(i, i + 2);
            
            if (group.length === 2) {
                const heights = group.map(post => 
                    calculateImageHeight(post.width, post.height, baseWidth)
                );
                
                const higherIndex = heights[0] > heights[1] ? 0 : 1;
                const lowerIndex = higherIndex === 0 ? 1 : 0;
                
                const sortedCols = colHeights
                    .map((height, index) => ({ height, index }))
                    .sort((a, b) => a.height - b.height);
                
                // Обновляем первый пост (более высокий)
                const higherPostIndex = updatedPosts.findIndex(p => p.id === group[higherIndex].id);
                if (higherPostIndex !== -1) {
                    updatedPosts[higherPostIndex].left = sortedCols[0].index * (baseWidth + gap);
                    updatedPosts[higherPostIndex].top = sortedCols[0].height;
                    colHeights[sortedCols[0].index] += heights[higherIndex] + gap;
                }
                
                // Обновляем второй пост (более низкий)
                const lowerPostIndex = updatedPosts.findIndex(p => p.id === group[lowerIndex].id);
                if (lowerPostIndex !== -1) {
                    updatedPosts[lowerPostIndex].left = sortedCols[1].index * (baseWidth + gap);
                    updatedPosts[lowerPostIndex].top = sortedCols[1].height;
                    colHeights[sortedCols[1].index] += heights[lowerIndex] + gap;
                }
            } else {
                // Один элемент в группе
                const post = group[0];
                const minHeightIndex = colHeights.indexOf(Math.min(...colHeights));
                const postIndex = updatedPosts.findIndex(p => p.id === post.id);
                
                if (postIndex !== -1) {
                    updatedPosts[postIndex].left = minHeightIndex * (baseWidth + gap);
                    updatedPosts[postIndex].top = colHeights[minHeightIndex];
                    colHeights[minHeightIndex] += calculateImageHeight(
                        updatedPosts[postIndex].width, 
                        updatedPosts[postIndex].height, 
                        baseWidth
                    ) + gap;
                }
            }
        }

        // Определяем, все ли загружено
        const isEverythingLoaded = totalPostsCount > 0 && posts.length >= totalPostsCount;
        
        // Используем максимальную высоту для стабильности
        const finalGridHeight = Math.max(...colHeights);
        setGridHeight(finalGridHeight);

        return updatedPosts;
    };


    const getBaseGap = () => {
        return document.documentElement.clientWidth >= 744 ? 4 : 6;
    }

    const getBaseWidth = () => {
        const width = document.documentElement.clientWidth;
        if (width < 744) {
            return (width / 2) - 12 / 3;
        } else if (width >= 744 && width < 992) {
            return (width / 2) - 18 / 3;
        } else {
            return (width / 3) - 24 / 3;
        }
    }

    const getColCount = () => {
        return document.documentElement.clientWidth >= 992 ? 3 : 2;
    }

    const setGridColsParams = () => {
        const width = document.documentElement.clientWidth;
        setScreenWidth(width);
        setBaseGap(getBaseGap());
        setBaseWidth(getBaseWidth());
        setColCount(getColCount());
    }

    const rerenderGrid = useCallback(() => {
        setGridColsParams();
        
        if (mediaList && mediaList.length > 0) {            
            if (document.documentElement.clientWidth >= 992) {
                setMediaList([...placementElements3Col(mediaList, getBaseGap(), getBaseWidth())]);
            } else {
                setMediaList([...placementElements2Col(mediaList, getBaseGap(), getBaseWidth())]);
            }
        }
    }, [mediaList]);

    useEffect(() => {
        setGridColsParams();
        window.addEventListener('resize', rerenderGrid);
        return () => window.removeEventListener('resize', rerenderGrid);
    }, [mediaList]);

    // ФУНКЦИЯ ЗАГРУЗКИ ДАННЫХ
    const loadingData = async (selectedGroup = null, selectedProductType = null) => {
        setIsLoading(true);
        setForceLoader(true);
        
        const startTime = Date.now();
        const MIN_LOADER_TIME = 300;
        
        try {
            const params = {
                group: selectedGroup?.slug || '',
                product_type: selectedProductType?.slug || '',
                offset: 0
            };

            
            if (window.innerWidth < 500) {
                params['img-size'] = 'medium';

                
            }
            
            const data = await fetchMediaGallery(params);

            
            
            if (!data.success) {
                throw new Error('Failed to load data');
            }
            
            setGridColsParams();
            
            


            const posts = data.posts || [];
            
            const formattedTaxonomies = [
                ...(data.groups || []).map(item => ({
                    ...item,
                    type: 'group',
                    label: 'Background'
                })),
                ...(data.product_type || []).map(item => ({
                    ...item,
                    type: 'product-type',
                    label: 'Product'
                }))
            ];
            
            if (taxonomies.length === 0) {
                const shuffledTaxonomies = shuffleArray(formattedTaxonomies);
                setTaxonomies(shuffledTaxonomies);
            } else {
                setTaxonomies(taxonomies);
            }
            
            setPostsCount(data.posts_count || 0);
            setFilteredPostsCount(data.posts_count || 0);
            
            if (document.documentElement.clientWidth >= 992) {
                setMediaList([...placementElements3Col(posts, getBaseGap(), getBaseWidth())]);
            } else {
                setMediaList([...placementElements2Col(posts, getBaseGap(), getBaseWidth())]);
            }
            
            setHasMore(posts.length < data.posts_count);
            setOffset(posts.length);
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            setMediaList([]);
            setTaxonomies([]);
        } finally {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, MIN_LOADER_TIME - elapsedTime);
            
            setTimeout(() => {
                setIsLoading(false);
                setForceLoader(false);
            }, remainingTime);
        }
    };

    const calculateFullscreenPosition = useCallback((triggerElement, tooltipWidth, tooltipHeight) => {
        const rect = triggerElement.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        const leftDoc = rect.left + scrollLeft;
        const rightDoc = document.documentElement.clientWidth - leftDoc - triggerElement.offsetWidth;
        const topDoc = rect.top + scrollTop;

        const topScreenToElem = window.screenY + rect.top;
        const screenHeight = document.documentElement.clientHeight;
        const bottomScreenToElem = screenHeight - (window.screenY + rect.bottom);

        const testRightSpace = rightDoc - tooltipWidth - 20;
        const testCenterXSpace = rightDoc - (tooltipWidth / 2) - 20;

        let xValue = 0;
        let top = 0;
        let xSide = 'left';
        let ySide = 'bottom';

        const headerHeight = 0;
        let adminBarHeight = 0;

        const testTopSpace = topScreenToElem - headerHeight - adminBarHeight - tooltipHeight - triggerElement.offsetHeight - 10;
        const testBottomSpace = bottomScreenToElem - tooltipHeight - triggerElement.offsetHeight - 10;
        const testCenterSpaceOfTop = topScreenToElem - headerHeight - adminBarHeight - (tooltipHeight / 2) - 5;
        const testCenterSpaceOfBottom = bottomScreenToElem - (tooltipHeight / 2) - 5;

        if (testCenterSpaceOfTop > 0 && testCenterSpaceOfBottom > 0 && xSide !== 'center') {
            top = (topDoc - (tooltipHeight / 2) - 5);
            ySide = 'center';
        } else if (testTopSpace > 30) {
            top = (topDoc - tooltipHeight - 10);
            ySide = 'top';
        } else if (testBottomSpace > 0) {
            ySide = 'bottom';
            top = (topDoc + 10 + triggerElement.offsetHeight);
        } else {
            ySide = 'optimal';
            if ((topScreenToElem - headerHeight - adminBarHeight - tooltipHeight - 10) > 0) {
                top = rect.top + scrollTop - tooltipHeight + triggerElement.offsetHeight + 40;
            } else {
                top = (topDoc - topScreenToElem + headerHeight + adminBarHeight + 40);
            }
        }

        if (ySide !== 'optimal') {
            if (testRightSpace > 0) {
                xValue = leftDoc;
                xSide = 'left';
            } else if (testCenterXSpace > 0 && ySide !== 'center') {
                xValue = (leftDoc - (tooltipWidth / 2) + 10);
                xSide = 'center';
            } else {
                xValue = rightDoc;
                xSide = 'right';
            }
        } else {
            if (testRightSpace > 0) {
                xValue = leftDoc;
                xSide = 'left';
            } else {
                xValue = rightDoc;
                xSide = 'right';
            }
        }

        const positionStyles = {
            top: `${top}px`
        };

        if (ySide === 'optimal') {
            if (xSide === 'right') {
                positionStyles.right = `${xValue + triggerElement.offsetWidth + 10}px`;
            } else {
                positionStyles.left = `${xValue + triggerElement.offsetWidth + 10}px`;
            }
        } else {
            if (xSide === 'right') {
                positionStyles.right = `${xValue}px`;
                if (ySide === 'center') {
                    positionStyles.right = `${xValue + triggerElement.offsetWidth + 10}px`;
                }
            } else {
                if (ySide === 'center') {
                    positionStyles.left = `${xValue + triggerElement.offsetWidth + 10}px`;
                } else {
                    positionStyles.left = `${xValue}px`;
                }
            }
        }

        return positionStyles;
    }, []);

    // РАСЧЕТ ПОЗИЦИИ ТУЛТИПА
    const calculateTooltipPosition = useCallback((triggerElement, tooltipWidth, tooltipHeight) => {
        

        if (!triggerElement) return {};
        
        if (window.innerWidth < 992) {
            return {
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
            };
        }
        
        if (!fullscreenMode) {
            const rect = triggerElement.getBoundingClientRect();
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            const leftDoc = rect.left + scrollLeft;
            const rightDoc = document.documentElement.clientWidth - leftDoc - triggerElement.offsetWidth;
            const topDoc = rect.top + scrollTop;

            const topScreenToElem = window.screenY + rect.top;
            const screenHeight = document.documentElement.clientHeight;
            const bottomScreenToElem = screenHeight - (window.screenY + rect.bottom);

            const testRightSpace = rightDoc - tooltipWidth - 20;
            const testCenterXSpace = rightDoc - (tooltipWidth / 2) - 20;

            let xValue = 0;
            let top = 0;
            let xSide = 'left';
            let ySide = 'bottom';

            const header = document.querySelector('.site-header');
            const headerHeight = header ? header.offsetHeight : 0;

            let adminBarHeight = 0;
            const adminBar = document.querySelector('#wpadminbar');
            if (adminBar) {
                adminBarHeight = adminBar.offsetHeight;
            }

            const testTopSpace = topScreenToElem - headerHeight - adminBarHeight - tooltipHeight - triggerElement.offsetHeight - 10;
            const testBottomSpace = bottomScreenToElem - tooltipHeight - triggerElement.offsetHeight - 10;
            const testCenterSpaceOfTop = topScreenToElem - headerHeight - adminBarHeight - (tooltipHeight / 2) - 5;
            const testCenterSpaceOfBottom = bottomScreenToElem - (tooltipHeight / 2) - 5;

            if (testCenterSpaceOfTop > 0 && testCenterSpaceOfBottom > 0 && xSide !== 'center') {
                top = (topDoc - (tooltipHeight / 2) - 5);
                ySide = 'center';
            } else if (testTopSpace > 30) {
                top = (topDoc - tooltipHeight - 10);
                ySide = 'top';
            } else if (testBottomSpace > 0) {
                ySide = 'bottom';
                top = (topDoc + 10 + triggerElement.offsetHeight);
            } else {
                ySide = 'optimal';
                if ((topScreenToElem - headerHeight - adminBarHeight - tooltipHeight - 10) > 0) {
                    top = rect.top + scrollTop - tooltipHeight + triggerElement.offsetHeight + 40;
                } else {
                    top = (topDoc - topScreenToElem + headerHeight + adminBarHeight + 40);
                }
            }

            if (ySide !== 'optimal') {
                if (testRightSpace > 0) {
                    xValue = leftDoc;
                    xSide = 'left';
                } else if (testCenterXSpace > 0 && ySide !== 'center') {
                    xValue = (leftDoc - (tooltipWidth / 2) + 10);
                    xSide = 'center';
                } else {
                    xValue = rightDoc;
                    xSide = 'right';
                }
            } else {
                if (testRightSpace > 0) {
                    xValue = leftDoc;
                    xSide = 'left';
                } else {
                    xValue = rightDoc;
                    xSide = 'right';
                }
            }

            const positionStyles = {
                top: `${top}px`
            };

            if (ySide === 'optimal') {
                if (xSide === 'right') {
                    positionStyles.right = `${xValue + triggerElement.offsetWidth + 10}px`;
                } else {
                    positionStyles.left = `${xValue + triggerElement.offsetWidth + 10}px`;
                }
            } else {
                if (xSide === 'right') {
                    positionStyles.right = `${xValue}px`;
                    if (ySide === 'center') {
                        positionStyles.right = `${xValue + triggerElement.offsetWidth + 10}px`;
                    }
                } else {
                    if (ySide === 'center') {
                        positionStyles.left = `${xValue + triggerElement.offsetWidth + 10}px`;
                    } else {
                        positionStyles.left = `${xValue}px`;
                    }
                }
            }

            return positionStyles;
        }
        
        return calculateFullscreenPosition(triggerElement, tooltipWidth, tooltipHeight);
    }, [fullscreenMode]);

    // ОБРАБОТЧИКИ UI
    const handleToUpScroll = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleChangeScreenMode = () => {
        const newMode = !fullscreenMode;

        if (newMode) {
            setFullscreenMode(newMode);
            document.body.classList.add('gallery-fullscreen-mode');
            document.body.style.maxWidth = document.documentElement.clientWidth + 'px';
        } else {
            setFullscreenMode(!fullscreenMode);
            document.body.classList.remove('gallery-fullscreen-mode');
            document.body.style.maxWidth = '';
        }
    }

    // ОБРАБОТЧИК SCROLL ДЛЯ ОПРЕДЕЛЕНИЯ VH
    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.pageYOffset || document.documentElement.scrollTop);
            setVh100(document.documentElement.clientHeight);
        };

        window.addEventListener('scroll', handleScroll);




        
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);



    /* Анимации кнопок */
    useEffect( () => {
        if (btnsScope.current) return;
                
        btnsScope.current = createScope({ btnsRootRef }).add(self => {
            self.add('showUp', (e) => {
                const scrollUpBtn = document.querySelector('.metagallery-btn.metagallery-btn-scrollup');
                if ( !scrollUpBtn )  return;
                if ( scrollUpBtn.classList.contains('active') )  return;
                animate(scrollUpBtn, {                    
                    opacity: [0, 1],
                    duration: 200,
                    ease: 'linear',
                    onBegin: () => scrollUpBtn.classList.add('active')                 
                });
            })
            self.add('hideUp', (e) => {
                const scrollUpBtn = document.querySelector('.metagallery-btn.metagallery-btn-scrollup');
                if ( !scrollUpBtn )  return;
                if ( !scrollUpBtn.classList.contains('active') )  return;

                animate(scrollUpBtn, {                    
                    opacity: [1, 0],                    
                    duration: 200,
                    ease: 'linear',
                    onComplete: () => scrollUpBtn.classList.remove('active')                    
                });
            })

            self.add('showExitFullScreen', (e) => {
                const btnExitFullScreen = document.querySelector('.metagallery-btn-exit-fs');
                if ( !btnExitFullScreen )  return;
                if ( btnExitFullScreen.classList.contains('active') )  return;
                animate(btnExitFullScreen, {                    
                    opacity: [0, 1],
                    duration: 200,
                    ease: 'linear',
                    onBegin: () => btnExitFullScreen.classList.add('active')                 
                });
            })
            self.add('hideExitFullScreen', (e) => {
                const btnExitFullScreen = document.querySelector('.metagallery-btn-exit-fs');
                if ( !btnExitFullScreen )  return;
                if ( !btnExitFullScreen.classList.contains('active') )  return;

                animate(btnExitFullScreen, {                    
                    opacity: [1, 0],                    
                    duration: 200,
                    ease: 'linear',
                    onComplete: () => btnExitFullScreen.classList.remove('active')                    
                });
            })
        })
    }, [] )

    useEffect( () => {
        if ( (scrollY > vh100 / 2) && scrollY > 0 && vh100 > 0) {
            btnsScope.current.methods.showUp();
        } else {
            btnsScope.current.methods.hideUp();
        }        
    }, [scrollY])

    useEffect(() => {
        if ( fullscreenMode ){
            btnsScope.current.methods.showExitFullScreen();
        } else {
            btnsScope.current.methods.hideExitFullScreen();
        }
    }, [fullscreenMode]);

    /* Анимации кнопок */


    // ПЕРВОНАЧАЛЬНАЯ ЗАГРУЗКА
    useEffect(() => {

    

        const urlFilters = getFiltersFromURL();
        
        const loadInitialData = async () => {
            try {
                const data = await fetchMediaGallery();
                
                if (!data.success) {
                    throw new Error('Failed to load initial data');
                }
                
                const formattedTaxonomies = [
                    ...(data.groups || []).map(item => ({
                        ...item,
                        type: 'group',
                        label: 'Background'
                    })),
                    ...(data.product_type || []).map(item => ({
                        ...item,
                        type: 'product-type',
                        label: 'Product'
                    }))
                ];




                setLoadBtnText(data.load_btn_text);
                setLoadBtnTextLoading(data.load_btn_text_loading);

                setExitFullScreenText(data.exit_full_screen_text);
                setItemsShownText(data.items_shown_text);

                
                let taxonomiesToSet = formattedTaxonomies;
                
                if (taxonomies.length === 0) {
                    taxonomiesToSet = shuffleArray(formattedTaxonomies);
                }
                
                setTaxonomies(taxonomiesToSet);
                
                let initialGroup = null;
                let initialProductType = null;
                
                if (urlFilters) {
                    const selectedTax = taxonomiesToSet.find(t => 
                        t.type === urlFilters.type && t.slug === urlFilters.slug
                    );
                    
                    if (selectedTax) {
                        if (selectedTax.type === 'group') {
                            initialGroup = selectedTax;
                            setSelectedTaxonomies(prev => ({
                                ...prev,
                                group: selectedTax
                            }));
                        } else if (selectedTax.type === 'product-type') {
                            initialProductType = selectedTax;
                            setSelectedTaxonomies(prev => ({
                                ...prev,
                                product_type: selectedTax
                            }));
                        }
                    }
                }
                
                loadingData(initialGroup, initialProductType);
                
            } catch (error) {
                console.error('Ошибка загрузки таксономий:', error);
                loadingData();
            } finally{
                setIsFirstLoading(false)
            }
        };
        
        loadInitialData();
        
    }, []);

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && fullscreenMode) {
                handleChangeScreenMode();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [fullscreenMode]);

    return (
        <>
            <RiveLoader isLoading={(isLoading && !isFirstLoading) || forceLoader || isShuffling} />
            
            <div className={`metagallery-fixed-container ${fullscreenMode ? 'fullscreen-mode' : ''}`}>
                <div className='metagallery-main-container'>
                    
                    {taxonomies.length > 0 && (
                        <TaxonomyFilter 
                            taxonomies={taxonomies}
                            selectedTaxonomies={selectedTaxonomies}
                            onTaxonomyToggle={handleTaxonomyToggle}
                            onResetFilters={handleResetFilters}
                            hasActiveFilters={hasActiveFilters}
                        />
                    )}

                    <GalleryGrid
                        mediaList={mediaList}
                        gridHeight={gridHeight}
                        baseWidth={baseWidth}
                        onTooltipClick={handleTooltipOpen} 
                        activeTooltip={activeTooltip} 
                        hasMore={hasMore}
                        tooltipClosingAnimation = {tooltipClosingAnimation}
                        itemsShownText = { itemsShownText }
                        handleTooltipClose={handleTooltipClose}
                    />

                    <GalleryLoader 
                        loaderRef={loaderRef}                        
                        loadBtnText={loadBtnText}
                        loadBtnTextLoading={loadBtnTextLoading}
                        isLoadingMore={isLoadingMore}
                        hasMore={hasMore}
                        
                    />   

                    <div className='metagallery-btn-container-wrapper' ref={btnsRootRef}>
                        
                        <button 
                            className='metagallery-btn-exit-fs'
                            onClick={handleChangeScreenMode}
                        >
                            <div>{ exitFullScreenText }</div>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.40918 14.5L14.4087 5.50046" stroke="#121212" stroke-linecap="square" stroke-linejoin="round"/>
                                <path d="M5.40918 5.5L14.4087 14.4995" stroke="#121212" stroke-linecap="square" stroke-linejoin="round"/>
                            </svg>
                        </button>

                        <div className='metagallery-btn-container'>
                            <button 
                                className={`metagallery-btn metagallery-btn-scrollup `}
                                onClick={handleToUpScroll}
                            >
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14.3516 8.55838C14.1563 8.36312 13.8398 8.36312 13.6445 8.55838L10.4625 11.7404C10.2673 11.9356 10.2673 12.2522 10.4625 12.4475C10.6578 12.6427 10.9744 12.6427 11.1696 12.4475L13.998 9.61904L16.8265 12.4475C17.0217 12.6427 17.3383 12.6427 17.5336 12.4475C17.7288 12.2522 17.7288 11.9356 17.5336 11.7404L14.3516 8.55838ZM13.998 19.0938L14.498 19.0937L14.498 8.91193L13.998 8.91193L13.498 8.91193L13.498 19.0938L13.998 19.0938Z" fill="#121212"/>
                                </svg>
                            </button>
                            <button 
                                className={`metagallery-btn metagallery-btn-screen-mode ${fullscreenMode ? 'fullscreen-mode' : ''}`}
                                onClick={handleChangeScreenMode}
                            >
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className='fullscreen-mode-svg'>
                                    <path d="M23.4077 5.08835C23.4077 4.8122 23.1839 4.58835 22.9077 4.58835L18.4077 4.58835C18.1316 4.58835 17.9077 4.8122 17.9077 5.08835C17.9077 5.36449 18.1316 5.58835 18.4077 5.58835H22.4077V9.58835C22.4077 9.86449 22.6316 10.0883 22.9077 10.0883C23.1839 10.0883 23.4077 9.86449 23.4077 9.58835V5.08835ZM17.1992 10.7969L17.5528 11.1504L23.2613 5.4419L22.9077 5.08835L22.5542 4.73479L16.8457 10.4433L17.1992 10.7969Z" fill="#121212"/>
                                    <path d="M4.58835 22.9077C4.58835 23.1839 4.8122 23.4077 5.08835 23.4077H9.58835C9.86449 23.4077 10.0883 23.1839 10.0883 22.9077C10.0883 22.6316 9.86449 22.4077 9.58835 22.4077H5.58835V18.4077C5.58835 18.1316 5.36449 17.9077 5.08835 17.9077C4.8122 17.9077 4.58835 18.1316 4.58835 18.4077L4.58835 22.9077ZM10.7969 17.1992L10.4433 16.8457L4.73479 22.5542L5.08835 22.9077L5.4419 23.2613L11.1504 17.5528L10.7969 17.1992Z" fill="#121212"/>
                                </svg>

                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className='classic-mode-svg'>
                                    <path d="M16.7094 10.8101C16.7094 11.0862 16.9333 11.3101 17.2094 11.3101L21.7094 11.3101C21.9856 11.3101 22.2094 11.0862 22.2094 10.8101C22.2094 10.5339 21.9856 10.3101 21.7094 10.3101H17.7094V6.31009C17.7094 6.03395 17.4856 5.81009 17.2094 5.81009C16.9333 5.81009 16.7094 6.03395 16.7094 6.31009V10.8101ZM22.918 5.10156L22.5644 4.74801L16.8559 10.4565L17.2094 10.8101L17.563 11.1636L23.2715 5.45512L22.918 5.10156Z" fill="#121212"/>
                                    <path d="M11.2901 17.1938C11.2901 16.9177 11.0662 16.6938 10.7901 16.6938L6.29007 16.6938C6.01393 16.6938 5.79007 16.9177 5.79007 17.1938C5.79007 17.47 6.01393 17.6938 6.29007 17.6938L10.2901 17.6938L10.2901 21.6938C10.2901 21.97 10.5139 22.1938 10.7901 22.1938C11.0662 22.1938 11.2901 21.97 11.2901 21.6938L11.2901 17.1938ZM5.08154 22.9023L5.4351 23.2559L11.1436 17.5474L10.7901 17.1938L10.4365 16.8403L4.72799 22.5488L5.08154 22.9023Z" fill="#121212"/>
                                </svg>
                            </button>
                            <button 
                                className='metagallery-btn'
                                onClick={shuffleMedia}
                            >
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19.3454 15.7808L22.909 19.3444M22.909 19.3444L19.3454 22.908M22.909 19.3444H17.527C16.9431 19.3384 16.3696 19.1891 15.8569 18.9094C15.3443 18.6298 14.9082 18.2285 14.587 17.7408L14.2672 17.3398M19.3454 5.08984L22.909 8.65348M22.909 8.65348L19.3454 12.2171M22.909 8.65348L17.5876 8.65348C17.0116 8.64955 16.4433 8.78528 15.9313 9.04905C15.4192 9.31282 14.9788 9.69678 14.6476 10.168L9.78858 17.8298C9.45741 18.3011 9.01695 18.685 8.50491 18.9488C7.99288 19.2126 7.42455 19.3483 6.84858 19.3444H5.09082M5.09082 8.65348H6.84769C7.51183 8.64886 8.16404 8.82992 8.73075 9.17624C9.29746 9.52257 9.75611 10.0204 10.055 10.6135" stroke="black" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                </div> 
                <TooltipFog 
                    isActive={showFog}
                    onClose={handleTooltipClose}
                />

                        
                <TooltipWindow
                    isViewerCaller = { isViewerCaller }
                    tooltipData={activeTooltip?.tooltipData}
                    triggerElement={activeTooltip?.triggerElement}
                    isActive={!!activeTooltip}
                    phase={tooltipPhase}
                    onClose={handleTooltipClose}
                    onAnimationCloseEnd={handleTooltipAnimationCloseEnd}
                    onAnimationOpenEnd={handleTooltipAnimationOpenEnd}
                    calculatePosition={calculateTooltipPosition}
                />
            </div>            
        </>
    );
}

export default App;