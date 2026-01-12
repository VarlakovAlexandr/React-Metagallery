import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { decode } from 'he';

function TaxonomyFilter({ 
    taxonomies, 
    selectedTaxonomies, 
    onTaxonomyToggle,
    onResetFilters,
    hasActiveFilters
}) {
    const allTaxonomies = [...taxonomies];

    const renderTaxonomyButton = (taxonomy, isSelected) => {
        const decodedName = decode(taxonomy.name);


        return (
            <div
                key={`${taxonomy.type}-${taxonomy.id}`}
                className={`taxonomy-filter-btn taxonomy-type-${taxonomy.type} ${isSelected ? 'active' : ''}`}
                onClick={() => onTaxonomyToggle(taxonomy)}
            >
                <span className="taxonomy-name">{decodedName}</span>

                {
                    isSelected && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.78613 10.1484L10.0858 3.84876" stroke="#FAF8ED" stroke-linecap="square" stroke-linejoin="round"/>
                            <path d="M3.78613 3.85156L10.0858 10.1512" stroke="#FAF8ED" stroke-linecap="square" stroke-linejoin="round"/>
                        </svg>
                    )
                }

            


                {/* Отладка: показываем статус выбора */}
                {process.env.NODE_ENV === 'development' && (
                    <span style={{ fontSize: '10px', marginLeft: '5px' }}>
                        {isSelected ? '✓' : '✗'}
                    </span>
                )}
            </div>
        );
    };

    const isTaxonomySelected = (taxonomy) => {
        if (taxonomy.type === 'group') {
            const isSelected = selectedTaxonomies.group?.id === taxonomy.id;            
            return isSelected;
        } else if (taxonomy.type === 'product-type') {
            const isSelected = selectedTaxonomies.product_type?.id === taxonomy.id;            
            return isSelected;
        }
        return false;
    };

    return (
        <div className="taxonomy-filter-container">
            {allTaxonomies.length > 0 && (
                <div className="taxonomy-filter-all">
                    <Swiper
                        spaceBetween={4}
                        slidesPerView={'auto'}
                        freeMode={true}
                        observe={true} // Наблюдать за изменениями слайдов т
                        observeParents={true} // Наблюдать за изменениями родительских элементов
                        observerUpdate={true}
                        className="taxonomy-swiper"
                    >
                        {allTaxonomies.map(taxonomy => (
                            <SwiperSlide key={`${taxonomy.type}-${taxonomy.id}`} style={{ width: 'auto' }}>
                                {renderTaxonomyButton(taxonomy, isTaxonomySelected(taxonomy))}
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            )}
        </div>
    );
}
export default TaxonomyFilter;
