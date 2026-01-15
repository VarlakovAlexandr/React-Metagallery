//GalleryGrid.js
import React, { useState, useEffect } from 'react';
import GalleryItem from './GalleryItem'; 


function GalleryGrid({ mediaList, gridHeight, baseWidth, onTooltipClick, activeTooltip, hasMore, tooltipClosingAnimation, itemsShownText, handleTooltipClose }) {
    return (
        <div className={`metagallery-gallery-grid ${ hasMore ? 'has-more': '' }`} style={{ height: `${gridHeight}px` }}>
            {mediaList.map((media, mediaIndex) => (
                <GalleryItem  
                    mediaIndex={mediaIndex}
                    media={media}
                    key={`gallery_item_${media.id || 'no-id'}_${mediaIndex}`}
                    baseWidth={baseWidth}                    
                    onTooltipClick={onTooltipClick}
                    activeTooltip={activeTooltip} 
                    mediaList={mediaList}
                    tooltipClosingAnimation = { tooltipClosingAnimation }
                    itemsShownText = { itemsShownText }
                    handleTooltipClose={handleTooltipClose}
                />
            ))}
        </div>
    );
}

export default GalleryGrid;