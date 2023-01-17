(function (LineItems, $, undefined) {
  "use strict";

  /*
   *  Dependencies: vendor/cart.js (http://cartjs.org)
   *
   *
   */

  // Variables

  // Private
  var isValidObjectProperties = function (object) {
    var isValid = true;
    for (var property in object) {
      if (property !== 'success' || property !== 'error' || property !== 'complete') {
        valid = false;
      }
    }

    return isValid;
  };

  // Public
  LineItems.add = function (variantId, quantity, properties, callbacks) {
    if (callbacks !== object || !isValidObjectProperties(callbacks)) {
      callbacks = {};
    }

    CartJS.addItem(variantId, quantity, properties, callbacks);
  };

  LineItems.remove = function (variantId, callbacks) {
    if (callbacks !== object || !isValidObjectProperties(callbacks)) {
      callbacks = {};
    }

    CartJS.removeItemById(variantId, callbacks);
  };

  LineItems.init = function () {

  };

}(window.LineItems = window.LineItems || {}, jQuery));
