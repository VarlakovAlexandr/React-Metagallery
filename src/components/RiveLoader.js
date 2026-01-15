import React, { useEffect, useState, useRef } from 'react';
import { useRive } from '@rive-app/react-canvas';

function RiveLoader({ isLoading }) {
    const [showLoader, setShowLoader] = useState(false);
    const [internalLoading, setInternalLoading] = useState(false);
    const isMounted = useRef(true);
    
    // Используем хук useRive из официальной библиотеки
    const { rive, RiveComponent } = useRive({
        src: "https://grygorian.com/wp-content/themes/grygorian/assets/js/rive/bike-loader-brown.riv",
        stateMachines: "State Machine 1",
        autoplay: true,
        onLoad: () => {
           //console.log('Rive animation loaded');
        },
        onLoadError: (error) => {
            console.error('Rive load error:', error);
        }
    });

    useEffect(() => {
        isMounted.current = true;
        
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        let timer;
        
        if (isLoading) {
            // Показываем loader с задержкой
            timer = setTimeout(() => {
                if (isMounted.current) {
                    setShowLoader(true);
                    setInternalLoading(true);
                }
            }, 100);
        } else {
            // Скрываем loader с задержкой 300ms
            setInternalLoading(false);
            timer = setTimeout(() => {
                if (isMounted.current) {
                    setShowLoader(false);
                }
            }, 300);
        }
        
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isLoading]);

    // Если не показывать, возвращаем null
    if (!showLoader) {
        return null;
    }

    return (
        <div className={`rive-loader ${rive ? 'loaded' : ''}`}>
            <div className="rive-loader__overlay">
                <RiveComponent 
                    className="rive-loader__canvas"
                    style={{ 
                        width: '130px', 
                        height: '130px',
                        opacity: internalLoading ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                    }}
                />
            </div>
        </div>
    );
}

export default RiveLoader;