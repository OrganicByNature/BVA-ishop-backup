(function (Header, $) {
  "use strict";

  var bindUIActions = function () {

    $('.desktop-header .nav-link-wrapper').on('mouseover', function(){
      $(this).children('.nav-dropdown').stop().addClass('active');
    });

    $('.desktop-header .nav-link-wrapper').on('mouseleave', function(){
      $(this).children('.nav-dropdown').stop().removeClass('active');
    });

    $('.desktop-header .nav-link-wrapper').on('click', function(){
      $(this).children('.nav-dropdown').stop().toggleClass('active');
      $(this).siblings('.nav-link-wrapper').children('.nav-dropdown').stop().removeClass('active');
    });

    $('.desktop-header .dropdown-item a').on('mouseover', function(){
      $(this).parents('.nav-link-wrapper').find('.nav-link__main').addClass('active');
    });

    $('.desktop-header .dropdown-item a').on('mouseleave', function(){
      $(this).parents('.nav-link-wrapper').find('.nav-link__main').removeClass('active');
    });

    $('.mobile-header .nav-link-wrapper .nav-link__main').on('click', function(){
      if($(this).siblings('.nav-dropdown').hasClass('active')){
        $(this).removeClass('active');
        $(this).siblings('.nav-dropdown').removeClass('active');
        $(this).siblings('.nav-arrow').removeClass('active');
      }else{
        $(this).addClass('active');
        $(this).siblings('.nav-dropdown').stop().addClass('active');
        $(this).siblings('.nav-arrow').addClass('active');
      }
    });

    $('.mobile-header .menu-container img').on('click', function(){
      if($(this).parents('.mobile-header').find('.mobile-nav-container').hasClass('active')){
        $(this).parents('.mobile-header').find('.mobile-nav-container').removeClass('active');
      }else{
        $(this).parents('.mobile-header').find('.mobile-nav-container').addClass('active');
      }
    });

    $('.dropdown-item').on('mouseover', function(){
      $(this).stop().addClass('active');
      $(this).children('a').stop().addClass('active')
    });

    $('.dropdown-item').on('mouseleave', function(){
      $(this).stop().removeClass('active');
      $(this).children('a').stop().removeClass('active')
    });
    
    $('.header .fa-search').on('click', function() {
      if($('.search').hasClass('active')) {
        $('.search').removeClass('active');
      } else {
        $('.search').addClass('active');
      }
    });
  };

  var headerNotice = function() {
    if(typeof window.customer != "undefined") {
      var webAliasUrl = window.customer.web_alias;
      var checkWebAlias = $.get('https://purium.sunriseintegration.com/api/affiliate?code='+webAliasUrl)
      .done(function(response) {
        if( response.uses_left == 0 && window.customer.order_count == 0 && window.customer.rank == 18) {
          $('.desktop-header .spend-75').text(window.customer.wa_desktop);
          $('.mobile-header .spend-75').text(window.customer.wa_mobile);
        }
        $('body').addClass('header-notice');
      });
    } else {
      $('body').addClass('header-notice');
    }
  };

  Header.init = function () {
    headerNotice();
    bindUIActions();
  };


}(window.Header = window.Header || {}, jQuery));
