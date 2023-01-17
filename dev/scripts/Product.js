(function (Product, $) {
  "use strict";

  var materials,
      deliveryText = "Cart";

  if (window.materials) {
    materials = window.materials.materials;
  }

  const pricify = num => {
    return "$" + parseFloat(Math.round(num * 100) / 100).toFixed(2);
  };

  Product.selectCallback = function(variant, selector) {
    if (variant) {
      if (variant.available) {
        // Selected a valid variant that is available.
        $('.add-to-cart-button').removeClass('disabled').removeAttr('disabled').val('Add to Cart').fadeTo(200,1);
      } else {
        // Variant is sold out.
        $('.add-to-cart-button').val('Sold Out').addClass('disabled').attr('disabled', 'disabled').fadeTo(200,0.5);
      }
      // Whether the variant is in stock or not, we can update the price and compare at price.
      if ( variant.compare_at_price > variant.price ) {
        $('.pdp-info__price-reg').html(Shopify.formatMoney(variant.price, ""));
        $('.pdp-info__price-compare').html(Shopify.formatMoney(variant.compare_at_price, ""));
      } else {
        $('.pdp-info__price-reg').html(Shopify.formatMoney(variant.price, ""));
      }
    } else {
      // variant doesn't exist.
      $('.add-to-cart-button').val('Unavailable').addClass('disabled').attr('disabled', 'disabled').fadeTo(200,0.5);
    }
  };

  Product.updateNavCart = function() {
    var cartAmount = parseInt($('.fa-shopping-cart span').html())
    var itemAmount = $('.pdp-info__qty').length ? parseInt($('.pdp-info__qty').val()) : 1;
    if(isNaN(cartAmount)) {
      $('.fa-shopping-cart span').html('1');
    } else {
      $('.fa-shopping-cart span').html(cartAmount + itemAmount);
    }
  };

  Product.buildMaterials = function (mats) {
    var fieldHtml = [];

    for (var i in mats) {
      var subProd = mats[i];
          fieldHtml[i] = '';

      if(subProd.variants && subProd.variants.length == 1) {
        (function(index, subProd){
          var idAppend = index.replace(/[^\w\s]/g,'').replace(/ /g, "-");
          if (subProd.quantity == undefined && subProd.quantity == null) { subProd.quantity = 1; }
          var kitProd = $.get( '//purium-admin-products.herokuapp.com/get-prod?product_id='+subProd.variants[0]+'&params=variants' )
          .done(function (data) {
            // console.log('prod data', data);
            var exigoCode = data.product.variants[0].sku;
            $('.pdp-info__field-wrap').append('<input class="kit-product exigo-id hidden required" id="property__exigo-id-'+idAppend+'" type="hidden" name="properties['+idAppend+']" value="[id: '+exigoCode+', qty: '+Number(subProd.quantity)+']">');
          });
        })(i, subProd);
      } else if(subProd.variants && subProd.variants.length > 1) {
        $('.pdp-info__field-wrap').append('<label class="pdp-info__variant-label">'+i+':</label><div class="selector-wrapper"><select class="kit-product-select exigo-id required" id="property__exigo-id-'+i.replace(/[^\w\s]/g,'').replace(/ /g, "-")+'" name="properties['+i.replace(/[^\w\s]/g,'').replace(/ /g, "-")+']"></select></div><input class="kit-product exigo-id hidden required" id="property__selected__exigo-id-'+i.replace(/[^\w\s]/g,'').replace(/ /g, "-")+'" type="hidden" name="properties[selected-'+i.replace(/[^\w\s]/g,'').replace(/ /g, "-")+']" value="">');
        for (var j in subProd.variants) {
          (function(index, subProd){
            var idAppend = index.replace(/[^\w\s]/g,'').replace(/ /g, "-");
            if (subProd.quantity == undefined && subProd.quantity == null) { subProd.quantity = 1; }
            var kitProd = $.get( '//purium-admin-products.herokuapp.com/get-prod?product_id='+subProd.variants[j]+'&params=id,variants,title' )
            .done(function (data) {
              // console.log('prod data', data);
              var property = '#property__exigo-id-'+idAppend,
                  exigoCode = data.product.variants[0].sku,
                  title = data.product.title,
                  option = '<option value="[id: '+exigoCode+', qty: '+Number(subProd.quantity)+']" data-prop-val="'+title+'(x'+Number(subProd.quantity)+')">'+title+'</option>';
                  // console.log('data.product.id.toString()', data.product.id.toString());
                  // console.log('subProd.default', subProd.default);
              if(data.product.id.toString() == subProd.default){
                  // console.log('prepend', $(property));
                $(property).prepend(option).val('[id: '+exigoCode+', qty: '+Number(subProd.quantity)+']');
                $('#property__selected__exigo-id-'+idAppend).val(title+"(x"+Number(subProd.quantity)+")");
                $('#property__selected__exigo-id-'+idAppend).parent().next().val(title+"(x"+Number(subProd.quantity)+")");
              } else {
                  // console.log('append', $(property));
                $(property).append(option);
              }
            });
          })(i, subProd);
        }
      } else if(subProd.default) {
        (function(index, subProd){
          var idAppend = index.replace(/[^\w\s]/g,'').replace(/ /g, "-");
          if (subProd.quantity == undefined && subProd.quantity == null) { subProd.quantity = 1; }
          var kitProd = $.get( '//purium-admin-products.herokuapp.com/get-prod?product_id='+subProd.default+'&params=variants' )
          .done(function (data) {
            // console.log('prod data', data);
            var exigoCode = data.product.variants[0].sku;
            $('.pdp-info__field-wrap').append('<input class="kit-product exigo-id hidden required" id="property__exigo-id-'+idAppend+'" type="hidden" name="properties['+idAppend+']" value="[id: '+exigoCode+', qty: '+Number(subProd.quantity)+']">');
          });
        })(i, subProd);
      }
    }
  };

  const slickRecs = () => {
    $('.prod-slider__wrap').slick({
      slide: ".grid-prod",
      infinite: true,
      slidesToScroll: 1,
      slidesToShow: 1,
      centerMode: true,
      centerPadding: '50px',
      arrows: true,
      prevArrow: "<div class='slick-prev'><img src={{ 'Left.svg' | asset_url }} /></div>",
      nextArrow: "<div class='slick-next'><img src={{ 'Right.svg' | asset_url }} /></div>",
      mobileFirst: true,
      responsive: [
        {
          breakpoint: 500,
          settings: {
            arrows: true,
            slidesToShow: 3,
            centerMode: false,
          }
        },
        {
          breakpoint: 1050,
          settings: {
            arrows: true,
            slidesToShow: 5,
            centerMode: false,
          }
        }
      ]
    });
  };

  const buildRecs = items => {
    let bests = "";
    items.forEach(prod => {
      const newProd = prod.tags.find(tag => tag.toLowerCase().indexOf("new-product") >= 0) ? '<div class="new-product-badge">NEW</div>' : '';
      const price = (window.customer && window.customer.discount == 1) || !window.customer ? `">${pricify(prod.price[0])}` : `member-price">${pricify(prod.price[0] * window.customer.discount)}`;
      const comparePrice = (window.customer && window.customer.discount == 1) || !window.customer ? `` : `${pricify(prod.price[0])}`;

      const dataBlock = `
        <div class="grid-prod">
          <a href="${prod.product_url}">
            <div class="tag-img-container">
              <img class="grid-prod__image" src="${prod.image_url.replace("_medium", "")}">
              ${newProd}
            </div>
            <div class="grid-prod__info">
              <h2 class="grid-prod__title">${prod.title}</h2>
              <div class="grid-prod__price price${price}<span>${comparePrice}</span></div>
            </div>
            </a>
        </div>`;

      bests += dataBlock;
    })
    $(".prod-slider__wrap").append(bests);
  };

  const loadRecs = () => {
    // console.log("window.findifyProdId", window.findifyProdId)
    const request = {
      name: 'request',
      item_id: window.findifyProdId,
      limit: window.findifyProdsLimit
    };

    Findify.sdk.recommendations("viewed", request).then(
      function(data) {
        // console.log("recommendation data", data)
        buildRecs(data.items);
        slickRecs();
      },
      function(error) {
        console.log("recommendation error", error)
        loadRecs();
      });
  };

  const alsoLikeSlider = () => {
    if ( window.findifyProdId ) {
      loadRecs();
    } else {
      slickRecs();
    }
  };

  var bindUIActions = function () {
    // More Info toggles
    $('.pdp-more__heading').on('click', function() {
      var $target = $(this);
      var $targetInfo = $(this).next();

      $target.toggleClass('active-toggle');
      Toggle.slideToggle($targetInfo);
    });

    // Change Add to Cart Button text
    $('[name="properties[delivery]"]').on('change', function() {
      // console.log('changing delivery');
      var thisVal = $(this).val();
      if(thisVal == "Smart Order") {
        deliveryText = "Smart Order";
      } else {
        deliveryText = "Cart";
      }
      $('.pdp-info__submit').val("Add to "+deliveryText);
    });

    // Add to Cart Popup
    $(document).on('submit', '.add-to-cart-form', function(e){
      e.preventDefault();

      var $this = $(this),
          $submitButton = $('.add-to-cart-button', $this),
          formID = $('[name="id"]', $this).val(),
          formQty = $('[name="quantity"]', $this).val(),
          formProps = {},
          // formData = $(this).serializeArray(),
          // formAction = $(this).prop("action"),
          alertType,
          alertMessage;
      $('[name^="properties"]').each(function() {
        const stringProp = $(this).attr('name').replace("properties[", "").replace("]", "");
        formProps[stringProp] = $(this).val();
      });
      formProps = Exigo.setPropertyQtys(formProps, formQty);
      // console.log("formProps", formProps);

      $submitButton.val("Adding...");

      CartJS.addItem(formID, formQty, formProps, {
        success: function(data, textStatus, jqXHR) {
          console.log('in success')
          alertType = "alert-success";
          alertMessage = "Added to "+deliveryText+". Go to <a class='cart-alert__link' href='/cart'>Cart</a>.";
          Product.updateNavCart();

          // $('.js-cart-alert').html(alertMessage).addClass("alert-active "+alertType);
          $submitButton.val("Add to "+deliveryText);

          // setTimeout(function () {
          //   $('.js-cart-alert').removeClass("alert-active alert-success alert-error");
          // }, 5000);

          if ( location.href.indexOf('quick-shop') ) {
            Findify.sdk.feedback('add-to-cart', {
              item_id: $('#property__shopify-id').val(),
              rid: "quick-shop",
              quantity: 1
            });
          }
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log('in error')
          alertType = "alert-error";
          alertMessage = "There was a problem adding this product. Please try again.";

          // $('.js-cart-alert').html(alertMessage).addClass("alert-active "+alertType);
          $submitButton.val("Add to "+deliveryText);

          setTimeout(function () {
            // $('.js-cart-alert').removeClass("alert-active alert-success alert-error");
          }, 10000);
        }
      });

      // $.post( formAction, formData )
      // .done(function(data) {
      //   alertType = "alert-success";
      //   alertMessage = "Added to "+deliveryText+". Go to <a class='cart-alert__link' href='/cart'>Cart</a>.";
      //   Product.updateNavCart();
      //   // console.log(formAction);
      //   // console.log(formData);
      // })
      // .fail(function(error) {
      //   alertType = "alert-error";
      //   alertMessage = "There was a problem adding this product. Please try again.";
      //   // console.log(formAction);
      //   // console.log(formData);
      //   // console.log(error);
      // })
      // .always(function() {
      //   $('.js-cart-alert').html(alertMessage).addClass("alert-active "+alertType);
      //   $submitButton.val("Add to "+deliveryText);

      //   setTimeout(function () {
      //     $('.js-cart-alert').removeClass("alert-active alert-success alert-error");
      //   }, 10000);
      // });
    });

    // kit product select
    $(document).on('change', '.kit-product-select', function() {
      var selectedData = $(this).children(':selected').data("prop-val");
      $(this).parent().next().val(selectedData);
    });

  };

  Product.init = function () {
    // if materials exist (Dynamic Kit product.metafields.c_f.materials)
    if (materials) {
      Product.buildMaterials(materials);
    }
    alsoLikeSlider();
    bindUIActions();
  };


}(window.Product = window.Product || {}, jQuery));
