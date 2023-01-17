(function (Login, $, undefined) {
  "use strict";

  var price,
      priceLeft;
  
  
  var under75 = function(price) {
    console.log(price);
    if( price >= 7500 ) {
      return false;
    } else {
      priceLeft = ((7500 - price)/100).toFixed(2);
      return true;
    }
  };

  var setPrice = function() {
    var getPrice = $.get('/cart.js', null, null, "json")
    .done(function(data) {
      console.log(data);
      price = data.total_price;
    });
  };

  var initLogin = function () {
    // set up for create account to checkout too
    if( window.location.href.indexOf('?to-checkout') !== -1 ) {
      $('.create-account-btn').attr('href', '/account/register?to-checkout');
      setPrice();
      }


    // auto fill gift card code from url
    if ( localStorage.getItem("storedGiftCardCode") ) {
      $("#web-alias").val( localStorage.getItem("storedGiftCardCode") );
      // removing before val set and also don't need to remove for any reason
      // localStorage.removeItem("storedGiftCardCode");
    }

    // show error popup on error
    console.log('$(".form-note.the-errors").length', $(".form-note.the-errors").length);
    if ( $(".form-note.the-errors").length ) {
      Exigo.alert($('#customer_login'), $(".form-note.the-errors").text());
    }
  };

  var attemptLogin = function (redirectTo = null) {
    var email = $('#customer-email').val(),
        password = $('#customer-password').val(),
        coAppend = "step=contact_information&discount=",
        rank,
        web_alias,
        discount_name,
        order_count;
    // ajax login
    $.post( "/account/login", "form_type=customer_login&utf8=%E2%9C%93&customer%5Bemail%5D="+email+"&customer%5Bpassword%5D="+password )
    .done(function (jqXHR, status) {
      console.log(status);
      console.log(jqXHR);
      console.log('redirectTo', redirectTo)
      // if (redirectTo) {
      //   window.location.href = redirectTo;
      //   return
      // }
      
      if (jqXHR.indexOf("Invalid login credentials") !== -1) { // if error returned
        Exigo.alert($('#customer_login'), 'Invalid login credentials.');
      } else { // success)
        rank = jqXHR.split('"rank": ')[1];
        rank = rank.split(',')[0];
        web_alias = jqXHR.split('"web_alias": "')[1];
        web_alias = web_alias.split('",')[0];
        discount_name = jqXHR.split('"discount_name": "')[1];
        discount_name = discount_name.split('",')[0];
        order_count = jqXHR.split('"order_count": ')[1];
        order_count = order_count.split(',')[0];

        // get uses left
        var checkWebAlias = $.get('https://purium.sunriseintegration.com/api/affiliate?code='+web_alias)
        .done(function(response) {
          console.log(response);
          console.log('rank', rank);
          console.log('order_count', order_count);
          console.log('web_alias', web_alias);
          if(rank == '18' && order_count == 0) {
            if( response.uses_left > 0 ) { // eligible and gift card has uses
              if( under75(price) ) {
                window.location.href = '/cart?under75';
              } else {
                window.location.href = 'https://puriumcorp.myshopify.com/checkout?discount='+coAppend+web_alias;
              }
            } else if( response.uses_left == 0 ) { // eligible but no gift card uses
              window.location.href = 'https://puriumcorp.myshopify.com/checkout?'+coAppend;
            }
          } else if(web_alias != "" && order_count > 0) {
            window.location.href = 'https://puriumcorp.myshopify.com/checkout?'+coAppend+discount_name;
          } else {
            window.location.href = 'https://puriumcorp.myshopify.com/checkout?'+coAppend;
          }

        });
      }
    });
  };

  var bindUIActions = function () {
    const redirectTo = UTILS.getQueryVariable('redirect_to')
    $('#customer_login').on('submit', function(e) {
      $(this).find('.form-submit').text('Signing In...');
      console.log("trying to login")
      // if from cart page
      if( window.location.href.indexOf('?to-checkout') !== -1 || redirectTo) {
        console.log("special login");
        e.preventDefault();
        attemptLogin(redirectTo);
      } // else, normal login
    });
  };

  Login.init = function () {
    initLogin();
    bindUIActions();
  };

}(window.Login = window.Login || {}, jQuery));
