(function (Modal, $, undefined) {
  "use strict";

  /*
   *  Dependencies: Overlay.js
   *                components/_overlay.scss
   *                <div class="overlay" data-overlay></div> in theme.liquid
   *
   *
   */

  var bindUIActions = function () {
    $('[data-modal-show]').on('click', function (event) {
      event.preventDefault();
      Modal.show($(this).attr('data-modal-show'));
    });

    $('[data-modal-hide]').on('click', function (event) {
      event.preventDefault();
      Modal.hide();
    });
  };

  Modal.show = function (modalName) {
    Overlay.show();
    Scroll.lock();
    $('[data-modal="' + modalName + '"]').fadeIn(300);
    $('body').attr('data-active-modal', modalName);
    $("html, body").animate({scrollTop:0}, 300);
  };

  Modal.hide = function () {
    Overlay.hide();
    Scroll.unlock();
    $('[data-modal]').fadeOut(300);
    $('body').removeAttr('data-active-modal');
  };

  Modal.init = function () {
    bindUIActions();
  };

}(window.Modal = window.Modal || {}, jQuery));
