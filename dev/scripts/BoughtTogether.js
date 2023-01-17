(function (BoughtTogether, $) {
  "use strict";

  var deliveryText = "Cart";
  BoughtTogether.kits = {};
  let recommendations = []

  const pricify = num => {
    return "$" + parseFloat(Math.round(num * 100) / 100).toFixed(2);
  };

  const fetchIt = url => {
    return fetch( url )
      .then(response => {
        if (response.status >= 200 && response.status < 300) {
          return Promise.resolve(response);
        } else {
          return Promise.reject(new Error(response.statusText));
        }
      })
      .then(response => {
        return response.json();
      })
      .then(data => {
        console.log('Request succeeded with JSON response', data);
        return data;
      })
      .catch(error => {
        console.log('Request failed', error);
      });
  };

  const initSlick = (selector) => {
    $(selector).slick({
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
    let awaits = []; // array of metafield promises
    let recs = ""; // template of all blocks to append
    let totalPrice = window.findifyProdPrice;

    const getMeta = async prod => {
      const price = (window.customer && window.customer.discount == 1) || !window.customer ? `${pricify(prod.price[0])}` : `${pricify(prod.price[0] * window.customer.discount)}<span>${pricify(prod.price[0])}</span>`;

      const prodExigoId = prod.tags.find(tag => tag.toLowerCase().indexOf("exigo_id:") >= 0) ? prod.tags.find(tag => tag.toLowerCase().indexOf("exigo_id:") >= 0).split(":")[1].replace(" ", "") : "3551";
      let dynamics = "";
      const customer_discount = (!window.customer) ? 1 : window.customer.discount;

      // if dynamic or static kit, set properties as data-attr
      if ( prod.category[0].category1.indexOf("Dynamic Kit") >= 0 ) {
        let dynamicsData = {};

        var metafields = await fetchIt('//purium-admin-products.herokuapp.com/get-prod-meta?product_id='+ prod.id );
          const materials = JSON.parse(metafields.metafields.find(meta => meta.key == "materials").value).materials;

          for (var mat in materials) {
            const material = materials[mat];
            const handle = mat.replace(/[^\w\s]/g,'').replace(/ /g, "-");

            var kitProd = await fetchIt('//purium-admin-products.herokuapp.com/get-prod?product_id='+material.default+'&params=variants,title');
              dynamicsData[handle] = `[id: ${kitProd.product.variants[0].sku}, qty: 1]`;
              if(material.variants && material.variants.length > 1) {
                dynamicsData[`selected-${handle}`] = `${kitProd.product.title}(x1)`;
              }
              // end await kitprod
          }
          dynamics = `data-dynamics="${prod.selected_variant_id}"`;
          BoughtTogether.kits[prod.selected_variant_id] = dynamicsData;
          // end await metafields
      } // end if dynamics

      const badges = prod.tags.map((tag, i) => {
        if(tag.includes('oval-icon::')) {
          const options = tag.split('::');
        // if(i < 4) {
        //   const options = 'oval-icon::test::#4D5DBF::1'.split('::');
          return {
            text: options[1],
            color: options[2],
            order: options[3]
          }
        }
      })
      .sort((a, b) => {
        return a.order - b.order;
      })
      .map((tagObj) => {
        if(!tagObj) return '';
        return `<div class='oval-badge' style='background-color: ${tagObj.color}'><p>${tagObj.text}</p></div>`
      });

        // href="${prod.product_url}" 
      const dataBlock = `
      <div class="grid-prod grid-prod--together">
        ${badges.join('')}
        <a data-add-together data-variant="${prod.selected_variant_id}" data-item-id="${prod.id}" data-exigo-type="${prod.category[0].category1}" data-exigo-id="${prodExigoId}" ${dynamics}>
          <div class="tag-img-container">
            <img class="grid-prod__image" src="${prod.image_url.replace("_medium", "")}" />
          </div>
          <div class="grid-prod__info">
            <h2 class="grid-prod__title">${prod.title}</h2>
            <div class="grid-prod__price price">${price}</div>
          </div>
          </a>
      </div>`;

      
      recs += dataBlock;
      totalPrice += prod.price[0];
      totalPrice = totalPrice * customer_discount;
    };
    
    // loop over recommendation items and push meta promise into array
    items.forEach(prod => {
      awaits.push( getMeta(prod) );
    });
    
    // when all meta promises resolve, insert blocks
    Promise.all(awaits)
    .then(() => {
        $("[data-together-slider]").append(recs);
        initSlick("[data-together-slider]");
      });
  };

  const loadRecs = () => {
    const request = {
      name: 'request',
      item_id: window.findifyProdId,
      limit: 2
    };

    Findify.sdk.recommendations("bought", request).then(
      function(data) {
        console.log("bought together data", data);
        buildRecs(data.items);
        recommendations = recommendations.concat(data.items)
      },
      function(error) {
        console.log("bought together error", error);
        loadRecs();
      });
  };

  const addBoughtTogether = async ($this, isAddingAll = false) => {
    const varId = $this.attr('data-variant');
    const itemId = $this.attr('data-item-id'); 
    const type = $this.attr('data-exigo-type');
    const id = $this.attr('data-exigo-id');
    const productDataAttr = $this.attr('data-productdata');
    const $addButton = $('.together-all__atc');
    let properties = {
      "delivery": "One-time Order",
      "qty": "1",
      "type": type,
      "id": id
    };
    if ( $this.is('[data-dynamics]') ) {
      const dynamics = BoughtTogether.kits[$this.attr('data-dynamics')];
      properties = {
        "delivery": "One-time Order",
        "qty": "1",
        "type": type,
        "id": id,
        ...dynamics
      };
    }

    let productData = recommendations.find(({ id }) => itemId === id)
    if (!productData && productDataAttr) {
      productData = JSON.parse(decodeURIComponent(productDataAttr.replace(/\+/g, ' ')))
    }

    const itemProperties = await Exigo.prepareProductProperties(productData)
    properties = Exigo.setPropertyQtys(itemProperties, 1);

    if(isAddingAll) $addButton.html("ADDING...");
    CartJS.addItem(varId, 1, properties, {
      "success": function(data, textStatus, jqXHR) {
        $this.closest(".together-prod").addClass("together-prod--added");
        $this.toggleClass("btn--primary btn--secondary").attr("data-quantity", data.quantity)
        if(isAddingAll) $addButton.html("ADDED ALL THREE!");
        // $('.js-cart-alert').html("Added to Cart. Go to <a class='cart-alert__link' href='/cart'>Cart</a>.").addClass("alert-active alert-success");

        Product.updateNavCart();

        setTimeout(function () {
          // $('.js-cart-alert').removeClass("alert-active alert-success");
        }, 5000);

        Findify.sdk.feedback('click-item', {
          item_id: itemId,
        });

        Findify.sdk.feedback('add-to-cart', {
          item_id: itemId,
          rid: window.findifyProdId,
          quantity: 1
        });

        if( $('.together-prod--added').length == 3 ) {
          $('.together-all__atc').removeClass('btn--primary').addClass('btn--secondary').text('UNDO ALL THREE');
          $('.together-all').addClass('together-all--added');
        }
      },
      "error": function(jqXHR, textStatus, errorThrown) {
          console.log('Error: ' + errorThrown + '!');
      }
    });
  };

  const removeBoughtTogether = $this => {
    const varId = $this.attr('data-variant');
    const quantity = $this.attr('data-quantity') - 1;

    CartJS.updateItemById(varId, quantity, null, {
      "success": function(data, textStatus, jqXHR) {
        $this.closest(".together-prod").removeClass("together-prod--added")
        $this.toggleClass("btn--primary btn--secondary").html("+ ADD");
        // $('.js-cart-alert').html("Item removed from Cart.").addClass("alert-active alert-error");

        var cartAmount = parseInt($('.fa-shopping-cart span').html())
        $('.fa-shopping-cart span').html(cartAmount - 1);
        
        setTimeout(function () {
          // $('.js-cart-alert').removeClass("alert-active alert-error");
        }, 5000);

        $('.together-all__atc').addClass('btn--primary').removeClass('btn--secondary').text('+ ADD ALL THREE');
        $('.together-all').removeClass('together-all--added');
      },
      "error": function(jqXHR, textStatus, errorThrown) {
          console.log('Error: ' + errorThrown + '!');
      }
    });
  };

  var bindUIActions = function () {
    // standard item adds
    $(document).on('click', '[data-add-together]', function() {
      if ( $(this).closest('.together-prod--added').length ) {
        removeBoughtTogether( $(this) );
      } else {
        addBoughtTogether( $(this) );
      }
    });
    // all three adds
    $(document).on('click', '.together-all__atc', function() {
      if ( $(this).closest('.together-all--added').length ) {
        $('[data-add-together]').each(function() {
          removeBoughtTogether( $(this) );
        });
      } else {
        // $('.together-prod:not(.together-prod--added) [data-add-together]').each(function() {
        $('.grid-prod--together:not(.together-prod--added) [data-add-together]').each(function() {
          addBoughtTogether( $(this), true );
        });
      }
    });
  };

  BoughtTogether.init = function () {
    if ( window.findifyProdId ) {
      loadRecs();
    } else {
      slickRecs();
    }
    bindUIActions();
  };


}(window.BoughtTogether = window.BoughtTogether || {}, jQuery));
