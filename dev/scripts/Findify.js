((Findify, $) => {

  let analytics;
  
  const init = () => {
    analytics = FindifyAnalytics({
      key: '1dc06848-99d3-4778-943e-b14902310b0b'
    });
    analytics.initialize();

    Findify.sdk = FindifySDK.init({
      key: '1dc06848-99d3-4778-943e-b14902310b0b',
      user: analytics.user,
      timeout: 90000
    });

    Findify.sdk.feedback('view-page', {
      url: 'https://ishoppurium.com/collections/quick-shop',
      ref: document.referrer,
      width: $(document).width(),
      height: $(document).height()
    });
  };

  Findify.init = init;
    
})(window.Findify = window.Findify || {}, jQuery);