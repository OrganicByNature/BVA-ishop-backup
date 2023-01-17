(function (CartPermalink, $) {
  'use strict';
  var breakLoop = false;

  var parseLink = function() {
    // Get href and set RegExp pattern to match digits, followed by a colon, followed by more digits
    // 123456789:1
    var href = window.location.search;
    var pattern = /(\d+:\d+)/g;

    // Test if the href contains the pattern.
    if(pattern.test(href)) {
      // Show loader
      Modal.show('loading');

      // Reset the pattern.
      pattern.lastIndex = 0;

      // Clear the cart
      CartJS.clear({
        "success": function(data, textStatus, jqXHR) {
          addProds(href, pattern);   
        }
      });
    }
  };

  var addProds = function(href, pattern) {
    // Create an array of items based on the matched elements.
    var items = [];
    var regexArray;
    while(regexArray = pattern.exec(href)) {
      items.push(regexArray[0]);
    }

    // Keep track of how many items to add to the cart and how many have been added.
    CartPermalink.itemsToAdd = items.length;
    CartPermalink.itemsReady = 0;


    items.forEach(function(item) {
      // Split the matched elements to get Product ID and Quantity.
      var itemArray = item.split(':');
      if(itemArray.length === 2) {
        var productId = parseInt(itemArray[0]);
        var qty = parseInt(itemArray[1]);

        // Get more details on the product using AJAX.
        var product = $.get( '//purium-admin-products.herokuapp.com/get-prod?product_id='+ productId +'&params=variants,product_type' );
        product.done(function(data) {
          var prod = data.product,
              props = {},
              metaProps = [],
              metaId;

          var addTheProd = function() {
            // Get the first Variant ID and product type
            var variantId = prod.variants[0].id,
                productType = prod.product_type;
            props.id = metaId;
            props.qty = qty;
            props.type = productType;
            props.delivery = "One-time Order";
            props = Exigo.setPropertyQtys(props, qty);

            // Add item to cart
            CartJS.addItem(variantId, qty, props);
            // Keep track of count added to cart.
            CartPermalink.itemsReady++;
          };

          var nextMaterial = function() {
            console.log('next')
            if (metaProps.length) {
              var nextProp = metaProps.shift();
              console.log('nextProp', nextProp);
              var kitProd = $.get( '//purium-admin-products.herokuapp.com/get-prod?product_id='+nextProp.subProd.default+'&params=variants,title' )
              .done(function (data) {
                console.log('prod data', data);
                var exigoCode = data.product.variants[0].sku,
                    title = data.product.title;

                props[nextProp.idAppend] = "[id: "+exigoCode+", qty: "+Number(nextProp.subProd.quantity)+"]";
                if ( nextProp.subProd.variants && nextProp.subProd.variants.length > 1 ) {
                  props["selected-"+nextProp.index.replace(/[^\w\s]/g,'').replace(/ /g, '-')] = title+"(x"+Number(nextProp.subProd.quantity)+")";
                }
                nextMaterial();
              });
            } else {
              addTheProd();
            }
          };

          if (prod.variants && prod.variants.length > 0) {
            // Get the product metafields using AJAX.
            var metafields = $.get( '//purium-admin-products.herokuapp.com/get-prod-meta?product_id='+ productId );
            metafields.done(function(data) {
              var hasMaterials = false;
              for (var i = data.metafields.length - 1; i >= 0; i--) {
                if (data.metafields[i].key == "item_id") {
                  metaId = data.metafields[i].value;
                }
                if (data.metafields[i].key == "materials") {
                  var materials = JSON.parse(data.metafields[i].value).materials;
                  for (var i in materials) {
                    var subProd = materials[i];
                    (function(index, subProd){
                      var idAppend = index.replace(/[^\w\s]/g,'').replace(/ /g, "-");
                      if (subProd.quantity == undefined && subProd.quantity == null) { subProd.quantity = 1; }
                      metaProps.push({"subProd": subProd, "idAppend": idAppend, "index": index});
                    })(i, subProd);
                  }
                  hasMaterials = true;
                  nextMaterial();
                }
              }
              if ( !hasMaterials ) {
                addTheProd();
              }
            });
          }
        });
      }
    });
  };

  var bindUIActions = function() {
    // $dom.cartPermalinks.on('click', function(event) {
    //   event.preventDefault();
    //   parseLink(this);
    // });

    $(document).on('cart.requestComplete', function() {
      if( typeof CartPermalink.itemsReady != 'undefined' && CartPermalink.itemsReady === CartPermalink.itemsToAdd && !breakLoop) {
        // window.location = '/cart';
        breakLoop = true;
        Scroll.unlock();
        Overlay.hide();
        InlineCart.init(true);
        return false;
      }
    })
  }

  CartPermalink.init = function() {
    parseLink();
    bindUIActions();
  }
  
})(window.CartPermalink = window.CartPermalink || {}, jQuery);