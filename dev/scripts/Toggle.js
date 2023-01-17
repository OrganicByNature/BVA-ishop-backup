(function (Toggle, $, undefined) {
  "use strict";

  Toggle.toggle = function (target) {
    $(target).toggle();
  };

  Toggle.slideToggle = function (target) {
    $(target).slideToggle();
  };

  var initRecoverPasswordForm = function () {
    if (window.location.hash === '#recover') {
      Toggle.toggle('#customer-login-form, #recover-password-form');
    }
  };

  var bindUIActions = function () {
    $('[data-toggle]').on('click', function (event) {
      Toggle.toggle($(this).data('target'));
    });
  };

  Toggle.init = function () {
    bindUIActions();
    initRecoverPasswordForm();
  };

}(window.Toggle = window.Toggle || {}, jQuery));
