(function (SweetToothHelper, $) {
  "use strict";

  const DOM = {
    rewardPointsCount: '[sweetooth-rewards]',
    panelToggles: '[sweetooth-toggle-panel]'
  }

  const state = {
    customer: null
  }
  
  const setCustomerListener = () => {
    $(document).on('sweettooth-ready', function(e) {
      SweetTooth.subscribe('customer-ready', function() {
        SweetTooth.fetchCustomer().then(function(customer) {
          updateCustomer(customer)
        })
      })
    })
  }

  const updateCustomer = (customer = null) => {
    state.customer = customer

    if (state.customer) SweetToothHelper.renderRewardPoints()
  }

  SweetToothHelper.renderRewardPoints = () => {
    if (!state.customer) return null
    $(DOM.rewardPointsCount).html(state.customer['points_balance'])
  }

  SweetToothHelper.init = function () {
    setCustomerListener()
  };

}(window.SweetToothHelper = window.SweetToothHelper || {}, jQuery));
