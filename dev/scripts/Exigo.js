if (!Object.fromEntries) {
  Object.defineProperty(Object, 'fromEntries', {
    value(entries) {
      if (!entries || !entries[Symbol.iterator]) { throw new Error('Object.fromEntries() requires a single iterable argument'); }

      const o = {};

      Object.keys(entries).forEach((key) => {
        const [k, v] = entries[key];

        o[k] = v;
      });

      return o;
    },
  });
}

(function (Exigo, $) {
  "use strict";

  var $customerForm = $('#create_customer'),
      $cartErrorSingle = $('.cart-error__single-order'),
      $cartErrorSmart = $('.cart-error__smart-order'),
      url = window.location.href,
      addressHttpMethod = "PUT",
      orderHttpMethod = "PUT",
      coAppend = "step=contact_information&discount=",
      price,
      priceLeft;

  const handleize = str => {
    return str.toLowerCase().replace(/[^\w\u00C0-\u024f]+/g, "-").replace(/^-+|-+$/g, "");
  };

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

  Exigo.check = function(webAlias) {
    var checkWebAlias = $.get('https://purium.sunriseintegration.com/api/affiliate?code='+webAlias)
    .done(function(response) {
      console.log(response);
      pushCustomer(response.uses_left);
    });
  };

  Exigo.alert = function (errorCont, errorMessage) {
    if ($('.is-error').length){ //if error box already
      if($('.is-error').html().indexOf(errorMessage) == -1){
        $('.is-error ul').append('<li>'+errorMessage+'</li>');
      }
    } else {
      errorCont.prepend('<div class="form-note is-error"><ul><li>'+errorMessage+'</li></ul></div>');
      $('.is-error').hide().fadeIn();
    }
  };

  Exigo.notice = function (successCont, successMessage) {
    if ($('.is-success').length){ //if success box already
      $('.is-success').fadeOut(function(){
        if($('.is-success').html().indexOf(successMessage) == -1){ //if success box already contains new success
          $('.is-success ul').append('<li>'+successMessage+'</li>');
        }
        $(this).fadeIn();
      });
    } else {
      successCont.prepend('<div class="form-note is-success"><ul><li>'+successMessage+'</li></ul></div>');
      $('.is-success').hide().fadeIn();
    }
  };

  const setPropertyQty = (entryVal, qty, prevQty) => {
    if (entryVal.indexOf('qty: ') < 0) return entryVal;

    const valArray = entryVal.split('qty: ');
    const newQty = (parseInt(valArray[1].split(']')[0]) / prevQty) * parseInt(qty);
    return `${valArray[0]}qty: ${newQty}]`;
  };

  Exigo.setPropertyQtys = (props, qty = 1) => {
    const prevQty = parseInt(props.qty);
    props.qty = qty.toString();

    return Object.fromEntries(Object.entries(props).map(entry => ([entry[0], setPropertyQty(entry[1], qty, prevQty)])));
  };

  async function getUpsellVariant (id) {
    const { product } = await $.getJSON(`https://purium-admin-products.herokuapp.com/get-prod?product_id=${id}&params=variants,title,id`)  
    if (!product) return null
    return product
  }

  Exigo.prepareProductProperties = async (product_data) => {
    if (!product_data) throw new Error('Missing product data')
    let productData = product_data
    if (!productData.type) {
      // Product loaded via Findity missed data fetch via local api
      const productUrl = productData.product_url.split('?')[0]
      const data = await jQuery.get(`${productUrl}?view=api`).promise()
      const product = JSON.parse(decodeURIComponent(data).replace(/\+/g, ' '))
      if (!product) throw new Error('Cannot fetch product proivded')
      productData = product
    }
    if (!productData) throw new Error('Failed to add product to cart, data missing')

    const type = handleize(productData.type)
    const exigoId = productData.tags.reduce((id, t) => {
      if (id) return id
      const tag = handleize(t)
      if (tag.indexOf('exigo_id') >= 0) {
        return tag.replace('exigo_id-', '').trim()
      }
      return id
    }, null)
    
    let properties = {
      "delivery": "One-time Order",
      "qty": "1",
      "type": productData.type,
      "id": exigoId
    }

    if ((type == 'dynamic-kit' || type == 'static-kit') && productData.metafields['materials']) {
      const { materials } = JSON.parse(productData.metafields['materials'])
      const variantsFetches = []
      for (const option in materials) {
        variantsFetches.push(
          getUpsellVariant(materials[option]['default'])
        )
      }
      const variants = await Promise.all(variantsFetches)
      for (const option in materials) {
        const materialData = materials[option]
        const product = variants.find((v) => v && v.id == Number(materialData.default))
        const mat = option.replace(/[^\w\s]/g,'').replace(/ /g, "-");
        if (product) {
          const variant = product.variants[0]
          if (variant) {
            properties[mat] = `[id: ${variant.sku}, qty: ${parseInt(materialData.quantity)}]`
          }
        }

        if(materialData.variants && materialData.variants.length > 1) {
          properties[`selected-${mat}`] = `${product.title}(x${parseInt(materialData.quantity)})`;
        }
          
      }
    }
    return properties
  };

  var pushCustomer = function(exigoUses) {
    var first_name = $('#first-name').val(),
        last_name = $('#last-name').val(),
        email = $('#email').val(),
        phone = $('#telephone').val(),
        password = encodeURIComponent($('#create-password').val()), 
        web_alias = $('#web-alias').val();
        console.log("//purium-admin-products.herokuapp.com/create-user?first_name="+first_name+"&last_name="+last_name+"&email="+email+"&phone="+phone+"&password="+password+"&web_alias="+web_alias);

    if (typeof exigoUses != "undefined") {
      console.log('exigoUses', exigoUses);
      console.log('$(".step-1").is(".active")', $('.step-1').is('.active'));
      if ( $('.step-1').is('.active') ) {
        $('.is-error').remove();
        $('#first-name').attr('type', 'text');
        $('#last-name').attr('type', 'text');
        $('#telephone').attr('type', 'text');
        $('#email').attr('type', 'email');
        $('#create-password').attr('type', 'password');
        $('.step-1, .step-2').toggleClass('active');
        setTimeout(function() { 
          $('#web-alias').attr('type', 'hidden');
          $('#first-name').focus();
        },300);
        $('.check-web-alias').text('Submit');
        $('.account-creation-title').html('Create Account');
      } else {
        var customer = $.get( "//purium-admin-products.herokuapp.com/create-user?first_name="+first_name+"&last_name="+last_name+"&email="+email+"&phone="+phone+"&password="+password+"&web_alias="+web_alias )
        .done(function( data ) {
          console.log( "Data Loaded: ", data );
          if (typeof data.errors != "undefined") {
            console.log('shopify data errors');
            console.log('typeof data.errors != "undefined" its true');
            $('.is-error ul').html('');

            for (var i in data.errors) {
              for (var j = data.errors[i].length - 1; j >= 0; j--) {
                Exigo.alert($customerForm, i + " " + data.errors[i][j]);
              }
            }

            $('.check-web-alias').text('Submit');
          } else {
            $.post( "/account/login", "form_type=customer_login&utf8=%E2%9C%93&customer%5Bemail%5D="+email+"&customer%5Bpassword%5D="+password )
            .done(function (jqXHR, status) { 
              console.log(status);
              console.log(jqXHR);

              var $account = $.get('/account', function (response) {
                console.log('/account', response);
                if (response.indexOf('<h1 class="cust__title cust__title--my active">My Account</h1>') !== -1) {
                  console.log('succesful login');
                  if( url.indexOf('?to-checkout') !== -1 ) { // came from cart, so go to checkout

                    if( exigoUses > 0 ) { // eligible and gift card has uses
                      if( under75(price) ) {
                        window.location.href = '/cart?under75';
                      } else {
                        window.location.href = 'https://puriumcorp.myshopify.com/checkout?discount='+coAppend+web_alias;
                      }
                    } else if( exigoUses == 0 ) { // eligible but no gift card uses
                      window.location.href = 'https://puriumcorp.myshopify.com/checkout?'+coAppend;
                    }

                  } else { // regular sign up flow
                    window.location.href = '/account';
                  }
                } else {
                  Exigo.alert($customerForm, "Sorry, we could not login to your account. Please login again.");
                }
              });

            });
          }
        });
      }
    } else {
      $('.is-error ul').html('');
      Exigo.alert($customerForm, "Invalid Gift Card / Web Alias");
      $('.check-web-alias').text('Submit');
    }
  };
  
  var getUrlParameter = function (name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  var initStoragePrice = function () {
    // Checkout.liquid starts at step 1 of checkout
    localStorage.removeItem('inCheckoutFlow');

    // save giftcardcode for use on register page
    if ( window.location.search.indexOf('giftcard') > -1 ) {
      localStorage.setItem('storedGiftCardCode', getUrlParameter('giftcard'));
    }
    
    if( url.indexOf('?to-checkout') !== -1 ) {
      setPrice();
    }
  };

  var bindUIActions = function () {
    // create account start
    $customerForm.on('submit', function(e) {
      var webAlias = $('#web-alias').val();
      if ( $('.step-1').is('.active') ) {
        $('.check-web-alias').text('Checking...');
      } else {
        $('.check-web-alias').text('Creating...');
      }
      Exigo.check(webAlias);
      return false;
    });
  };

  Exigo.init = function () {
    initStoragePrice();
    bindUIActions();
  };

}(window.Exigo = window.Exigo || {}, jQuery));
