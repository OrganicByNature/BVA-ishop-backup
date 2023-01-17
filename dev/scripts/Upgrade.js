(function (Upgrade, $, undefined) {
  "use strict";

  var dataStep = 1,
      dataPick,
      dataChoose,
      prodId,
      giftCardCode,
      times = 1;

  Upgrade.toggle = function (target, $elem) {
    $("[data-upgrade='"+target+"'").slideToggle();
    $elem.closest('.colls-table__product').toggleClass('colls-table__product--active');
  };

  Upgrade.step = function (step) {
    dataStep = step;

    if(dataStep == 1) {
      dataPick = "Pick a Kit";
      dataChoose = "Choose your upgrade.";
    } else if(dataStep == 2) {
      dataPick = "Create Gift Card Code";
      dataChoose = "Choose unique gift card code just for you.<br>This will also be used as your Referral code for enrollments.<br><span class='small'>(Codes are alphanumeric with no spaces or special character)</span>";
    } else if(dataStep == 3) {
      dataPick = "Terms & Conditions";
      dataChoose = "Please accept our <a class='colls-tc__tc-link' href='/pages/terms-and-conditions' target='_blank'>Terms &amp; Conditions</a> to complete your upgrade.";
    }

    $('.collections--upgrade, .callouts').fadeOut(200, function() {
      $('[data-step]').hide();
      $('[data-step-step]').html(dataStep);
      $('[data-step-pick]').html(dataPick);
      $('[data-step-choose]').html(dataChoose);
      $('html, body').scrollTop(0);
      $('[data-step="'+dataStep+'"]').show();
      $('.collections--upgrade').fadeIn(200);
      if(dataStep == 1) {
        $('.callouts').fadeIn(200);
      }
      if(dataStep != 1) {
        $('.colls-error').hide();
      } else {
        $('.colls-error').show();
      }
    });
  };

  Upgrade.updatePhone = function () {
    var phone = $('#colls-tc__phone').val();
    if ( phone != '' ) {
      console.log('not blank');
      var customer = $.get( "//purium-admin-products.herokuapp.com/edit-user?customer="+window.customer.id+"&phone="+phone )
      .done(function( data ) {
        console.log( "Data Loaded: ", data );
        if (typeof data.errors != "undefined") {
          console.log('typeof data.errors != "undefined" its true, so errors');
        } else {
          console.log('success');
        }
      });
    }
  };

  Upgrade.addProd = function () {
    if (typeof prodId == 'undefined') {
      location.hash = 1;
      Upgrade.alert($('.colls-error'), "Please choose a kit.");
    } else if (typeof giftCardCode == 'undefined' || giftCardCode == '') {
      location.hash = 2;
      Upgrade.alert($('.colls-code__form'), "Please fill out this field");
    } else {
      CartJS.clear({
        "success": function(data, textStatus, jqXHR) {
          console.log('cart cleared');
          CartJS.addItem(prodId, 1, {"delivery": "One-time Order"}, {
            "success": function(data, textStatus, jqXHR) {
              console.log('cart added upgrade');
              CartJS.setAttribute('GiftCardCode', giftCardCode, {
                "success": function(data, textStatus, jqXHR) {
                  console.log('cart GiftCardCode');
                  window.location.href = 'https://puriumcorp.myshopify.com/checkout?discount=';
                }
              });
            }
          });
        }
      });
    }
  };

  Upgrade.removeProp = function() {
    // Uses shopify ajax jquery wrapper library
    // not 100% sure why, but the following 2 didn't work:
    // 1. shopify ajax api without jquery wrapper library
    // 2. cartjs clear attributes
    Shopify.updateCartAttributes( {'GiftCardCode' : ''} );
  };

  Upgrade.check = function(webAlias) {
    giftCardCode = $('#web-alias').val();
    var checkWebAlias = $.get('https://purium.sunriseintegration.com/api/affiliate?code='+giftCardCode)
    .done(function(response) {
      console.log(response);
      if ( typeof response.uses_left == "undefined" && Upgrade.goodFormat($('#web-alias').val()) ) { // doesn't exist and good format
        stepper();
      } else if ( !Upgrade.goodFormat($('#web-alias').val()) ) {
        Upgrade.alert($('.colls-code__form'), "Sorry, codes are only alphanumeric.");
      } else {
        Upgrade.alert($('.colls-code__form'), "Sorry, this code is not available");
      }
    });
  };

  Upgrade.alert = function (errorCont, errorMessage) {
    if (errorCont.find('.is-error').length){ //if error box already
      if($('.is-error').html().indexOf(errorMessage) == -1){
        $('.is-error ul').append('<li>'+errorMessage+'</li>');
      }
    } else {
      errorCont.prepend('<div class="form-note is-error"><ul><li>'+errorMessage+'</li></ul></div>');
    }
    $('.is-error').hide().fadeIn();
    $('.submit-upgrade').removeClass("disabled").text("Submit");
  };

  Upgrade.goodFormat = function (key) {
    var regex = new RegExp("[a-zA-Z0-9]");
    if (!regex.test(key)) {
      return false;
    } else {
      return true;
    }
  };

  var stepper = function () {
    times++;
    location.hash = times;
  }

  var bindUIActions = function () {
    // redirect if not a customer or not rank 18/20/22
    if ( typeof window.customer == 'undefined' || ( window.customer.rank != '18' && window.customer.rank != '20' && window.customer.rank != '22' ) ) {
      window.location.href = "/";
    }

    $('[data-toggle-upgrade]').on('click', function (event) {
      Upgrade.toggle( $(this).data('toggle-upgrade'), $(this) );
    });

    $('[data-step-up]').on('click', function() {
      stepper();
    });

    $('[data-prod-id]').on('click', function() {
      prodId = $(this).data('prod-id');
    });

    $('.colls-code__form').on('submit', function(e) {
      e.preventDefault();
      Upgrade.check();
    });

    $('.colls-tc__form').on('submit', function(e) {
      e.preventDefault();
      if ( $('#colls-tc__agree').is(':checked') ) {
        $('.submit-upgrade').addClass("disabled").text("Submitting...")
        Upgrade.updatePhone();
        Upgrade.addProd();
      } else {
        Upgrade.alert($('.colls-tc__form'), "Please agree to our Terms & Conditions to continue.");
      }
    });

    $('#web-alias').on('keypress', function (event) {
      console.log(event);
      var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
      if ( !Upgrade.goodFormat(key) && event.charCode != 13 ){
        event.preventDefault();
        return false;
      }
    });

    $(window).on('hashchange load', function() {       
      if (location.hash.length > 0) {        
          times = parseInt(location.hash.replace('#',''),10);     
      } else {
          times = 1;
      }
      Upgrade.step(times);
    });

    $('.colls-tc__phone form').on('submit', function(e){ e.preventDefault(); });
  };

  Upgrade.init = function () {
    bindUIActions();
  };

}(window.Upgrade = window.Upgrade || {}, jQuery));
