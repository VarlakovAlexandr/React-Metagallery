import React from 'react';

function GalleryLoader({ isLoadingMore, hasMore, loadBtnText, loadBtnTextLoading, loaderRef }){
    
    return (
        <>
            {
                hasMore && (
                    <div 
                        className='metagallery-loader-block' 
                        ref={loaderRef}
                    >
                        { 
                            (loadBtnTextLoading || loadBtnText) && <button 
                                className={`btn-loader ${isLoadingMore ? 'loading' : ''}`}
                                disabled={isLoadingMore}
                            >
                                {isLoadingMore ? loadBtnTextLoading : loadBtnText}
                            </button>
                        }
                    </div>
                )
            }
        </>
    );
}

export default GalleryLoader;