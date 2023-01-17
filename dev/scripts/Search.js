(function (Search, $) {
  "use strict";


  var bindUIActions = function () {
    $('.search-item-description').each(function() {
      var text = $(this).text().substring(0, 100);
      $(this).html(text + "...");
      console.log(length);
    })
  };

  Search.init = function () {
    bindUIActions();
  };

}(window.Search = window.Search || {}, jQuery));
