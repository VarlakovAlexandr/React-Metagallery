//TooltipWindow.js

import React, { useState, useEffect, useRef } from 'react';
import { animate, createScope } from 'animejs';

function TooltipWindow({
    tooltipData,
    triggerElement,
    isActive,
    phase,                    // 'idle' | 'opening' | 'open' | 'closing'
    onClose,
    onAnimationCloseEnd,
    onAnimationOpenEnd,
    calculatePosition,
    isViewerCaller
}) {
    const tooltipRef = useRef(null);
    const [isMeasured, setIsMeasured] = useState(false);
    const [finalPosition, setFinalPosition] = useState({});
    const tooltipScope = useRef(null);

    const [animationStart, setAnimationStart] = useState(false);
    const [animationClosetooltip, setAnimationClosetooltip] = useState(false);

    


    // init scope
    useEffect(() => {
        tooltipScope.current = createScope({ tooltipRef }).add(self => {
            self.add('showTooltip', () => {
                // открытие анимирует .tooltip-window.active
                
                setAnimationStart(true);
                
                

                animate('.tooltip-window.active', { 
                    delay: 100,
                    opacity: [0, 1],                    
                    y: [20, 0],
                    ease: 'linear',
                    duration: 200,

                    onComplete: () => {
                        setAnimationStart(false);
                    }
                });
            });
            
            self.add('closeTooltip', (callback) => {
                const targets = document.querySelectorAll('.tooltip-window.closing');
                
                animate('.tooltip-window.closing', { 
                    opacity: [1, 0.2],
                    translateY: ['0px', '-40px'],  
                    ease: 'linear',
                    duration: 200,
                    onUpdate: () => {
                        const t = document.querySelector('.tooltip-window.closing');
                        
                    },
                    onComplete: () => {
                        
                        if (typeof callback === 'function') {
                            callback();
                        }
                    }
                });
            });
        });

        return () => {
            tooltipScope.current && tooltipScope.current.revert();
        };
    }, []);

    // Лог для контроля фаз
    useEffect(() => {
        
    }, [phase, isActive, isMeasured, tooltipData]);

    // Сброс измерения при смене данных
    useEffect(() => {
        if (isActive && tooltipData) {
            setIsMeasured(false);
            setFinalPosition({});
        }
    }, [isActive, tooltipData]);

    // Измерение + позиция
    useEffect(() => {
        if (!isActive || !tooltipRef.current || !triggerElement || isMeasured) return;

        const el = tooltipRef.current;

        
        const prevVisibility = el.style.visibility;
        const prevDisplay = el.style.display;

        el.style.visibility = 'hidden';
        el.style.display = 'flex';

        const tooltipWidth = el.offsetWidth;
        const tooltipHeight = el.offsetHeight;

        el.style.visibility = prevVisibility;
        el.style.display = prevDisplay;

        const position = calculatePosition(triggerElement, tooltipWidth, tooltipHeight);
        setFinalPosition(position);
        setIsMeasured(true);
    }, [isActive, triggerElement, isMeasured, calculatePosition, tooltipData]);

    // Запуск анимаций
    useEffect(() => {

        
        if (!tooltipRef.current) return;
        if (!isActive || !tooltipData) return;
        if (!isMeasured) return;
        if (!tooltipScope.current) return;

        
        if (phase !== 'opening' && phase !== 'closing' && phase !== 'switching') return;

        

        const el = tooltipRef.current;

        if (phase === 'opening') {
            el.classList.remove('closing');
            el.classList.add('active');

            if  ( !animationStart ){
                tooltipScope.current.methods.showTooltip();

                if (onAnimationOpenEnd) {
                    setTimeout(onAnimationOpenEnd, 200);
                }
            }

            
        }

        if (phase === 'closing' || phase === 'switching') {
            // НЕ снимаем .active, чтобы CSS не скрыл окно, оставляем layout
            el.classList.add('closing');

            tooltipScope.current.methods.closeTooltip(() => {
                el.classList.remove('closing');
                onAnimationCloseEnd && onAnimationCloseEnd();
            });
        }
    }, [phase, isActive, tooltipData, isMeasured, onAnimationCloseEnd, onAnimationOpenEnd]);


    if (!tooltipData) return null;

    
    return (
        <div
            ref={tooltipRef}
            className={`tooltip-window ${ isViewerCaller ? "viewer-caller" : "" }`}  

            data-id={tooltipData.id}

            style={
                isMeasured
                    ? finalPosition
                    : {visibility: 'hidden',  left: 0, top: 0 }
            }
        >
            <div className="tooltip-window__inner">
                <button className="tooltip-window__close" onClick={onClose}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.887236 2.11276L2.0417 0.958304L9.11276 8.02937L7.9583 9.18383L0.887236 2.11276ZM7.9159 0.915904L9.15516 2.15516L2.0841 9.22623L0.844837 7.98697L7.9159 0.915904Z" fill="#FAF8ED"></path>
                    </svg>
                </button>

                <div className="tooltip-window__img-block">
                    <img src={tooltipData.image} key={tooltipData.image} alt={tooltipData.title} />
                </div>
                
                <div className="tooltip-window__description-block">
                    <p className="tooltip-window__title">{tooltipData.title}</p>
                    <p className="tooltip-window__price">{tooltipData.price}</p>
                    <p className="tooltip-window__description">{tooltipData.description}</p>
                </div>
                
                <a 
                    href={tooltipData.link} 
                    className="btn btn-outline-dark"
                    target="_blank" 
                    rel="noopener noreferrer"
                >
                    {tooltipData.link_text || 'View item'}
                </a>
            </div>

            
        </div>
    );
}

export default TooltipWindow;
