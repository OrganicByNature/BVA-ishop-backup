(function(SmartOrders, $, undefined) {
  'use strict';

  var rawProps, props, page, paymentData, orderData;
  let hasExistingOrder = false;

  // country is a new requirement after the endpoint update, any change to an existing order requires
  // the enrty of user's country
  let currentAddressValid = false;

  const BASE_URL = 'https://shopify-smartordersync.azurewebsites.net/api';

  const orderEndpoint = window.customer ? `${BASE_URL}/smart-order/${window.customer.id}` : '';
  const paymentEndpoint = window.customer ? `${BASE_URL}/payment-token/${window.customer.id}` : '';

  const getOrder = () => $.get(orderEndpoint);
  const cancelOrder = () => $.ajax({ url: orderEndpoint, type: 'DELETE' });

  // submitOrder (payload, type -> optional. defaults to JSON)
  const submitOrder = (data, type) => {
    // basic JSON request
    const requestData = {
      url: orderEndpoint,
      type: 'PUT',
      data: data
    }

    // multipart request properties
    if (type === 'multipart') {
      requestData.enctype = 'multipart/form-data';
      requestData.processData = false;
      requestData.contentType = false;
    }

    // creates or updates order, depending on data
    return $.ajax(requestData);
  };

  const getPaymentToken = () => $.get(paymentEndpoint);
  const submitPaymentToken = (data) => {
    return $.ajax({
      url: paymentEndpoint,
      type: 'PUT',
      data: data,
      enctype: 'multipart/form-data',
      processData: false,
      contentType: false
    });
  };

  var pageIs = function() {
    if ($('.so__current').length) {
      page = 'curr';
    } else if ($('.so__billing').length) {
      page = 'bill';
    } else if ($('.so__add-item').length) {
      page = 'add';
    } else if ($('.so__payment').length) {
      page = 'pay';
    } else if ($('.so__delivery').length) {
      page = 'deliver';
    } else if ($('.so__product').length) {
      page = 'prod';
    } else if ($('.so__review').length) {
      page = 'rev';
    } else if ($('.so__shipping').length) {
      page = 'ship';
    }
  };

  var orderCheck = function() {
    getOrder().done(function(res) {
      const data = JSON.parse(res);
      if (typeof data.start_date != 'undefined') {
        $('.so__current--none, .so__delivery--none').hide();
        $('.so__current--order, .so__delivery--filled').show();
        orderFill(data);
      } else {
        $('.so__current--order, .so__delivery--filled').hide();
        $('.so__current--none, .so__delivery--none').show();
      }
      orderData = data;
    });
  };

  var populateDataByPage = function(isValid) {
    if (!isValid) {
      if (page == 'bill') {
        $('.so__billing--filled').hide();
        $('.so__billing--none').show();
      }
    } else {
      if (page == 'curr' || page == 'deliver') {
        addressFill(orderData);
        $('.so__complete--one').show();
      } else if (page == 'bill') {
        populate('payment', paymentData, true);
      } else if (page == 'ship') {
        populate('shipping', orderData, false);
        // populate('shipping', orderData, true);
      } else if (page == 'rev') {
        populate('payment', paymentData, true);
        populate('shipping', orderData, true);
      } else if (page == 'add') {
        $('.so__add-item--none').hide();
        $('.so__add-item--shop').show();
      } else if (page == 'pay') {
        populate('payment', paymentData, false);
        populate('shipping', orderData, false);
        $('[name="ccnumber"]').attr('placeholder', 'Current card ends in ' + paymentData.last4);
      }
    }
    return true;
  };

  var fetchAndPopulatePayment = function() {
    return new Promise((resolve, reject) => {
      getPaymentToken()
        .done(function(res) {
          const data = JSON.parse(res);
          paymentData = data;
          const isValid = !!data.last4;
          populateDataByPage(isValid);
          resolve();
        })
        .fail((e) => {
          reject();
        });
    });
  };

  var fetchAndPopulateOrder = function() {
    return new Promise((resolve, reject) => {
      getOrder()
        .done(function(res) {
          const data = JSON.parse(res);
          orderData = data;
          const isValid = !!data.address1;
          populateDataByPage(isValid);
          resolve();
        })
        .fail((e) => {
          console.log('fetch error', e);
          reject();
        });
    });
  };

  var addSuccessCheck = function() {
    var successItem = localStorage.getItem('sendSmartOrderSuccess');
    if (successItem != null) {
      $('.success-item').text(successItem);
      Modal.show('add-success');
      localStorage.removeItem('sendSmartOrderSuccess');
    }
  };

  var changeStates = function($elem) {
    var states = $elem.find(':selected').data('states');
    var $stateSelect = $('[data-state]');

    $stateSelect.html('');

    for (var i in states) {
      $stateSelect.append('<option value="' + states[i][0] + '">' + states[i][1] + '</option>');
    }
  };

  var addressFill = function(address) {
    for (var part in address) {
      if (typeof address[part] == 'undefined' || typeof address[part] == 'null' || typeof address[part] == 'object') {
        address[part] == '';
      }
    }

    var finalAddress = address.address1 + ' ' + address.address2 + ', ' + address.city + ', ' + address.state + ' ' + address.zip;
    $('.so__current-ships-to, .so__delivery-ships-to').html(finalAddress);
  };

  var orderFill = function(order) {
    var template;
    var items = order.line_items;
    var year = parseFloat(order.start_date.substring(0, 4));
    var month = parseFloat(order.start_date.substring(5, 7));
    var day = parseFloat(order.start_date.substring(8, 10));
    var nextDate = new Date();
    var date = new Date();
    var formattedDate;
    var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var subTotal = 0;

    nextDate.setFullYear(year, month - 1, day);

    if (nextDate.getTime() < date) {
      nextDate.setFullYear(date.getFullYear(), date.getMonth(), day);

      if (date.getDate() > day) {
        nextDate.setMonth(nextDate.getMonth() + 1, day);
      }
    }

    if (page == 'curr') {
      formattedDate = dayNames[nextDate.getDay()] + ', ' + monthNames[nextDate.getMonth()] + ' ' + nextDate.getDate();
      for (var i = 0; i < items.length; i++) {
        items[i].material_names = typeof items[i].material_names != 'undefined' ? items[i].material_names : '';
        var editButton =
          typeof items[i].prod_url != 'undefined' ? '<a class="item__cell-link" data-smart-order href="' + items[i].prod_url + '">Edit</a>' : '';
        template =
          '<div class="item">' +
          '<div class="item-head">' +
          '<p class="item__header item__header--product">Product</p>' +
          '<p class="item__header item__header--amount">Amount</p>' +
          '<p class="item__header item__header--price">Unit Price</p>' +
          '<p class="item__header item__header--frequency">Frequency</p>' +
          '<p class="item__header item__header--next">Next Charge Date</p>' +
          '<p class="item__header item__header--edit"></p>' +
          '</div>' +
          '<div class="item-data">' +
          '<p class="item__cell item__cell--product"><span class="item__cell-product-title">' +
          items[i].title +
          '</span><span class="item__cell-product-props">' +
          items[i].material_names +
          '</span></p>' +
          '<p class="item__cell item__cell--amount">' +
          parseInt(items[i].quantity) +
          '</p>' +
          '<p class="item__cell item__cell--price">$' +
          items[i].price_each +
          '</p>' +
          '<p class="item__cell item__cell--frequency">1 month</p>' +
          '<p class="item__cell item__cell--next">' +
          formattedDate +
          '</p>' +
          '<p class="item__cell item__cell--edit">' +
          editButton +
          '<a class="item__cell-link" href="javascript:;" data-smart-cancel>Cancel</a></p>' +
          '</div>' +
          '</div>';
        $('.so__current-table').append(template);
      }
    } else if (page == 'deliver') {
      for (var i = items.length - 1; i >= 0; i--) {
        template = '<div class="so__delivery-prod">' + parseInt(items[i].quantity) + 'x ' + items[i].title + '</div>';
        $('.so__delivery-products').append(template);
      }
      for (var i = 0; i < 6; i++) {
        $('.so__delivery-upcoming').append(
          '<p class="so__delivery-date">' + monthNames[nextDate.getMonth()] + ' ' + nextDate.getDate() + ', ' + nextDate.getFullYear() + '</p>'
        );
        nextDate.setMonth(nextDate.getMonth() + 1, nextDate.getDate());
      }
    }

    for (var i = order.line_items.length - 1; i >= 0; i--) {
      subTotal += parseFloat(order.line_items[i].price_each) * parseFloat(order.line_items[i].quantity);
    }
    $('.so__current-total-price').text('$' + subTotal.toFixed(2));
    $('.so__current-bv-amount').text(order.business_volume);
  };

  var reviewFill = function() {
    var $subTitle = $('.pdp-info__sub-title'),
      formatted;
    $('.so__smart-qty').append(props.quantity);

    for (var prop in props) {
      if (prop.indexOf('properties[selected-') > -1) {
        if ($subTitle.text() == '') {
          formatted = props[prop].split('(x')[0];
        } else {
          formatted = ', ' + props[prop].split('(x')[0];
        }
        $subTitle.append(formatted);
      }
    }
  };

  var populate = function(key, data, isText) {
    for (var i in data) {
      if (typeof data[i] != 'undefined' && typeof data[i] != 'null' && typeof data[i] != 'object') {
        const $textField = $('[data-so-' + key + '="' + i + '"]');
        if ($textField && $textField.length) $textField.text(data[i]);

        const $inputField = $('[name="' + key + '[' + i + ']"]');
        if ($inputField && $inputField.length) $inputField.val(data[i]);
      }
    }
  };

  const setErrorState = (message = null) => {
    const defaultMessage = 'There was an error saving your settings. Please enter all fields and try again.';
    const displayMessage = message ? message : defaultMessage;
    Exigo.alert($('.smart-order-error'), displayMessage);
    window.scrollTo(0, 0);
  };

  var savePayment = function() {
    var currency = window.customer.currency,
      $this = $('[data-save-payment]'),
      paymentFname = $('#Payment-Fname').val(),
      paymentLname = $('#Payment-Lname').val(),
      paymentNumber = $('#Payment-Number').val(),
      paymentMonth = $('#Payment-Month').val(),
      paymentYear = $('#Payment-Year').val(),
      paymentAddress1 = $('#Payment-Address1').val(),
      paymentAddress2 = $('#Payment-Address2').val(),
      paymentCity = $('#Payment-City').val(),
      paymentCountry = $('#Payment-Country').val(),
      paymentState = $('#Payment-State').val(),
      paymentZip = $('#Payment-Zip').val();

    if (paymentMonth.length === 1) paymentMonth = '0' + paymentMonth;

    // set up FormData object for multipart/form-data request
    const paymentFormData = new FormData();
    paymentFormData.set('first_name', paymentFname);
    paymentFormData.set('last_name', paymentLname);
    paymentFormData.set('number', paymentNumber);
    paymentFormData.set('month', paymentMonth);
    paymentFormData.set('year', paymentYear);
    paymentFormData.set('country', paymentCountry);
    paymentFormData.set('state', paymentState);
    paymentFormData.set('city', paymentCity);
    paymentFormData.set('address1', paymentAddress1);
    paymentFormData.set('address2', paymentAddress2);
    paymentFormData.set('zip', paymentZip);

    $this.text('Saving...');

    if ($('#Payment-Number').val().length > 0) {
      submitPaymentToken(paymentFormData)
        .done(function(response) {
          // when the mock DB is used for testing,
          // a longer wait is required to get accurate data after submission
          setTimeout(() => {
            $this.text('Success!');
            setTimeout(() => {
              window.location.href = "/account?view=billing";
            }, 1000);
          }, 0); // use 8+ seconds if on mock DB
        })
        .fail((e) => {
          console.log('order submission error:', e);
          setErrorState();
          $this.text('Save');
        });
    } else {
      setErrorState('Please fill out all fields');
    }
  };

  const parseShippingForm = () => {
    return {
      first_name: $('#Shipping-First_Name').val(),
      last_name: $('#Shipping-Last_Name').val(),
      address1: $('#Shipping-Address1').val(),
      address2: $('#Shipping-Address2').val(),
      city: $('#Shipping-City').val(),
      country: $('#Shipping-Country').val(),
      state: $('#Shipping-State').val(),
      zip: $('#Shipping-Zip').val(),
      phone: $('#Shipping-Phone').val(),
    };
  };

  var saveShipping = function() {
    var currency = window.customer.currency,
      $this = $('[data-save-shipping]');
    const shippingData = parseShippingForm();

    const newOrderData = {
      ...orderData,
      ...shippingData,
      currency: currency,
    };

    const orderRequest = {
      header: {
        first_name: newOrderData.firstName,
        last_name: newOrderData.lastName,
        existing: newOrderData.smart_order_id,
        start_date: newOrderData.start_date,
        first_name: newOrderData.first_name,
        last_name: newOrderData.last_name,
        address1: newOrderData.address1,
        address2: newOrderData.address2,
        city: newOrderData.city,
        country: newOrderData.country,
        state: newOrderData.state,
        zip: newOrderData.zip,
      },
      line_items: newOrderData.line_items,
    };

    $this.text('Saving...');
    submitOrder({ order: orderRequest })
      .done(function({ Response: response }) {
        if (!response.includes('fault')) {
          $this.text('Success!');
          // setTimeout(() => {
          //   window.location.href = '/account?view=smart-order';
          // }, 1500);
        } else {
          console.log('order submission error:', response);
          setErrorState();
        }
      })
      .fail(() => {
        console.log('order submission error:', response);
        setErrorState();
        $this.text('Save');
      });
  };

  var getProps = function() {
    rawProps = JSON.parse(localStorage.getItem('smartProduct'));
    props = {};

    for (var i = rawProps.length - 1; i >= 0; i--) {
      props[rawProps[i].name] = rawProps[i].value;
    }
  };

  var removeItem = function(index) {
    var currOrder = orderData;
    var $item = $('.item').eq(index);

    $item
      .find('[data-smart-cancel]')
      .text('Cancelling...')
      .css({ 'pointer-events': 'none', color: '#D1D3C7' });

    // remove item at target index
    currOrder.line_items.splice(index, 1);

    var newData = currOrder;

    // if last item removed, cancel entire order
    if (currOrder.line_items.length == 0) {
      cancelOrder().done(function(response) {
        $item.addClass('removed');
        $item.find('.item__cell--product').append('<span class="so__cancelled">Cancelled</span>');
        Modal.show('item-cancelled');
        $item.find('[data-smart-cancel]').text('Cancel');
      });
    } else {  // remove target item from order
    // despite what the docs say about multipart, only JSON will submit successfully
      const cancelData = {
        order: {
          header: {
            first_name: currOrder.first_name,
            last_name: currOrder.last_name,
            address1: currOrder.address1,
            address2: currOrder.address2,
            start_date: currOrder.start_date,
            country: currOrder.country,
            city: currOrder.city,
            state: currOrder.state,
            zip: currOrder.zip,
            existing: currOrder.smart_order_id
          },
          line_items: currOrder.line_items
        }
      }

      // CANCEL ITEM
      $.ajax({
        url: orderEndpoint,
        type: 'PUT',
        data: cancelData
      }).done(function(response) {
        $item.addClass('removed');
        $item.find('.item__cell--product').append('<span class="so__cancelled">Cancelled</span>');
        Modal.show('item-cancelled');
        $item.find('[data-smart-cancel]').text('Cancel');
        orderData = newData;
      });
    }
  };

  var updateTotal = function() {
    getOrder().done(function(response) {
      var subTotal = 0;
      if (typeof response.total != 'undefined') {

        for (var i = response.line_items.length - 1; i >= 0; i--) {
          subTotal += Number(response.line_items[i].price_total);
        }

        $('.so__current-total-price').text('$' + subTotal.toFixed(2));
        $('.so__current-bv-amount').text(response.business_volume);
      } else {
        $('.so__current-total-price').text('$0.00');
        $('.so__current-bv-amount').text('0.00');
      }
      Modal.hide();
    });
  };

  var saveDate = function() {
    var order = {
      order: {
        start_date: '',
        line_items: [],
      },
    };
    var month = $('#Delivery-Month').val();
    var day = $('#Delivery-Day').val();
    var year = $('#Delivery-Year').val();
    var todaysDate = new Date().getTime();
    var enteredDate = new Date(parseFloat(year), parseFloat(month) - 1, parseFloat(day), 23, 59, 59, 999).getTime();

    $('.so__save').text('Saving...');

    if (enteredDate > todaysDate) {
      order.order.start_date = year + '-' + month + '-' + day;
      order.order.line_items = orderData.line_items;
      for (var i = order.order.line_items.length - 1; i >= 0; i--) {
        order.order.line_items[i].item_code = order.order.line_items[i].item_code;
        order.order.line_items[i].price = parseFloat(order.order.line_items[i].price);
        order.order.line_items[i].quantity = parseFloat(order.order.line_items[i].quantity);
      }

      var sendDate = $.ajax({
        url: 'https://shopify-smartordersync.azurewebsites.net/api/smart-date/' + window.customer.id,
        type: 'PUT',
        data: '{\n   \"start_date\" : '+ enteredDate +'\n}',
        dataType:  'json',
      })
        .done(function(response) {
          console.log('response', response);
          $('.so__save').text('Save');
          window.location.href = '/account?view=delivery';
        })
        .fail(function(response) {
          console.log('fail sendOrder');
          console.log('response', response);
          console.log('response', response.responseText);
        });
    } else {
      $('.account__edit-error').text('Please enter date starting or after today');
      $('.so__save').text('Save');
    }
  };

  var addToSmartOrder = function() {
    $('.add-to-cart-button')
      .val('Adding...')
      .prop('disabled', true);
    let newOrder = {
      header: {},
      line_items: [],
    };

    if (hasExistingOrder) {
      newOrder.header = {
        first_name: orderData.first_name,
        last_name: orderData.last_name,
        start_date: orderData.start_date,
        address1: orderData.address1,
        address2: orderData.address2,
        city: orderData.city,
        country: orderData.country,
        state: orderData.state,
        zip: orderData.zip,
        phone: orderData.phone,
      };

      newOrder.line_items = orderData.line_items;
    }

    const newProd = {
      title: props.title,
      price: parseFloat(props.price),
      quantity: parseFloat(props.quantity),
      item_code: props.id,
      prod_url: props.prod_url,
      materials: {},
    };

    let propVal;
    let date;
    let day;

    // processing new product props
    for (var prop in props) {
      if (prop.indexOf('properties[selected-') > -1) {
        if (typeof newProd.material_names != 'undefined') {
          newProd.material_names = newProd.material_names + ', ' + props[prop];
        } else {
          newProd.material_names = props[prop];
        }
      } else if (prop.indexOf('properties[') > -1) {
        propVal = props[prop].replace('[', '').replace(']', '');
        prop = prop.replace('properties[', '').replace(']', '');
        newProd.materials[prop] = propVal;
      }
    }

    newOrder.line_items.push(newProd);

    // add to existing order if possible
    if (hasExistingOrder) {
      newOrder.header.existing = orderData.smart_order_id;
    }

    // pull shipping data from the form revealed to the user in handleReviewPage()
    if (!currentAddressValid) {
      const shippingData = parseShippingForm();
      newOrder.header = {
        ...newOrder.header,
        ...shippingData,
      };
    }

    if (!hasExistingOrder) {
      date = new Date();
      day = date.getDate();
      if (day > 20) {
        date.setMonth(date.getMonth() + 1, 20);
      } else {
        date.setMonth(date.getMonth() + 1, day);
      }
      date = date.toISOString().substring(0, 10);
      newOrder.header.start_date = date;
    }

    for (var i = newOrder.line_items.length - 1; i >= 0; i--) {
      newOrder.line_items[i].quantity = parseFloat(newOrder.line_items[i].quantity)
        .toFixed(2)
        .toString();

      if (newOrder.line_items[i].price) {
        newOrder.line_items[i].price = parseFloat(newOrder.line_items[i].price)
          .toFixed(2)
          .toString();
      }
    }

    submitOrder(newOrder)
      .done((res) => {
        $('.add-to-cart-button').val('Success!');
        setTimeout(() => window.location.href = '/account?view=smart-order', 3000);
      })
      .fail(function(response) {
        console.log('response', response);
      });
  };

  const handleReviewPage = async () => {
    $('[data-review-shipping-form]').hide();

    getProps();
    reviewFill();
    await fetchAndPopulatePayment();
    if (typeof paymentData.customer_id == 'undefined') {
      // window.location.href = "/account?view=billing";
      // return;
    }

    await fetchAndPopulateOrder();
    hasExistingOrder = !!orderData.exigo_id && !!orderData.exigo_id.length;
    currentAddressValid = !!orderData.country && !!orderData.country.length;

    if (!hasExistingOrder || !currentAddressValid) {
      $('[data-review-shipping-form]').show();
      $('[data-review-shipping-summary]').hide();
    }

  };

  var bindUIActions = function() {
    // Smart order sub nav
    $('.so__nav .active').on('click', function() {
      $(this)
        .parent()
        .toggleClass('open');
    });

    // Line Item dropdowns
    $('.so__current-table').on('click', '.item__header:first-child, .item__cell:first-child', function() {
      var $parent = $(this).parents('.item');
      $('.item__header, .item__cell', $parent).toggleClass('open');
    });

    // States for Smart Order Address
    $('[data-country]').on('change', function() {
      changeStates($(this));
    });

    // Save Payment Info
    $('[data-save-payment]').on('click', function() {
      savePayment();
    });

    // Save Shipping Info
    $('[data-save-shipping]').on('click', function() {
      saveShipping();
    });

    // Close sort
    $('.so__add-item .filter-btn').on('click', function() {
      var sortWrap = $(this)
        .parents('.so__sort')
        .find('.mixup-title');
      Quickshop.toggleSort(sortWrap);
    });

    // Review and Confirm Product
    $('[data-add-to-confirm]').on('submit', function(e) {
      e.preventDefault();
      var formData = JSON.stringify($(this).serializeArray()),
        prodUrl = $('.so__smart-order-submit').data('href');

      localStorage.removeItem('smartProduct');
      localStorage.setItem('smartProduct', formData);
      window.location.href = prodUrl;
    });

    // Add to Order
    $('[data-add-to-smart]').on('submit', function(e) {
      e.preventDefault();
      addToSmartOrder();
    });

    // Cancel Item
    $('body').on('click', '[data-smart-cancel]', function() {
      var index = $(this)
        .parents('.item')
        .index();
      removeItem(index);
    });

    // Close Cancel
    $('[data-close-cancel]').on('click', function() {
      updateTotal();
    });

    // Open Edit Delivery
    $('[data-edit-delivery]').on('click', function() {
      $(this).hide();
      $('.so__delivery-edit').show();
    });

    // Save Delivery
    $('[data-save-delivery]').on('submit', function(e) {
      e.preventDefault();
      saveDate();
    });

    // Cancel Delivery
    $('[data-cancel-delivery]').on('click', function() {
      $('.so__delivery-edit').hide();
      $('[data-edit-delivery]').show();
    });
  };

  SmartOrders.init = function() {
    pageIs();

    if (page == 'curr' || page == 'deliver') {
      orderCheck();
    } else if (page === 'bill' || page === 'add' || page === 'pay' || page === 'ship') {
      fetchAndPopulateOrder();
      fetchAndPopulatePayment();
    }

    if (page == 'add') {
      addSuccessCheck();
    }

    if (page == 'rev') {
      handleReviewPage();
    }

    bindUIActions();
  };
})((window.SmartOrders = window.SmartOrders || {}), jQuery);
