(function (Footer, $) {
  "use strict";

  /*
   *  Dependency: <div class="overlay" data-overlay></div> in theme.liquid,
   *              components/_overlay.scss
   *
   *  Note: _overlay.scss hold the styles for the overlay container
   *  Note: .overlay has a z-index of 1000, so any modal that needs to appear on top
   *        of the overlay need to have an z-index of 1001+
   *
   *
   */

  var bindUIActions = function () {
    $('.footer-bottom-mobile .footer-h2').on('click', function(){
      if($(this).siblings('.footer-dropdown').hasClass('active')){
        $(this).removeClass('active');
        $(this).children('.nav-arrow').removeClass('active');
        $(this).siblings('.footer-dropdown').removeClass('active')
      }else{
        $(this).addClass('active');
        $(this).siblings('.footer-dropdown').addClass('active')
        $(this).children('.nav-arrow').addClass('active');
      }
    })
  };

  Footer.init = function () {
    bindUIActions();
  };

}(window.Footer = window.Footer || {}, jQuery));
