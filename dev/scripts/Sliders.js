(function (Sliders, $, undefined) {
  "use strict";

  var initSliders = function () {
    var breakpointPrimary = 991;
    var breakpoint5 = 1050;
    var breakpoint3 = 300;
    var breakpoint4 = 650;

    $('.home-slider__slider').slick({
      mobileFirst: true,
      dots: true,
      arrows: true,
      autoplay: true,
      autoplaySpeed: 5000,
      responsive: [
        {
          breakpoint: breakpointPrimary,
          settings: {
            arrows: true
          }
        }
      ]
    });
    $('.featured-products__slider').slick({
      mobileFirst: true,
      infinite: true,
      slidesToScroll: 1,
      arrows: true,
      prevArrow: "<div class='slick-prev'><img src={{ 'Left.svg' | asset_url }} /></div>",
      nextArrow: "<div class='slick-next'><img src={{ 'Right.svg' | asset_url }} /></div>",
      responsive: [
        {
          breakpoint: breakpoint3,
          settings: {
            arrows: true,
            slidesToShow: 2,
          }
        },
        {
          breakpoint: breakpoint5,
          settings: {
            arrows: true,
            slidesToShow: 5
          }
        }
      ]
    });
    $('.smart-order-products__slider').slick({
      mobileFirst: true,
      infinite: true,
      slidesToScroll: 1,
      arrows: true,
      prevArrow: "<div class='slick-prev'><img src={{ 'Left.svg' | asset_url }} /></div>",
      nextArrow: "<div class='slick-next'><img src={{ 'Right.svg' | asset_url }} /></div>",
      responsive: [
        {
          breakpoint: breakpointPrimary,
          settings: {
            arrows: true,
            slidesToShow: 3,
          }
        },
        {
          breakpoint: breakpoint4,
          settings: {
            arrows: true,
            slidesToShow: 3
          }
        },
        {
          breakpoint: breakpoint3,
          settings: {
            arrows: true,
            slidesToShow: 2
          }
        }
      ]
    });

  };

  var bindUIActions = function () {
      $('.slick-slider').on('setPosition', function () {
      $(this).find('.slick-slide').height('auto');
      var slickTrack = $(this).find('.slick-track');
      var slickTrackHeight = $(slickTrack).height();
      $(this).find('.slick-slide').css('height', slickTrackHeight + 'px');
    });

    $('.featured-products__paging-slide').on('click', function() {
      var index = $(this).attr('data-slick-index');
      $('.featured-products__slider').slick('slickGoTo', index);
    });
  };

  Sliders.init = function () {
    initSliders();
    bindUIActions();
  };

}(window.Sliders = window.Sliders || {}, jQuery));
