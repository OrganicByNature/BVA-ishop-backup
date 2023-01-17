(function (AddCart, $) {
  "use strict";

  /*-----Globals------*/
  var multiplier;
  var productAmount;
  var productBV;
  var subtotal = 0;
  var bvtotal = 0;
  var emptyContents = $('<div class="empty-cart__contents"><p class="empty-cart__text">Your cart is empty.</p><a class="btn btn--secondary" href="/collections/quick-shop">Get Shopping!</a></div>');

  /*------Calculate Subtotal from line items------*/
  var getTotals = function() {
    subtotal = 0;
    bvtotal = 0;
    $('.prod-summary__qty-input').each(function(key, ob) {
      multiplier = $(this).val();
      productAmount = parseFloat($(this).parents('.prod-summary').find('.prod-summary__price-reg').html().replace('$', ''));
      productBV = parseFloat($(this).parents('.prod-summary').attr('data-bv'));
      subtotal = subtotal + (multiplier * productAmount);
      bvtotal = bvtotal + (multiplier * productBV);
      $('.subtotal span').html('$' + subtotal.toFixed(2));
      $('.bvtotal .bv-span').html(bvtotal);
      $('.subtotal').data('subtotal', subtotal*100 );
      Cart.setUp();
    })
  };

  var bindUIActions = function () {

    /*-----Clicking on quantity increments will do some stuff-----*/
    $('.prod-summary__qty-input').on('keyup input', function (e) {

      /*-----Set some variables-----*/
      var $self = $(this)
      var variantId = $(this).parents('.prod-summary').attr('data-variant-id')
      var $quantity = parseInt($(this).val());
      var lineItem = $(this).closest($('.prod-summary'));

      /*-----AJAX to update cart and callback function-----*/
      CartJS.updateItemById(variantId, $quantity, {}, {
        "success": function(data, textStatus, jqXHR) {

          /*-----Set item counter, get new subtotal----*/
          var itemCounter = 0;
          getTotals();

          /*----Check how many items left in cart-----*/
          if(itemCounter < 1) {
            $('.header .cart-link span').css('display', 'none')
          } else {
            $('.header .cart-link span').html(itemCounter);
            $self.siblings('.update-success').addClass('active');
            setTimeout(function(){$self.siblings('.update-success').removeClass('active')}, 3000)
          }
          if($quantity < 1) {
            lineItem.remove();
          }
          if($('.one-time-orders .prod-summary').length < 1) {
            $('.cart-contents').remove();
            // $('.one-time-header').remove();
            // $('.one-time-orders').remove();
            // $('.subtotal').remove();
            // $('.bottom-button').remove();
            $('.prod-summary-wrapper').append(emptyContents);
          }
        }
      })
    });
  };

  AddCart.init = function () {
    bindUIActions();
    getTotals();
  };


}(window.AddCart = window.AddCart || {}, jQuery));
