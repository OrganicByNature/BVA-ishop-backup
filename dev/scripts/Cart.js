(function (Cart, $) {
  "use strict";

  var $singleItemButton = $('.single-order__confirm'),
      $cartButton = $('.cart-action .btn').not('.qualify-75--button'),
      coAppend = "step=contact_information&discount=",
      checkoutURL,
      scopedUses,
      price,
      priceLeft;

  var exigofyCart = function() {
    console.log('exigofying cart')
    var noFormatCart = $.get('/cart.js', null, null, "json")
    .done(function(data) {
      console.log(data);
      var downToId = function(start) {
        var mid = start.split("["),
            end = "";
        for (var k = 0; k < mid.length; k++) {
          end = end + mid[k].split(", qty")[0];
        }
        return end;
      };
      var downToNumId = function(start, multiplier) {
        var mid = start.split("qty: ")[1],
            end = Number(mid.split("]")[0]) * multiplier;
        return end;
      };
      var downToNumKey = function(start, multiplier) {
        var mid = start.split("(x")[1],
            end = Number(mid.split(")")[0]) * multiplier;
        return end;
      };
      var addNext = function() {
        if (prodPackage.length) {
          var request = prodPackage.shift();
          console.log('request', request);
          var addSingleProd = $.post('/cart/add.js', request, null, "json")
          .done(function(addData) {
            console.log('addData', addData);
            addNext();
          });
        } else {
          console.log(checkoutURL);
          window.location.href = checkoutURL;
        }
      };
      var ids = [],
          itemPackage = {},
          prodPackage = [],
          keeper,
          thisItem,
          qtyString,
          preQty,
          toQty,
          postQty,
          idContain,
          keyContain,
          displayProp;

      for (var i = 0; i < data.items.length; i++) {
        if (typeof ids[data.items[i].id] == "undefined"){
          ids[data.items[i].id] = [];
        }
        ids[data.items[i].id].push(i);
      }
      console.log('ids', ids);

      for (var id in ids) {
        keeper = data.items[ids[id][0]];

        if(keeper.quantity != keeper.properties.qty || keeper.quantity == keeper.properties.qty && ids[id].length > 1) {
          for (var j = 0; j < ids[id].length; j++) {
            console.log('j', j);
            thisItem = data.items[ids[id][j]];
            console.log('thisItem.quantity', thisItem.quantity);
            if(j != 0){keeper.quantity = keeper.quantity + thisItem.quantity;}
            for (var prop in keeper.properties) {
              console.log(thisItem.properties[prop]);
              idContain = keeper.properties[prop].indexOf(downToId(thisItem.properties[prop]));
              keyContain = keeper.properties[prop].indexOf(thisItem.properties[prop].split("(x")[0]);
              displayProp = prop.indexOf("selected-");
              if(prop != "id" && prop != "qty" && prop != "type" && prop != "delivery") {
                if(j == 0) {
                  if (displayProp != -1) {
                    console.log('hitting flow: first selected');
                    preQty = keeper.properties[prop].split(thisItem.properties[prop].split("(x")[0])[0];
                    toQty = keeper.properties[prop].split(new RegExp(thisItem.properties[prop].split("(x")[0] + "(.+)"))[1];
                    keeper.properties[prop] = preQty + thisItem.properties[prop].split("(")[0] + "(x" +  downToNumKey(keeper.properties[prop], keeper.quantity) + ")";
                  } else {
                    console.log('hitting flow: first qty/id');
                    preQty = keeper.properties[prop].split(downToId(thisItem.properties[prop]))[0];
                    toQty = keeper.properties[prop].split(new RegExp(downToId(thisItem.properties[prop]) + "(.+)"))[1];
                    keeper.properties[prop] = preQty + downToId(thisItem.properties[prop]) + ", qty: " + downToNumId(keeper.properties[prop], keeper.quantity) + "]";
                  }
                } else {
                  if(displayProp == -1 && idContain == -1 || displayProp != -1 && keyContain == -1) {
                    if (displayProp != -1) {
                      console.log('hitting flow: appending selected');
                      preQty = thisItem.properties[prop].split(thisItem.properties[prop].split("(x")[0])[0];
                      toQty = thisItem.properties[prop].split(new RegExp(thisItem.properties[prop].split("(x")[0] + "(.+)"))[1];
                      thisItem.properties[prop] = preQty + thisItem.properties[prop].split("(")[0] + "(x" +  downToNumKey(thisItem.properties[prop], thisItem.quantity) + ")";
                    } else {
                      console.log('hitting flow: appending qty/id');
                      preQty = thisItem.properties[prop].split(downToId(thisItem.properties[prop]))[0];
                      toQty = thisItem.properties[prop].split(new RegExp(downToId(thisItem.properties[prop]) + "(.+)"))[1];
                      thisItem.properties[prop] = preQty + downToId(thisItem.properties[prop]) + ", qty: " + downToNumId(thisItem.properties[prop], thisItem.quantity) + "]";
                    }
                    keeper.properties[prop] = keeper.properties[prop] + ", " + thisItem.properties[prop];
                  } else {
                    qtyString = "";
                    if(displayProp != -1) {
                      console.log('hitting flow: adding selected');
                      preQty = keeper.properties[prop].split(thisItem.properties[prop].split("(x")[0])[0];
                      toQty = keeper.properties[prop].split(new RegExp(thisItem.properties[prop].split("(x")[0] + "(.+)"))[1];
                      postQty = toQty.split(/\)(.+)/)[1];
                      if(typeof postQty == "undefined"){postQty = "";}
                      qtyString = preQty + thisItem.properties[prop].split("(x")[0] + "(x" + (downToNumKey(toQty, 1) + downToNumKey(thisItem.properties[prop], thisItem.quantity)) + ")" + postQty;
                    } else {
                      console.log('hitting flow: adding qty/id');
                      preQty = keeper.properties[prop].split(downToId(thisItem.properties[prop]))[0];
                      toQty = keeper.properties[prop].split(new RegExp(downToId(thisItem.properties[prop]) + "(.+)"))[1];
                      postQty = toQty.split(/](.+)/)[1];
                      if(typeof postQty == "undefined"){postQty = "";}
                      qtyString = preQty + downToId(thisItem.properties[prop]) + ", qty: " + (downToNumId(toQty, 1) + downToNumId(thisItem.properties[prop], thisItem.quantity)) + "]" + postQty;
                    }
                    keeper.properties[prop] = qtyString;
                  }
                }
              }
              console.log(keeper.properties[prop]);
            }
          }
        }
        keeper.properties.qty = keeper.quantity.toString();
        console.log('keeper after', keeper);

        itemPackage = {};
        itemPackage.quantity = keeper.quantity;
        itemPackage.id = keeper.id;
        itemPackage.properties = keeper.properties;
        console.log('itemPackage', itemPackage);
        prodPackage.push(itemPackage);
        console.log('prodPackage', prodPackage);
      }

      console.log("prodPackage", prodPackage);
      var deleteCart = $.post('/cart/clear.js', null, null, "json")
      .done(function(deleteData) {
        console.log('deleteData', deleteData);
        addNext();
      });
    });

  };

  var setUrl = function() {   
      if( window.customer && window.customer.rank == '18' && window.customer.order_count == 0 ) {
        if( scopedUses > 0 ) { // eligible and gift card has uses
          if( under75(price) && !window.customer.update_in_cart ) {
            checkoutURL = 'javascript:;';
          } else {
            checkoutURL = 'https://puriumcorp.myshopify.com/checkout?discount='+window.customer.web_alias;
          }
        } else if( scopedUses == 0 ) { // eligible but no gift card uses
          checkoutURL = 'https://puriumcorp.myshopify.com/checkout?discount=';
        }
      } else if( window.customer && typeof window.customer.web_alias != "undefined" && window.customer.order_count > 0 ) {
        checkoutURL = 'https://puriumcorp.myshopify.com/checkout?discount='+window.customer.discount_name
      } else {
        checkoutURL = 'https://puriumcorp.myshopify.com/checkout?discount=';
      }
      $singleItemButton.prop('href', checkoutURL).css('display', 'inline-block');
      console.log(checkoutURL);
  };

  var setPopup = function() {
    if( window.customer && window.customer.rank == '18' && window.customer.order_count == 0 && scopedUses > 0 && under75(price) && !window.customer.update_in_cart && window.customer.discount_name != 'BGMA2018' ) {
      console.log('priceLeft', priceLeft);
      $('.js-money--under-75').text(priceLeft);
      $('.cart-action').addClass('to-right');
      $singleItemButton.addClass('popup');
    } else {
      $('.cart-action').removeClass('to-right');
      $singleItemButton.removeClass('popup');
    }
  };

  Cart.removeSmartItems = function(elem, type) {
    checkoutURL = elem.prop('href');
    var postContent = {
      updates: {}
    };

    console.log('postContent start', postContent);
    console.log('checkoutURL', checkoutURL);

    var removeSmarts = $.get('/cart.js', null, null, "json") //needs "json" to return correct format
    .done(function(data) {
      console.log('data', data);
      var prod = data.items;
      for(var i=0; i<prod.length; i++){
        if(prod[i].properties.delivery == "Smart Order"){
          postContent.updates[prod[i].id] = 0;
        }
      }

      console.log('postContent done', postContent);
      var removeFromCart = $.post('/cart/update.js', postContent, null, "json")
      .done(function(response) {
        console.log('updated cart');
        if(type == "single") {
          exigofyCart();
        } else if(type == "smart") {
          console.log("type smart");
          // window.location.href = window.location.href+"?smart-success";
        }
      });
    })
    .fail(function(error, errorText) {
      $smartOrderButton.text('Submitting Smart Order...');
      Exigo.alert($cartErrorSmart, "Sorry, there was error adding these items to your Smart Order. Please try again");
      console.log('error', error);
      console.log('errorText', errorText);
    });
  };

  Cart.setUp = function() {
    price = Number( $('.subtotal').data('subtotal') );
    if( window.customer && window.customer.rank == '18' && window.customer.order_count == 0 ) {
      if( scopedUses > 0 ) { // eligible and gift card has uses
        if( under75(price) && !window.customer.update_in_cart ) {
          checkoutURL = 'javascript:;';
        } else {
          checkoutURL = 'https://puriumcorp.myshopify.com/checkout?'+coAppend+window.customer.web_alias;
        }
      } else if( scopedUses == 0 ) { // eligible but no gift card uses
        checkoutURL = 'https://puriumcorp.myshopify.com/checkout?'+coAppend;
      }
    } else if( window.customer && typeof window.customer.web_alias != "undefined" && window.customer.order_count > 0 ) {
      checkoutURL = 'https://puriumcorp.myshopify.com/checkout?'+coAppend+window.customer.discount_name;
    } else {
      checkoutURL = 'https://puriumcorp.myshopify.com/checkout?'+coAppend;
    }

    if( $singleItemButton.length ) {
      if( window.customer ) {
        var webAliasUrl = window.customer.web_alias;
        var checkWebAlias = $.get('https://purium.sunriseintegration.com/api/affiliate?code='+webAliasUrl)
        .done(function(response) {
          console.log(response);
          console.log('response.uses_left', response.uses_left);
          console.log('window.customer.order_count', window.customer.order_count);
          scopedUses = response.uses_left;
          setUrl();
          setPopup();
        });
        
      }
    } else if($cartButton.length) {
      checkoutURL = 'https://puriumcorp.myshopify.com/account/login?to-checkout';
    }
  };

  var under75 = function(price) {
    console.log(price);
    if( price >= 7500 || window.customer.web_alias.toUpperCase() == 'BGMA2018' ) {
      return false;
    } else {
      priceLeft = ((7500 - price)/100).toFixed(2);
      return true;
    }
  };

  var bindUIActions = function () {

    if( window.location.href.indexOf('?under75') !== -1 ) {
      Modal.show('under-75');
    }

    // Upgrade items not in cart
    if( window.customer && typeof window.customer.update_in_cart != 'undefined' && !window.customer.update_in_cart ) {
      Upgrade.removeProp();
    }

    // All buttons
    $cartButton.on('click', function(e) {
      e.preventDefault();
      if( $(this).hasClass('popup') ){
        Modal.show('under-75');
      } else {
        $(this).addClass("disabled").text("Submitting...");
      }
      exigofyCart();
    });

    // on load
    Cart.setUp();
  };

  Cart.init = function () {
    bindUIActions();
  };

}(window.Cart = window.Cart || {}, jQuery));
