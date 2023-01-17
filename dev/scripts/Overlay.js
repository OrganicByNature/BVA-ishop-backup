(function (Overlay, $, undefined) {
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
    $('[data-overlay]').on('click', function () {
      Modal.hide();
      Overlay.hide();
    });
  };

  Overlay.show = function () {
    $('[data-overlay]').fadeIn(300);
  };

  Overlay.hide = function () {
    $('[data-overlay]').fadeOut(300);
  };

  Overlay.init = function () {
    bindUIActions();
  };

}(window.Overlay = window.Overlay || {}, jQuery));
