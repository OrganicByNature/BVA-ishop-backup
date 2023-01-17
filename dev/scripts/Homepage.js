(function (Homepage, $) {
  "use strict";

  var collection = $('.homepage-collection-content .collection-container');
  var products = $('.featured-products .product img');

  function setPosition() {
    $('.homepage-collection-content .collection').each(function(key, item) {
      var el = $(this).find('h2');
      var containerHeight = $(this).outerHeight();
      var elWidth = el.width() * .5;
      var elHeight = el.height() * .5;
      el.css({'top': '50%', 'left': '50%', 'margin-top': -elHeight, 'margin-left': -elWidth})
    })
  };

  function setHeights(elements) {
    elements.each(function(key, item) {
      var collectionWidth = $(this).width();
      $(this).css('height', collectionWidth);
    })
  };

  function checkIE() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))  {
      $('.homepage-collection-content .collection-container').css('flex-basis', '32%');
    }
  };

  var bindUIActions = function () {
    checkIE();
    setPosition();
    setHeights(collection);
    $(window).resize(function() {
      setPosition();
      setHeights(collection);
    })
  };

  Homepage.init = function () {
    bindUIActions();
  };

}(window.Homepage = window.Homepage || {}, jQuery));
