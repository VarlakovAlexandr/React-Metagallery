//GalleryItem.js
import { useEffect, useState, memo } from "react";
import ViewerSlider from "./ViewerSlider";
import { isMobile, isTablet, isDesktop } from 'react-device-detect';
import { nanoid } from 'nanoid';

function GalleryItem({ media, baseWidth, onTooltipClick, activeTooltip, mediaList, mediaIndex, itemsShownText, handleTooltipClose }) {
    
    const [viewerIsVisible, setViewerIsVisible] = useState(false);

    const calculateImageHeight = (initialWidth, initialHeight, baseWidth) => {
        return (baseWidth * initialHeight) / initialWidth;
    }


    
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

    const isTooltipActive = (tooltipId) => {
        return activeTooltip && 
               activeTooltip.tooltipData.id === tooltipId && 
               activeTooltip.mediaId === media.id;
    };

    const openViewer = () => {
        setViewerIsVisible(true);

        let jdiv = document.body.querySelector('jdiv');
        if ( jdiv ){
            jdiv.style.display = 'none';
        }

        document.body.classList.add("media-viewer-open");

        const adminBar = document.querySelector("#wpadminbar");
        if (adminBar) {
            document.body.style.marginTop = '0';
            adminBar.style.display = 'none';
        }
    };

    const closeViewer = () => {
        setViewerIsVisible(false);

        let jdiv = document.body.querySelector('jdiv');
        if ( jdiv ){
            jdiv.style.display = '';
        }

        document.body.classList.remove("media-viewer-open");
        
        const adminBar = document.querySelector("#wpadminbar");
        if (adminBar) {
            document.body.style.marginTop = '';
            adminBar.style.display = 'block';
        }
    };
    
    return (
        <>
            <div 
                className= {`metagallery-gallery-item ${ media.type_media === 'Video' ? "metagallery-gallery-item_video-content" : "" }`} 
                style={{ 
                    left: `${media.left}px`, 
                    top: `${media.top}px`, 
                    width: `${baseWidth}px`,
                    position: 'absolute'
                }}
                
                onClick={openViewer}
            >
                { media.type_media === 'Image' ? (
                        <img 
                            src={media.type_media === 'Image' ? media.image : media.video_placeholder}
                            alt={media.alt || ''} 
                        
                            style={{ 
                                cursor: 'pointer',
                                width: '100%',
                                height: 'auto',
                                display: 'block'
                            }}
                        />
                    ) : ""
                }
                
                
                { media.type_media === 'Video' ? 
                    (
                        <>
                        
                            <video 
                                style={{ 
                                    
                                    height: `${calculateImageHeight(media.width, media.height, baseWidth)}px`
                                }}
                                
                                src={media.video}
                                muted
                                loop
                                playsInline 
                                defaultMuted
                                autoPlay
                                poster={media.video_placeholder}
                            />
                        </>
                        
                        
                    ) : ""
                }
                
                
                {(media.tooltips && isDesktop) && media.tooltips.map((tooltip) => (
                    <button
                        key={`${media.id}-tooltip-${tooltip.id}`}
                        className={`tooltip-window-trigger ${isTooltipActive(tooltip.id) ? 'active' : ''}`}
                        style={{
                            left: `${tooltip.x}%`,
                            top: `${tooltip.y}%`,
                            position: 'absolute',
                        }}
                        onClick={(e) => handleTooltipClick(tooltip, e)}
                    >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 4.65306V3.34694H8V4.65306H0ZM3.29897 0H4.70103V8H3.29897V0Z" fill="#FAF8ED" />
                        </svg>
                    </button>
                ))}
            </div>

            {viewerIsVisible && (
                <ViewerSlider
                    media={media}
                    mediaIndex={mediaIndex}
                    mediaList={mediaList}
                    onClose={closeViewer}
                    initialIndex = { mediaIndex }
                    onTooltipClick={onTooltipClick}
                    activeTooltip={activeTooltip}
                    itemsShownText={itemsShownText}
                    handleTooltipClose={handleTooltipClose}
                />
            )}
    
    
        </>
    );
}

//export default GalleryItem;

// Сравниваем только необходимые пропсы
const areEqual = (prevProps, nextProps) => {
    return (
        prevProps.media.id === nextProps.media.id &&
        prevProps.baseWidth === nextProps.baseWidth &&
        prevProps.activeTooltip?.mediaId === nextProps.activeTooltip?.mediaId &&
        prevProps.activeTooltip?.tooltipData?.id === nextProps.activeTooltip?.tooltipData?.id
    );
};

export default memo(GalleryItem, areEqual);