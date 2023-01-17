(function (Account, $, undefined) {
  "use strict";
 // comment
  var holdEmail;

  var clearCart = function(href) {
    CartJS.clear();
  };

  var contactEdit = function() {
    $('[data-edit-contact]').hide();
    $('[data-save-contact]').show();
    var val = $('.account__email-phone').text();
    holdEmail = val;
    $('.account__email-phone').html('<form class="account__edit-form"><input class="account__edit-email" type="text" value="'+val+'" /></form>');
    $('.account__edit-email').select();
  };

  var contactSave = function() {
    var email = $('.account__edit-email').val();

    var unset = function(unsetEmail) {
      $('[data-save-contact]').hide();
      $('[data-edit-contact]').show();
      $('.account__email-phone').html(unsetEmail);
    }
    
    if( email != "" ) {
      var customer = $.get( "//purium-admin-products.herokuapp.com/edit-user?customer="+window.customer.id+"&email="+email )
        .done(function( data ) {
          console.log( "Data Loaded: ", data );
          if (typeof data.errors != "undefined") {
            $('.account__email-phone').append('<p class="account__edit-error">Email '+data.errors.email[0]+'</p>')
            console.log('typeof data.errors != "undefined" its true, so errors');
          } else {
            console.log('success');
            unset(data.customer.email);
          }
        });
    } else {
      unset(holdEmail);
    }
  };

  var fillUsesLeft = function() {
    if(typeof window.customer != "undefined" && window.customer.gift_card_code != "") {
      var checkGiftCardCode = $.get('https://purium.sunriseintegration.com/api/affiliate?code='+window.customer.gift_card_code)
      .done(function(response) {
        $('.uses-left').html(response.uses_left);
      });
    }
  };

  var bindUIActions = function () {
    // Logout
    $('.cust__logout').on('click', function(e) {
      e.preventDefault();
      clearCart();
      window.location.href = $(this).attr('href');
    });

    // Edit Contact Email
    $('[data-edit-contact]').on('click', function() {
      contactEdit();
    });

    // Save Contact Email
    $('body').on('click', '[data-save-contact]', function() {
      contactSave();
    });
    $('body').on('submit', '.account__edit-form', function(e) {
      e.preventDefault();
      contactSave();
    });
  };

  Account.init = function () {
    fillUsesLeft();
    bindUIActions();
  };

}(window.Account = window.Account || {}, jQuery));
