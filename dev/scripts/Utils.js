(function (UTILS, $, undefined) {
  "use strict";
  const state = {
    customer: null
  }

  function setupCustomerData () {
    const data = $('#customer-metafields').text().trim()
    if (!data.length) return null
    try {
      state.customer = JSON.parse(data)
    } catch (error) {
      console.log(error)
    }
  }
  const optimizedResize = function() {

    var callbacks = [],
        running = false;
  
    // fired on resize event
    function resize() {
      if (!running) {
        running = true;
  
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(runCallbacks);
        } else {
          setTimeout(runCallbacks, 66);
        }
      }
    }
  
    // run the actual callbacks
    function runCallbacks() {
      callbacks.forEach(function(callback) {
        callback();
      });
  
      running = false;
    }
  
    // adds callback to loop
    function addCallback(callback) {
      if (callback) {
        callbacks.push(callback);
      }
    }
  
    return {
      // public method to add additional callback
      add: function(callback) {
        if (!callbacks.length) {
          window.addEventListener('resize', resize);
        }
        addCallback(callback);
      }
    }
  
  };
  
  UTILS.isTouch = function () {
    var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
    var mq = function(query) {
      return window.matchMedia(query).matches;
    }
    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
      return true;
    }
    var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
    return mq(query);
  };

  UTILS.isBreakpointSm = () => window.innerWidth <= 480
  UTILS.isBreakpointMd = () => window.innerWidth <= 767
  UTILS.isMinBreakpoint = (minSize = 0) => window.innerWidth > minSize
  UTILS.pricify = (num, noDecimal = false) => "$" + parseFloat(Math.floor(num * 100) / 100).toFixed(noDecimal ? 0 : 2)

  UTILS.getCustomerPrice = (price, customer = state.customer, isBigSpender = false) => !customer ? price : (isBigSpender ? 0.75 : customer.discount) * price
  UTILS.isCustomer = () => !!state.customer

  UTILS.getProductColorClasses = productTags => productTags.map(tag => {
    if ( tag.toLowerCase().indexOf("coll::") >= 0 ) {
      return "coll--" + tag.toLowerCase().replace("zcoll::", "").replace("coll::", "").replace(" ", "-");
    }
  }).join(" ")

  UTILS.optimizedResize = optimizedResize()

  UTILS.getQueryVariable = (variable) => {
    const query = window.location.search.substring(1);
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) == variable) {
        return decodeURIComponent(pair[1]);
      }
    }
    return null
  }

  UTILS.getImageOfSize = (imageURl, size) => {
    const ext = imageURl.substr(imageURl.lastIndexOf('.') + 1)
    return imageURl.replace(`.${ext}`, `_${size}.${ext}`)
  }

  UTILS.wait = (timeout = 500) => {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout)
    })
  }


  UTILS.init = () => {
    setupCustomerData()
  }

}(window.UTILS = window.UTILS || {}, jQuery));
