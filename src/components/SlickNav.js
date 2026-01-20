 // SlickPrevBtn.jsx
export function SlickPrevBtn(props) {
    const { className, style, onClick, currentSlide, slideCount } = props;
    
    return (
        <button
            className={`viewer-prev ${className || ''}`}
            style={{ 
                ...style, 
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: currentSlide === 0 ? 0.3 : 1
            }}
            onClick={onClick}
            disabled={currentSlide === 0}
            aria-label="Предыдущий слайд"
        >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.64645 11.3536C6.45118 11.1583 6.45118 10.8417 6.64645 10.6464L9.82843 7.46447C10.0237 7.2692 10.3403 7.2692 10.5355 7.46447C10.7308 7.65973 10.7308 7.97631 10.5355 8.17157L7.70711 11L10.5355 13.8284C10.7308 14.0237 10.7308 14.3403 10.5355 14.5355C10.3403 14.7308 10.0237 14.7308 9.82843 14.5355L6.64645 11.3536ZM15 11V11.5H7V11V10.5H15V11Z" fill="#ffffff"/>
            </svg>
        </button>
    );
}

// SlickNextBtn.jsx
export function SlickNextBtn(props) {
    const { className, style, onClick, currentSlide, slideCount } = props;
    
    return (
        <button
            className={`viewer-next ${className || ''}`}
            style={{ 
                ...style, 
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: currentSlide === slideCount - 1 ? 0.3 : 1
            }}
            onClick={onClick}
            disabled={currentSlide === slideCount - 1}
            aria-label="Следующий слайд"
        >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.3536 11.3536C15.5488 11.1583 15.5488 10.8417 15.3536 10.6464L12.1716 7.46447C11.9763 7.2692 11.6597 7.2692 11.4645 7.46447C11.2692 7.65973 11.2692 7.97631 11.4645 8.17157L14.2929 11L11.4645 13.8284C11.2692 14.0237 11.2692 14.3403 11.4645 14.5355C11.6597 14.7308 11.9763 14.7308 12.1716 14.5355L15.3536 11.3536ZM7 11V11.5H15V11V10.5H7V11Z" fill="#ffffff"/>
            </svg>
        </button>
    );
}
               
/*

export  function SlickPrevBtn(){
    return(
        <div className='viewer-prev'>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.64645 11.3536C6.45118 11.1583 6.45118 10.8417 6.64645 10.6464L9.82843 7.46447C10.0237 7.2692 10.3403 7.2692 10.5355 7.46447C10.7308 7.65973 10.7308 7.97631 10.5355 8.17157L7.70711 11L10.5355 13.8284C10.7308 14.0237 10.7308 14.3403 10.5355 14.5355C10.3403 14.7308 10.0237 14.7308 9.82843 14.5355L6.64645 11.3536ZM15 11V11.5H7V11V10.5H15V11Z" fill="#121212"/>
            </svg>
        </div>
    )
}

export  function SlickNextBtn(){
    return (
        <div className='viewer-next'>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.3536 11.3536C15.5488 11.1583 15.5488 10.8417 15.3536 10.6464L12.1716 7.46447C11.9763 7.2692 11.6597 7.2692 11.4645 7.46447C11.2692 7.65973 11.2692 7.97631 11.4645 8.17157L14.2929 11L11.4645 13.8284C11.2692 14.0237 11.2692 14.3403 11.4645 14.5355C11.6597 14.7308 11.9763 14.7308 12.1716 14.5355L15.3536 11.3536ZM7 11V11.5H15V11V10.5H7V11Z" fill="#121212"/>
            </svg>
        </div>
    )
}*/