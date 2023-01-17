((PromoBar, $) => {

  const $dom = {};

  const cacheDom = () => {
    $dom.PromoBar = $('[js-promo-banner]');
    $dom.valueProp = $('[js-value-prop]');
    $dom.valuePropText = $('[js-value-prop-text]');
  };

const isMobile = () => ($(window).width() <= 480)

  const showFullText = () => {
      console.log(isMobile());
    if (!isMobile()) {
        $dom.valuePropText.each(function(){
            const fullText = $(this).attr('data-full-text');
            $(this).text(fullText);
        });
    }
  }

  const promoBanner = () => {
    $dom.PromoBar.slick({
        mobileFirst: true,
        autoplay: true,
        autoplaySpeed: 7000,
        arrows: false,
        infinite: false,
        responsive: [
            {
                breakpoint: 640,
                settings: {
                    arrows: true,
                    prevArrow: '<button class="value-prop-arrow value-prop-arrow--left" aria-label="slide"></button>',
                    nextArrow: '<button class="value-prop-arrow value-prop-arrow--right" aria-label="slide"></button>'
                }
            }
        ]
    });
  }

  const hideArrowonFirst = () => {
    $('.value-prop-arrow--left').fadeOut(350);
    $dom.valueProp.removeClass('init-hide');
  }

const toggleArrow = (slick, s) => {
    const {currentSlide, slideCount} = s;
    const slideIndex = currentSlide + 1;

    // console.log(`current slide: ${currentSlide}. Total Slides: ${slideCount}`);

    const firstSlide = slideIndex == 1;
    const middleSlide = slideIndex > 1 && slideIndex < slideCount;
    const lastSlide = slideCount == slideIndex;

    // First Slide | remove left arrow
    if ( firstSlide ) {
        $('.value-prop-arrow--left').fadeOut(250);
        $('.value-prop-arrow--right').fadeIn(250);
    }

    // Slides in the middle | keep both arrows
    if ( middleSlide ) {
        $('.value-prop-arrow').fadeIn(250);
    }
    // Last slide | hide right arrow
    if ( lastSlide ) {
        $('.value-prop-arrow--left').fadeIn(250);
        $('.value-prop-arrow--right').fadeOut(250);
    }
}

  const bindUIActions = () => {
    $dom.PromoBar.on('init', hideArrowonFirst);
    $dom.PromoBar.on('afterChange', toggleArrow);
  };

  PromoBar.init = function () {
    console.log('promo bar loaded');
    cacheDom();
    bindUIActions();
    // If more than 1 value prop, run Slick slider on it.
    ($dom.valueProp.length > 1 ) ? promoBanner() : '';
    showFullText();
  };

})(window.PromoBar = window.PromoBar || {}, jQuery);