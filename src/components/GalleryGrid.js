import React, { useState, useEffect } from 'react';
import GalleryItem from './GalleryItem'; 

function GalleryGrid({ mediaList, gridHeight, baseWidth, onTooltipClick, activeTooltip, hasMore, tooltipClosingAnimation, itemsShownText }) {
    return (
        <div className={`metagallery-gallery-grid ${ hasMore ? 'has-more': '' }`} style={{ height: `${gridHeight}px` }}>
            {mediaList.map((media, mediaIndex) => (
                <GalleryItem  
                    mediaIndex={mediaIndex}
                    media={media}
                    baseWidth={baseWidth}
                    key={media.id}
                    onTooltipClick={onTooltipClick}
                    activeTooltip={activeTooltip} 
                    mediaList={mediaList}
                    tooltipClosingAnimation = { tooltipClosingAnimation }
                    itemsShownText = { itemsShownText }
                />
            ))}
        </div>
    );
}

export default GalleryGrid;