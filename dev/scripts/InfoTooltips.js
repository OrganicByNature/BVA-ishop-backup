(function (InfoTooltips, $, undefined) {
  "use strict";

  const dom = {
    tooltipWrapper: '[infotooltip]',
    tooltipToggle: '[infotooltip-toggle]',
    tooltipContainer: '[infotooltip-container]',
    tooltipMessage: '[infotooltip-tip]',
    tooltipClose: '[infotooltip-close]',
    lastOpenTooltip: null
  }

  var bindUIActions = function () {
    if (!UTILS.isTouch()) {
      $(document).on('mouseenter', dom.tooltipToggle,function (event) {
        InfoTooltips.openTooltip( $(this).closest(dom.tooltipWrapper) )
      });
  
      $(document).on('mouseleave', `${dom.tooltipWrapper}`, function (event) {
        InfoTooltips.closeTooltip()
      });

      $(document).on('click', `${dom.tooltipClose}`, function (event) {
        InfoTooltips.closeTooltip()
      });

    } else {

      $(document).on('click.infoTooltip', function (event) {
        const currentTarget = $(event.target)

        if (currentTarget.is(dom.tooltipToggle) || currentTarget.parent().is(dom.tooltipToggle)) {
          InfoTooltips.openTooltip( currentTarget.closest(dom.tooltipWrapper) )
        } else {
          if (currentTarget.is(dom.tooltipClose) || currentTarget.parents().is(dom.tooltipClose)) return InfoTooltips.closeTooltip()
          if (currentTarget.is(dom.tooltipMessage) || currentTarget.parents().is(dom.tooltipMessage)) return 
          InfoTooltips.closeTooltip()
        }
      });

    }
  };

  InfoTooltips.openTooltip = function (container) {
    container.addClass('is-open')
    dom.lastOpenTooltip = container

    const tooltipContainer = container.find(dom.tooltipContainer)
    const message = container.find(dom.tooltipMessage)

    TweenLite.set(tooltipContainer, { opacity: 0, display: 'block' })
    TweenLite.set(message, { opacity: 0, y: 10 })

    TweenLite.to(tooltipContainer, 0.2, { opacity: 1 })
    TweenLite.to(message, 0.3, { opacity: 1, y: 0 })
  }

  InfoTooltips.closeTooltip = function (container = null) {
    if (!container) {
      $(dom.lastOpenTooltip).removeClass('is-open')
    } else {
      container.removeClass('is-open')
    }
    if (!dom.lastOpenTooltip) return null
    const tooltipContainer = dom.lastOpenTooltip.find(dom.tooltipContainer)
    const message = dom.lastOpenTooltip.find(dom.tooltipMessage)
    dom.lastOpenTooltip = null

    TweenLite.to(message, 0.2, { opacity: 0, y: 10 })
    TweenLite.to(tooltipContainer, 0.2, { 
      delay: 0.3, 
      opacity: 0,
      onComplete: () => {
        TweenLite.set([message, tooltipContainer], { clearProps: 'all' })
      }
    })

  };

  InfoTooltips.init = function () {
    bindUIActions();
  };

}(window.InfoTooltips = window.InfoTooltips || {}, jQuery));
