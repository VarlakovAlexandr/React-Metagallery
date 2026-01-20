// utils/calculateFittingSize.js 
export function calculateFittingSize(containerWidth, containerHeight, imageWidth, imageHeight) {

    console.log('calculateFittingSize');

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
