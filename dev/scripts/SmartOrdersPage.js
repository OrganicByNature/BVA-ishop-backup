$(document).on('submit', '.smart-add-to-cart-form', function(e) {
  e.preventDefault();
  var thisVal = $(this).val();
  if (thisVal == 'Smart Order') {
    deliveryText = 'Smart Order';
  } else {
    deliveryText = 'Cart';
  }
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
    const stringProp = $(this)
      .attr('name')
      .replace('properties[', '')
      .replace(']', '');
    formProps[stringProp] = $(this).val();
  });
  formProps = Exigo.setPropertyQtys(formProps, formQty);
  // console.log("formProps", formProps);

  $submitButton.val('Adding...');

  CartJS.addItem(formID, formQty, formProps, {
    success: function(data, textStatus, jqXHR) {
      console.log('in success');
      alertType = 'alert-success';
      alertMessage = 'Added to ' + deliveryText + ". Go to <a class='cart-alert__link' href='/cart'>Cart</a>.";
      Product.updateNavCart();

      // $('.js-cart-alert').html(alertMessage).addClass("alert-active "+alertType);
      $submitButton.val('Add to ' + deliveryText);

      // setTimeout(function () {
      //   $('.js-cart-alert').removeClass("alert-active alert-success alert-error");
      // }, 5000);

      if (location.href.indexOf('quick-shop')) {
        Findify.sdk.feedback('add-to-cart', {
          item_id: $('#property__shopify-id').val(),
          rid: 'quick-shop',
          quantity: 1
        });
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log('in error');
      alertType = 'alert-error';
      alertMessage = 'There was a problem adding this product. Please try again.';

      // $('.js-cart-alert').html(alertMessage).addClass("alert-active "+alertType);
      $submitButton.val('Add to ' + deliveryText);

      setTimeout(function() {
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

const dom = {};
// Global
dom.body = $('body');
dom.window = $(window);
dom.scrollElement = $('.js-scroll-element');

const checkElementVisible = (element, padding, callback) => {
  if ($(element).length) {
    const scrollAmount = dom.window.scrollTop() + dom.window.height() - padding;
    const elementArray = Array.from(document.querySelectorAll(element)).map(item => {
      const elementOffset = $(item).offset().top;
      if (scrollAmount >= elementOffset) {
        return callback(item);
      }
      return item;
    });
  }
};

const runParallax = item => {
  const transform = (dom.window.scrollTop() - $(item).offset().top + dom.window.height()) / 12;
  $(item).css('transform', `translateY(${-transform}px)`);
};

dom.window.on('scroll', () => {
  checkElementVisible('.js-parallax', -20, runParallax);
});
