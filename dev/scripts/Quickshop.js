((Quickshop, $) => {

  var path = window.location.pathname;
  var smart_view = "";
  if(path.includes("account")){
    smart_view = "?view=smart-order";
  }

  let analytics;
  const $dom = {};
  let globalFilters = {
    "custom_fields.custom_category": {
      "Cleansing": true,
      "Anti-Aging": true,
      "Kids & Dogs": true,
      "Athletes": true,
      "Weight Loss": true, 
      "Gut Health" : true
    },
    "custom_fields.custom_badge": {
      "Glutenfree": false,
      "Raw": false,
      "Vegan": false,
      "Kosher": false,
      "Usda": false
    }
  };
  let globalSearch = "";
  let globalSort = [{
        field: 'title',
        order: 'asc'
      }];

  const cacheDom = () => {
    $dom.body = $("body");
    $dom.search = $(".qs-search");
    $dom.filters = $(".filter");
    $dom.filterTitles = $(".filter__title");
    $dom.filterDrops = $(".filter__dropdown");
    $dom.filterChecks = $(".filter__checkbox");
    $dom.filterClose = $("[data-close-filter]");
    $dom.descSort = $(".qs-table__th--desc");
    $dom.priceSort = $(".qs-table__th--price");
    $dom.tbody = $(".qs-table__body");
    $dom.bests = $(".bests");
    $dom.bestsWrap = $(".bests__wrap");
    $dom.openBests = $("[data-bests]");
    $dom.closeBests = $("[data-bests-close]");
  };

  const handleize = str => {
    return str.toLowerCase().replace(/[^\w\u00C0-\u024f]+/g, "-").replace(/^-+|-+$/g, "");
  };

  const pricify = num => {
    return "$" + parseFloat(Math.round(num * 100) / 100).toFixed(2);
  };

  const compareBadges = data => {
    let concats;
    data.meta.filters.forEach(filter => {
      if ( filter.name == "custom_fields.custom_badge" && filter.values.length > 1 ) {
        concats = filter.values.map(concat => "Badge::" + concat.value.toLowerCase() );
      }
    });

    if ( concats ) {
      return data.items.filter(item => {
        return concats.every(badge => item.tags.indexOf(badge) >= 0);
      });
    } else {
      return data.items;
    }
  };

  const createRequest = (offset = 0) => {
    const request = {
      q: globalSearch,
      limit: 120,
      filters: [{
        name: "custom_fields.custom_category",
        type: "text",
        values: []
      },
      {
        name: "custom_fields.custom_badge",
        type: "text",
        values: []
      }],
      offset: offset,
      sort: globalSort
    };

    // if ( Array.isArray(globalSort) ) {
    //   request.sort = globalSort;
    // }

    for ( var filter in globalFilters["custom_fields.custom_category"] ) {
      if ( globalFilters["custom_fields.custom_category"][filter] ) {
        var value = { "value": filter }
        request.filters[0].values.push(value);
      }
    };

    for ( var filter in globalFilters["custom_fields.custom_badge"] ) {
      if ( globalFilters["custom_fields.custom_badge"][filter] ) {
        var value = { "value": filter }
        request.filters[1].values.push(value);
      }
    };

    return request;
  };

  const buildRows = items => {
    let tbody = "";
    items.forEach((prod, index) => {
      // console.log(index, prod.tags)
      const prodHandle = handleize(prod.title);
      const prodLink = prod.product_url.split("?")[0] + "?view=quick-shop";
      const prodBest = window.bests.indexOf(prod.title) >= 0 ? '<div class="qs-table__cell-best">Best Seller</div>' : '' ;
      const prodPrice = window.customer ? pricify(prod.price[0] * window.customer.discount) : pricify(prod.price[0]);
      const prodBV = prod.tags.find(tag => tag.toLowerCase().indexOf("bv::") >= 0) ? prod.tags.find(tag => tag.toLowerCase().indexOf("bv::") >= 0).toLowerCase().replace("bv::", "").replace(" ", "") : false;
      const prodBVString = window.customer && window.customer.show_bv && prodBV ? `<span class="qs-table__bv">A ${prodBV} BV VALUE</span>` : "";
      const prodExigoId = prod.tags.find(tag => tag.toLowerCase().indexOf("exigo_id:") >= 0) ? prod.tags.find(tag => tag.toLowerCase().indexOf("exigo_id:") >= 0).split(":")[1] : "3551";
      let prodBadges = "";
      prodBadges = prod.tags.map(tag => {
        if ( tag.indexOf("Badge::") >= 0 && !tag.indexOf("detox") >= 0 ) {
          return `<img src="${window.badges[tag.replace("Badge::", "").toLowerCase()]}" class="qs-table__badge">`;
        }
      }).join("");
      let prodCollClasses = "";
      prodCollClasses = prod.tags.map(tag => {
        if ( tag.toLowerCase().indexOf("coll::") >= 0 ) {
          return "coll--" + tag.toLowerCase().replace("zcoll::", "").replace("coll::", "").replace(" ", "-");
        }
      }).join(" ");
      let prodButton;
      if ( $('.cust__template--add-item').length ) {
        prodButton = `<a href="${prod.product_url.split("?")[0] + '?view=smart-order'}" class="btn btn--secondary so__to-prod qs-table__cta"><i class="fa fa-shopping-cart" aria-hidden="true"></i>Add</a>`
      } else if ( prod.category[0].category1.indexOf("Dynamic Kit") >= 0 ) {
        prodButton = `<button class="btn btn--secondary btn-transparent qs-table__cta" data-qs-modal="${prodLink}"><i class="fa fa-shopping-cart" aria-hidden="true"></i>Customize</button>`;
      } else {
        prodButton = `<button class="btn btn--secondary btn-transparent qs-table__cta" data-add-to-cart data-variant="${prod.selected_variant_id}" data-item-id="${prod.id}" data-exigo-type="${prod.category[0].category1}" data-exigo-id="${prodExigoId}"><i class="fa fa-shopping-cart" aria-hidden="true"></i><span class="qs-table__add">Add</span><span class="qs-table__add-extra"> to cart</span></button>`;
      }
      // const prodButton = prod.category[0].category1.indexOf("Dynamic Kit") >= 0 ? `data-qs-modal="${prodLink}"><i class="fa fa-shopping-cart" aria-hidden="true"></i>Customize` : `data-add-to-cart data-variant="${prod.product_url.split("variant=")[1]}" data-item-id="${prod.id}" data-exigo-type="${prod.category[0].category1}"><i class="fa fa-shopping-cart" aria-hidden="true"></i><span class="qs-table__add">Add</span><span class="qs-table__add-extra"> to cart</span>`;
      // const prodButton = `data-add-to-cart data-variant="${prod.product_url.split("variant=")[1]}" data-item-id="${prod.id}">Add to cart`;

      const dataRow = `
        <tr class="qs-table__row qs-table__row--${prodHandle} ${prodCollClasses}">
          <td class="qs-table__cell qs-table__cell--desc"><a class="qs-table__cell-link" href="${prod.product_url}${smart_view}">${prod.title}${prodBest}</a></td>
          <td class="qs-table__cell qs-table__cell--price"><span class="qs-table__price">${prodPrice}</span>${prodBVString}</td>
          <td class="qs-table__cell qs-table__cell--quals">${prodBadges}</td>
          <td class="qs-table__cell qs-table__cell--action">${prodButton}</td>
        </tr>`;

      tbody += dataRow;
    })
    $dom.tbody.html(tbody);
  };

  const buildRecs = items => {
    let bests = "";
    items.forEach(prod => {
    // for ( let prod in items ) {
      const prodHandle = handleize(prod.title);
      const prodLink = prod.product_url.split("?")[0] + "?view=quick-shop";
      const prodPrice = window.customer ? pricify(prod.price[0] * window.customer.discount) : pricify(prod.price[0]);
      const prodBV = prod.tags.find(tag => tag.toLowerCase().indexOf("bv::") >= 0) ? prod.tags.find(tag => tag.toLowerCase().indexOf("bv::") >= 0).toLowerCase().replace("bv::", "").replace(" ", "") : false;
      const prodBVString = window.customer && window.customer.show_bv ? `<span class="qs-table__bv">A ${prodBV} BV VALUE</span>` : "";
      const prodExigoId = prod.tags.find(tag => tag.toLowerCase().indexOf("exigo_id:") >= 0) ? prod.tags.find(tag => tag.toLowerCase().indexOf("exigo_id:") >= 0).split(":")[1] : "3551";
      const prodButton = prod.category[0].category1.indexOf("Dynamic Kit") >= 0 ? `data-qs-modal="${prodLink}">Customize` : `data-add-to-cart data-variant="${prod.selected_variant_id}" data-item-id="${prod.id}" data-exigo-type="${prod.category[0].category1}" data-exigo-id="${prodExigoId}">Add to cart`;
      // const prodButton = prod.category[0].category1.indexOf("Dynamic Kit") >= 0 ? `data-qs-modal="${prodLink}">Customize` : `data-add-to-cart data-variant="${prod.product_url.split("variant=")[1]}" data-item-id="${prod.id}" data-exigo-type="${prod.category[0].category1}">Add to cart`;
      // const prodButton = `data-add-to-cart data-variant="${prod.product_url.split("variant=")[1]}" data-item-id="${prod.id}">Add to cart`;

      const dataBlock = `
        <div class="bests__block bests__block--${prodHandle}">
          <div class="bests__left">
            <div class="bests__badge">Best Seller</div>
            <div class="bests__picture"><img src="${prod.image_url}" alt="Best Sellers"></div>
          </div>
          <div class="bests__right">
            <div class="bests__title"><a class="bests__title-link" href="${prod.product_url}">${prod.title}</a></div>
            <div class="bests__price">${prodPrice}</div>
            <div class="bests__value">${prodBVString}</div>
            <div class="bests__cta"><button class="btn btn--secondary btn-transparent" ${prodButton}</button></div>
          </div>
        </div>`;

      bests += dataBlock;
    })
    $dom.bestsWrap.html(bests);
  };

  const loadProds = (query, callback) => {
    Findify.sdk.search(query).then(
      function(data) {
        console.log("then data", data)
        const totalItems = compareBadges(data);
        if ( totalItems.length ) {
          buildRows(totalItems);
          // globalResults = data.items;
        } else {
          $dom.tbody.html('<tr class="qs-table__row qs-table__row--none"><td class="qs-table__cell qs-table__cell--none" colspan="4">No items matched your filters</td></tr>');
          // globalResults = [];
        }

        if ( typeof callback == "function" ) {
          callback();
        }
      },
      function(error) {
        console.log("then error",error)
        loadProds(query);
      });
  };

  const loadRecs = () => {
    const request = {
      name: 'request',
      payload: {
          limit: 5
      }
    };

    Findify.sdk.recommendations("trending", request).then(
      function(data) {
        console.log("recommendation data", data)
        buildRecs(data.items);
        slickRecs();
      },
      function(error) {
        console.log("recommendation error", error)
        loadRecs();
      });
  };

  const loadFindify = () => {
    Findify.init();

    const request = createRequest();
    request.slot = "/collections/quick-shop";
    delete request.q;

    const loadInitial = () => {
      Findify.sdk.collection(request).then(
        function(data) {
          console.log("load data", data)
          const totalItems = compareBadges(data);
          if ( totalItems.length ) {
            buildRows(totalItems);
          } else {
            $dom.tbody.html('<tr class="qs-table__row qs-table__row--none"><td class="qs-table__cell qs-table__cell--none" colspan="4">No items matched your filters</td></tr>');
          }
        },
        function(error) {
          console.log("load error",error)
          loadInitial(request);
        });
    };

    loadInitial();
    loadRecs();
  };

  const toggle = $this => {
    const $parent = $this.closest(".filter");
    $parent.toggleClass('active');
    $(".filter__dropdown", $parent).slideToggle();
    $dom.filters.not($parent[0]).removeClass("active");
    $dom.filterDrops.not($(".filter__dropdown", $parent)[0]).slideUp();
  };

  const slickRecs = () => {
    $('.bests__wrap').slick({
      infinite: true,
      slidesToShow: 2,
      slidesToScroll: 1,
      variableWidth: true,
      arrows: true,
      prevArrow: "<div class='slick-prev'></div>",
      nextArrow: "<div class='slick-next'></div>",
      responsive: [
        {
          breakpoint: 767,
          settings: "unslick"
        }
      ]
    });
  }

  const bindUIActions = () => {
    $dom.filterTitles.on('click', function() {
      toggle( $(this) );
    });

    $dom.filterClose.on('click', function() {
      $(this).closest('.filter__dropdown').slideUp();
      $(this).closest('.filter').removeClass('active');
    });

    $dom.openBests.on('click', function() {
      $dom.bests.addClass('active');
    });

    $dom.closeBests.on('click', function() {
      $dom.bests.removeClass('active');
    });

    $dom.search.on('submit', function(e) {
      e.preventDefault();
      $dom.tbody.html('<tr><td colspan="4"><div class="findify-component-spinner"></div></td></tr>');
      const formData = $(this).serializeArray();
      globalSearch = formData[0].value;

      const request = createRequest();
      loadProds(request);
    });

    $dom.filterChecks.on('change', function() {
      $dom.tbody.html('<tr><td colspan="4"><div class="findify-component-spinner"></div></td></tr>');

      if( this.checked ) {
        globalFilters[$(this).attr('data-filter-type')][$(this).attr('data-filter')] = true;
      } else {
        globalFilters[$(this).attr('data-filter-type')][$(this).attr('data-filter')] = false;
      }

      const request = createRequest();
      loadProds(request);
    });

    $dom.descSort.on('click', function() {
      if ( $(this).hasClass("sort--up") ) {
        $(this).toggleClass("sort--up sort--down");
        globalSort = [{
          field: 'title',
          order: 'desc'
        }];
      } else {
        $(this).removeClass("sort--down");
        $(this).addClass("sort--up");
        globalSort = [{
          field: 'title',
          order: 'asc'
        }];
      }

      const request = createRequest();
      loadProds(request);
      $dom.priceSort.removeClass("sort--up sort--down");
    });

    $dom.priceSort.on('click', function() {
      if ( $(this).hasClass("sort--up") ) {
        $(this).toggleClass("sort--up sort--down");
        globalSort = [{
          field: 'price',
          order: 'desc'
        }];
      } else {
        $(this).removeClass("sort--down");
        $(this).addClass("sort--up");
        globalSort = [{
          field: 'price',
          order: 'asc'
        }];
      }

      const request = createRequest();
      loadProds(request);
      $dom.descSort.removeClass("sort--up sort--down");
    });

    $(document).on('click', '[data-add-to-cart]', function() {
      const $this = $(this);
      const $text = $('.qs-table__add', $this);
      const varId = $(this).attr('data-variant');
      const itemId = $(this).attr('data-item-id');
      const type = $(this).attr('data-exigo-type');
      const id = $(this).attr('data-exigo-id');
      let properties = {
          "delivery": "One-time Order",
          "qty": "1",
          "type": type,
          "id": id
        };
      properties = Exigo.setPropertyQtys(properties, 1);

      $text.html("Adding");
      CartJS.addItem(varId, 1, properties, {
        "success": function(data, textStatus, jqXHR) {
          $text.html("Added");
          // $('.js-cart-alert').html("Added to Cart. Go to <a class='cart-alert__link' href='/cart'>Cart</a>.").addClass("alert-active alert-success");

          Product.updateNavCart();
          
          setTimeout(function () {
            $text.html("Add");
            // $('.js-cart-alert').removeClass("alert-active alert-success");
          }, 5000);

          Findify.sdk.feedback('click-item', {
            item_id: itemId,
          });

          Findify.sdk.feedback('add-to-cart', {
            item_id: itemId,
            rid: "quick-shop",
            quantity: 1
          });
        },
        "error": function(jqXHR, textStatus, errorThrown) {
            console.log('Error: ' + errorThrown + '!');
        }
      });
    });

    $(document).on('click', '[data-qs-modal]', function() {
      const url = $(this).attr('data-qs-modal');
      const itemID = $('#property__shopify-id').val();
      var kitProd = $.get( url )
        .done(function (response) {
          $dom.body.append(response);
          Product.buildMaterials(window.materials.materials);
          $.getScript("//productreviews.shopifycdn.com/assets/v4/spr.js?shop=puriumcorp.myshopify.com" )
          $('.qs-modal').addClass('open');
          Scroll.lock();

          Findify.sdk.feedback('click-item', {
            item_id: itemID,
          });

          Findify.sdk.feedback('view-page', {
            url: url,
            ref: 'https://ishoppurium.com/collections/quick-shop',
            width: $(document).width(),
            height: $(document).height(),
            item_id: itemID
          });
        });
    });

    $(document).on('click', '[data-qs-modal-close]', function() {
      $('.qs-modal').removeClass('open').delay(400).remove();
      Scroll.unlock();
    });

    $(document).on('click', '.qs-modal', function(e) {
      if ( $(event.target).hasClass('qs-modal') ) {
        $('.qs-modal').removeClass('open').delay(400).remove();
      Scroll.unlock();
      }
    });

    $(window).on('resize', function() {
      if ( $(this).width() >= 768 ) {
        slickRecs();
      }
    });
  };
  
  const init = () => {
    loadFindify();
    cacheDom();
    bindUIActions();
  };

  Quickshop.init = init;
    
})(window.Quickshop = window.Quickshop || {}, jQuery);