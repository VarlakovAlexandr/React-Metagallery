import React, { useState, useEffect } from 'react';

function TooltipFog({ isActive, onClose }) {
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isActive) {
            setAnimationClass('activate');
            const timer = setTimeout(() => setAnimationClass('active'), 400);
            return () => clearTimeout(timer);
        } else {
            setAnimationClass('deactivate');
            const timer = setTimeout(() => setAnimationClass(''), 400);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    return (
        <div 
            className={`tooltip-window-fog ${animationClass}`}
            onClick={onClose}
        />
    );
}

export default TooltipFog;