(function (Scroll, $, undefined) {
  "use strict";

  /*
   *  Dependency: components/_scroll.scss
   *
   *
   */

  var bindUIActions = function () {

  };

  Scroll.lock = function (menuName) {
    $('html, body').addClass('no-scroll');
  };

  Scroll.unlock = function (menuName) {
    $('html, body').removeClass('no-scroll');
  };

  Scroll.init = function () {
    bindUIActions();
  };

}(window.Scroll = window.Scroll || {}, jQuery));
