(function (InlineCart, $) {
  // $(document).on('shopify:section:load', (event) => {
  //   state.upsellsInitialised = false
  //   state.upsellCollectionPage = 1

  //   $(document).off('cart.requestComplete')
  //   $DOM.upsellsContainer.off('click')
  //   $(document).off('click', DOM.cartToggle, toggleCart)
  //   $DOM.backdrop.off('click')
  //   $DOM.cart.off()

  //   InlineCart.init()
  // })

  "use strict";

  const handleize = str => {
    return str.toLowerCase().replace(/[^\w\u00C0-\u024f]+/g, "-").replace(/^-+|-+$/g, "");
  };

  const RANKS = {
    18: 'GUEST',

    // 15% then 25% for 25000
    19: 'RETURNING_CUSTOMER',
    20: 'RETURNING_CUSTOMER',

    // 25%
    2: 'LOYAL_CUSTOMER',
    12: 'LOYAL_CUSTOMER',
    15: 'LOYAL_CUSTOMER',
    21: 'LOYAL_CUSTOMER',
    22: 'LOYAL_CUSTOMER',

    //30%
    4: 'PERCENT30',
    5: 'PERCENT30',
    6: 'PERCENT30',
    7: 'PERCENT30',
    8: 'PERCENT30',
    13: 'PERCENT30',

    // 35%
    23: 'PROFESSIONAL',
    24: 'PROFESSIONAL',
    25: 'PROFESSIONAL',
    10: 'PROFESSIONAL'
  }

  const DISCOUNT_MULTIPLIER = 1.11765

  const DISCOUNT_LIMITS = {
    GIFTCARD_DISCOUNT: 5000,
    GIFTCARD_LIMIT: 7500,
    GUEST: {
      LIMIT: 15000,
      DISCOUNT: 0.25,
      FAIL_DISCOUNT: 0.25
    },
    RETURNING_CUSTOMER: {
      LIMIT: 25000,
      DISCOUNT: 0.25,
      FAIL_DISCOUNT: 0.15
    },
    LOYAL_CUSTOMER: {
      LIMIT: 0,
      DISCOUNT: 0.25,
      FAIL_DISCOUNT: 0.25
    },
    PERCENT30: {
      LIMIT: 0,
      DISCOUNT: 0.30,
      FAIL_DISCOUNT: 0.30
    },
    PROFESSIONAL: {
      LIMIT: 0,
      DISCOUNT: 0.35,
      FAIL_DISCOUNT: 0.35
    }
  }

  class UnlockedNotices {
    constructor ($wrapper) {
      this.$wrapper = $wrapper
      this.notices = {}
      this.visibleNoticesCount = 0
    }

    createNotice (message) {
      return $(`<div><span>${message}</span></div>`)
    }

    async notice (message = null, key) {
      if (this.notice[key]) return null
      const $notice = this.createNotice(message)
      this.notice[key] = $notice
      await UTILS.wait(200)
      TweenLite.from($notice, 0.2, { height: 0 })
      this.$wrapper.prepend($notice)
      const delay =  (this.visibleNoticesCount * 2000) + 2000
      this.visibleNoticesCount += 1
      await UTILS.wait(delay)
      if (this.visibleNoticesCount > 0) this.visibleNoticesCount -= 1
      TweenLite.to($notice, 0.5, {
        height: 0,
        delay: 0.5,
        onComplete: () => $notice.hide()
      })
    }

    remove (key) {
      if (this.notice[key]) {
        this.notice[key].remove()
        delete this.notice[key]
      }

      if (this.notice['all']) {
        this.notice['all'].remove()
        delete this.notice['all']
      }
    }

    allNotices () {
      if (this.notice['all']) return null
      Object.keys(this.notice).forEach((noticekey) => noticekey != 'all' && this.remove(noticekey))
      this.notice('All Perks Unlocked', 'all')
    }
  }

  class DiscountsManager {
    constructor ($wrapper, parentState = {}, cart = null) {
      this.$wrapper = $wrapper
      this.noticesManager = parentState.unlockNotices
      this.parentState = parentState
      this.cart = cart
      this.notices = {}
      this.rewardCards = {}
      this.unlockedAwards = {}
      this.addMoreNoticeEnabled = false
      this.state = {
        customer: parentState.customer,
        freeShippingAt: 25000
      }
      this.init()
    }

    init () {
      if (this.parentState.freeShippingThreshold) {
        this.state.freeShippingAt = this.parentState.freeShippingThreshold * 100
      }
    }

    getRewardCardDOM (key) {
      switch (key) {
        case 'gift_card': return $(`<div class="reward-card"><span>${UTILS.pricify(DISCOUNT_LIMITS.GIFTCARD_DISCOUNT/100, true)} Gift Card</span></div>`)
        case 'free_shipping': return $('<div class="reward-card"><span>Free Shipping</span></div>')
        case 'discounts': return $(`<div class="reward-card"><span>${DISCOUNT_LIMITS[this.customerKind]['FAIL_DISCOUNT'] * 100}% Off</span></div>`)
        case 'returning_customer': return $(`<div class="reward-card"><span>${DISCOUNT_LIMITS[this.customerKind]['DISCOUNT'] * 100}% Off</span></div>`)
        default: return null
      }
    }

    get rewardsList () {
      const rewards = []
      if (!this.isCustomer) rewards.push('gift_card')
      if (this.isCustomer) {
        rewards.push('discounts')
        if (this.hasUpsell) {// level 1 customer/ returning
          rewards.push('returning_customer')
        }
      } else {
        rewards.push('discounts')
      }

      rewards.push('free_shipping')
      return rewards
    }

    renderRewardsBar ($rewardsBar) {
      const rewardCards = {}
      this.rewardsList.forEach((reward_id) => {
        rewardCards[reward_id] = this.getRewardCardDOM(reward_id)
        $rewardsBar.append(rewardCards[reward_id])
      })
      this.rewardCards = rewardCards
    }
    get freeShippingAt () {
      return this.state.freeShippingAt
    }

    hasFreeShipping () {
      const targetTotal = this.hasUpsell ? this.futureDiscountSubtotal : this.currentSubtotal
      return targetTotal >= this.freeShippingAt
    }

    get forFreeShipping () {
      const targetTotal = this.hasUpsell ? this.futureDiscountSubtotal : this.currentSubtotal
      if (targetTotal >= this.freeShippingAt) return 0
      return this.freeShippingAt - targetTotal
    }

    update (cart, render = true) {
      this.lastUnlockedRewards = this.unlockedRewardsList

      this.cart = cart
      if (render) this.render()
    }

    get originalTotal () {
      return this.cart.original_total_price
    }

    get savings () {
      return this.originalTotal - this.currentSubtotal
    }

    get currentSubtotal () {
      if (this.isCustomer) {
        return this.originalTotal * (1 - this.currentDiscount)
      } else {
        return (this.originalTotal - this.giftCard) * (1 - this.currentDiscount)
      }
    }

    get futureDiscountSubtotal () {
      if (this.hasUpsell) {
        const discountAmount = this.originalTotal * (1 - DISCOUNT_LIMITS[this.customerKind]['DISCOUNT'])
        return discountAmount
      }
      return this.currentSubtotal
    }

    get isCustomer () {
      if (this.state.customer == null) {
        return false
      }

      return this.state.customer && this.state.customer.order_count >= 1
    }

    get getsGiftCard () {
      return !(this.isCustomer || this.currentDiscount !== 0)
    }

    get giftCard () {
      if (!this.getsGiftCard) {
        return 0
      }

      if (this.originalTotal >= DISCOUNT_LIMITS.GIFTCARD_LIMIT) {
        return DISCOUNT_LIMITS.GIFTCARD_DISCOUNT
      }
      return 0
    }

    get giftCardUnlocked () {
      if (this.isCustomer) return false
      return this.originalTotal >= DISCOUNT_LIMITS.GIFTCARD_LIMIT
    }

    get forGiftCard () {
      if (this.currentSubtotal >= DISCOUNT_LIMITS.GIFTCARD_LIMIT) return 0
      return DISCOUNT_LIMITS.GIFTCARD_LIMIT - this.currentSubtotal
    }

    get customerRank () {
      if (!this.state.customer) return false
      if (!this.state.customer.last_order) return false
      return this.state.customer.rank
    }

    get customerKind () {
      if (this.isCustomer) {
        const customerRank = this.customerRank
        const kindFromRank = RANKS[customerRank]
        if (!kindFromRank) return 'GUEST'
        return kindFromRank
      }
      return 'GUEST'
    }

    get currentDiscount () {
      if (this.isCustomer) {
        const hasUpsell = DISCOUNT_LIMITS[this.customerKind]['DISCOUNT'] > DISCOUNT_LIMITS[this.customerKind]['FAIL_DISCOUNT']
        if (!hasUpsell) {
          return DISCOUNT_LIMITS[this.customerKind]['FAIL_DISCOUNT']
        }

        const discountAmount = this.originalTotal * (1 - DISCOUNT_LIMITS[this.customerKind]['DISCOUNT'])
        if (discountAmount >= DISCOUNT_LIMITS[this.customerKind]['LIMIT']) {
          return DISCOUNT_LIMITS[this.customerKind]['DISCOUNT']
        }

        return DISCOUNT_LIMITS[this.customerKind]['FAIL_DISCOUNT']
      }

      const discountAmount = this.originalTotal - DISCOUNT_LIMITS.GIFTCARD_DISCOUNT
      if (discountAmount >= DISCOUNT_LIMITS.GUEST.LIMIT) {
        return DISCOUNT_LIMITS.GUEST.DISCOUNT
      }

      return 0
    }

    get hasDiscounts () {
      return this.currentDiscount > 0
    }

    getNoticeFor (key) {
      if (!this.notices[key]) {
        this.notices[key] = $(`<div class="inline-cart__bonus"></div>`)
        this.notices[key].hide()
        this.$wrapper.append(this.notices[key])
      }
      return this.notices[key]
    }

    setUnlocked (key) {
      this.unlockedAwards[key] = true
    }

    unsetUnlocked (key) {
      this.unlockedAwards[key] = null
    }

    isUnlocked (key) {
      return !!this.unlockedAwards[key]
    }

    getUnlockedMessage (key) {
      switch (key) {
        case 'free_shipping': return `FREE SHIPPING UNLOCKED`
        case 'gift_card': return `GIFT CARD UNLOCKED`
        case 'discounts': return `${this.currentDiscount * 100}% Loyalty Pricing UNLOCKED`
        case 'returning_customer': return `${DISCOUNT_LIMITS[this.customerKind].DISCOUNT * 100}% Loyalty Pricing UNLOCKED`
        default: return ''
      }
    }

    renderFreeShippingNote () {
      const notice = this.getNoticeFor('free_shipping')

      if (this.hasFreeShipping()) {
        if (!this.isUnlocked('free_shipping')) {
          notice.fadeOut()
          // notice.html(
          //   `<span>${this.getUnlockedMessage('free_shipping')}!</span>`
          // ).show().delay(3500).fadeOut()
        }
        this.addMoreNoticeEnabled = false
        this.setUnlocked('free_shipping')
      } else {
        if (this.addMoreNoticeEnabled && !this.addMoreNoticeEnabled.is(notice)) return notice.hide()
        this.addMoreNoticeEnabled = notice
        this.unsetUnlocked('free_shipping')
        notice.html(
          `<span>ADD ${UTILS.pricify(this.forFreeShipping/100)} MORE</span> TO UNLOCK FREE SHIPPING!`
        ).show()
      }
    }

    renderGiftCardNote () {
      const notice = this.getNoticeFor('gift_card')
      if (this.getsGiftCard) {
        if (this.giftCard === 0) {
          notice.html(
            `<span>ADD ${UTILS.pricify(this.forGiftCard/100)}</span> TO UNLOCK ${UTILS.pricify(DISCOUNT_LIMITS.GIFTCARD_DISCOUNT/100)} OFF GIFT CARD`
          ).show()
          this.unsetUnlocked('gift_card')
          this.addMoreNoticeEnabled = notice
        } else {
          if (!this.isUnlocked('gift_card')) {
            notice.fadeOut()
          } else {
            notice.hide()
          }
          this.setUnlocked('gift_card')
          this.addMoreNoticeEnabled = false
        }
      } else {
        notice.hide()
        this.unsetUnlocked('gift_card')
        this.addMoreNoticeEnabled = false
      }
    }

    get hasUpsell () {
      if (this.hasDiscounts) {
        return DISCOUNT_LIMITS[this.customerKind].FAIL_DISCOUNT != DISCOUNT_LIMITS[this.customerKind].DISCOUNT
      }

      return false
    }

    renderDiscountsNote () {
      const notice = this.getNoticeFor('discounts')
      if (this.isCustomer) {
        if (this.hasDiscounts) {
          const discountAmount = this.currentDiscount
          const customerDiscounts = DISCOUNT_LIMITS[this.customerKind]
          const hasUpsell = customerDiscounts.FAIL_DISCOUNT != customerDiscounts.DISCOUNT
          
          if (!hasUpsell) {
            if (!this.isUnlocked('discounts')) {
              notice.fadeOut()
            } else {
              notice.hide()
            }
            this.addMoreNoticeEnabled = false
            this.setUnlocked('discounts')
          } else {
            // SHOW FAIL DISCOUNT NOTICE
            if (!this.isUnlocked('discounts')) {
              notice.fadeOut()
            } else {
              notice.hide()
            }
            this.setUnlocked('discounts')
            // END SHOW FAIL DISCOUNT NOTICE

            const customerDiscountNotice = this.getNoticeFor('returning_customer')

            if (discountAmount !== customerDiscounts.DISCOUNT) {
              const discountAmount = this.originalTotal * (1 - DISCOUNT_LIMITS[this.customerKind]['DISCOUNT'])
              const difference = (customerDiscounts.LIMIT - discountAmount) * DISCOUNT_MULTIPLIER
              if (this.addMoreNoticeEnabled && !this.addMoreNoticeEnabled.is(customerDiscountNotice)) customerDiscountNotice.hide()
              const freeShippingSame = customerDiscounts.LIMIT === this.freeShippingAt
              customerDiscountNotice.html(
                `<span>ADD ${UTILS.pricify(difference/100)}</span> TO UNLOCK ${customerDiscounts.DISCOUNT * 100}% OFF ${freeShippingSame ? `& FREE SHIPPING` : ''}`
              ).show()

              this.addMoreNoticeEnabled = customerDiscountNotice
              this.unsetUnlocked('returning_customer')
            } else {
              if (!this.isUnlocked('returning_customer')) {
                customerDiscountNotice.fadeOut()
              } else {
                customerDiscountNotice.hide()
              }
              this.addMoreNoticeEnabled = false
              this.setUnlocked('returning_customer')
            }
          }

        } else {
          this.unsetUnlocked('discounts')
          notice.hide()
        }
      } else {
        const notice = this.getNoticeFor('discounts')
        const customerDiscounts = DISCOUNT_LIMITS[this.customerKind]
        
        if (this.hasDiscounts) {
          if (!this.isUnlocked('discounts')) {
            notice.fadeOut()
          } else {
            notice.hide()
          }
          this.addMoreNoticeEnabled = false
          this.setUnlocked('discounts')
        } else {
          if (this.addMoreNoticeEnabled && !this.addMoreNoticeEnabled.is(notice)) return notice.hide()
          this.addMoreNoticeEnabled = notice
          this.unsetUnlocked('discounts')
          const difference = customerDiscounts.LIMIT - this.currentSubtotal
          notice.html(
            `<span>ADD ${UTILS.pricify(difference/100)}</span> TO UNLOCK ${customerDiscounts.DISCOUNT * 100}% OFF LOYALTY PRICING`
          ).show()
        }
      }
    }

    get unlockedRewardsList () {
      const rewardsAvailabe = this.rewardsList
      return rewardsAvailabe.filter((reward_key) => {
        if (reward_key === 'free_shipping') return this.hasFreeShipping()
        if (reward_key === 'gift_card') return this.giftCardUnlocked

        if (reward_key === 'discounts') return this.hasDiscounts
        if (reward_key === 'returning_customer') return this.unlockedAwards['returning_customer']
        return false
      })
    }

    hideAllNotices () {
      this.$wrapper.children().hide()
      this.unlockedAwards = {}
    }

    render () {

      if (this.cart.items.length) {
        if (!this.isCustomer) {
          this.renderGiftCardNote()
        }

        this.renderDiscountsNote()
        this.renderFreeShippingNote()
      } else {
        this.hideAllNotices()
      }

      const unlockedRewards = this.unlockedRewardsList
      const rewardsAvailabe = this.rewardsList
      Object.entries(this.rewardCards).forEach((reward) => {
        reward[1].toggleClass('is-active', unlockedRewards.indexOf(reward[0]) >= 0)
      })
      // check un locedk at once
      const isLastItemUnlocked = this.lastUnlockedRewards.length === (rewardsAvailabe.length - 1)
      if (
        (unlockedRewards.length === rewardsAvailabe.length && this.lastUnlockedRewards.length === 0) || 
        (this.lastUnlockedRewards.length <= rewardsAvailabe.length && unlockedRewards.length === rewardsAvailabe.length && !isLastItemUnlocked) &&
        this.lastUnlockedRewards.length !== unlockedRewards.length
      ) {
        return state.unlockNotices.allNotices()
      }
      
      if (unlockedRewards.length < rewardsAvailabe.length || isLastItemUnlocked) {
        unlockedRewards.forEach((reward) => {
          state.unlockNotices.notice(this.getUnlockedMessage(reward), reward)
        })
  
        rewardsAvailabe.forEach((reward) => {
          if (unlockedRewards.indexOf(reward) >= 0) return null
          state.unlockNotices.remove(reward)
        })
      }
    }
  }

  class UpsellItem {
    constructor (data, container, hasDiscountedPrice = false) {
      this.data = data
      this.container = container
      this.wrapper = null
      this.hasDiscountedPrice = hasDiscountedPrice
      this.inCart = variantInCart(this.data.selected_variant_id)
      this.wasInCart = this.inCart
      this.render()
    }

    priceHTML () {
      const { price } = this.data
      return `
        ${
          this.hasDiscountedPrice ? `<span class='loyalty-price'>Loyal Customer Price: ${UTILS.pricify(getDiscountedAmount(price[0]))}</span>` : ''
        }
        <span class='retail-price'>Retail Price: ${UTILS.pricify(price[0])}</span>
      `
    }

    contents () {
      const { title, image_url, tags, selected_variant_id, product_url, handle } = this.data
      const productUrl = product_url ? product_url.split('?')[0] : `/product/${handle}`
      const classes = UTILS.getProductColorClasses(tags)
      const exigoId = tags.reduce((id, t) => {
        if (id) return id
        const tag = handleize(t)
        if (tag.indexOf('exigo_id') >= 0) {
          return tag.replace('exigo_id-', '').trim()
        }
        return id
      }, null)
      const inCart = this.inCart
      return `
        <div class="inline-cart__upsells__item inline-cart__lineItem ${inCart ? 'incart' : ''} ${classes}" data-productid="${this.data.id}" data-id='${selected_variant_id}' data-product-url="${productUrl}" data-exigo-id="${exigoId}">
          <div class="image"><img src="${image_url}" alt=""></div>
          <div class="details">
            <div class="name">${title}</div>
            <div class="price">
              ${ this.priceHTML() }
            </div>
          </div>
          <button cart-add="${selected_variant_id}" class='add-to-cart ${inCart ? 'added' : ''}'>
            <span class='btn-notadded'>Add</span>
            <span class='btn-added'>Added</span>
          </button>
        </div>
      `
    }

    update (data, hasDiscountedPrice = false) {
      this.prevData = this.data
      this.data = { ...data }
      this.wasInCart = this.inCart
      this.inCart = variantInCart(this.data.selected_variant_id)
      this.hasDiscountedPrice = hasDiscountedPrice
      this.render()
    }

    removedFromCart () {
      TweenLite.set(this.wrapper, { maxHeight: 0 })
      this.wrapper.removeClass('incart')
      this.wrapper.removeClass('busy')
      TweenLite.set(this.wrapper, {
        maxHeight: 300,
        clearProps: 'all'
      })
    }

    addedToCart () {
      this.wrapper.addClass('incart')
      this.wrapper.addClass('busy')
      TweenLite.set(this.wrapper, { maxHeight: 300 })
      TweenLite.to(this.wrapper, 0.3, {
        maxHeight: 0,
        marginBottom: 0,
        delay: 2,
        onComplete: () => {
          this.wrapper.removeClass('busy')
        }
      })
    }

    render () {
      if (!this.wrapper) {
        const contents = $(this.contents())
        this.wrapper = contents
        this.price = this.wrapper.find('.price')
        this.button = this.wrapper.find('.add-to-cart')
        this.container.append(this.wrapper)
      } else {
        TweenLite.killTweensOf(this.wrapper)
        const inCart = this.inCart
        this.price.html(this.priceHTML())
        this.button.toggleClass('added', inCart)
        if (inCart) {
          this.addedToCart()
        } else {
          if (this.wasInCart) this.removedFromCart()
        }
      }
    }
  }

  class UpsellsSlider {
    constructor (wrapper) {
      this.wrapper = wrapper
      this.slides = this.wrapper.find('.inline-cart__upsells__item')
      this.fileredSlides = this.wrapper.find('.inline-cart__upsells__item:not(.incart)')
      this.inCart = this.wrapper.find('.inline-cart__upsells__item.incart')
      this.state = {
        currentActive: 0,
        prevActive: null,
        total: this.fileredSlides.length
      }
      this.init()
    }

    init () {
      this.slides.hide()
      this.render()
    }

    render () {
      if (this.state.prevActive !== null) {
        this.fileredSlides.eq(this.state.prevActive).css('display', 'none')
      }
      this.fileredSlides.eq(this.state.currentActive).css('display', "")
    }

    next () {
      this.state.prevActive = this.state.currentActive
      if ((this.state.currentActive + 1) >= this.state.total) {
        this.state.currentActive = 0
      } else {
        this.state.currentActive += 1
      }
      this.render()
    }

    prev () {
      this.state.prevActive = this.state.currentActive
      if (this.state.currentActive === 0) {
        this.state.currentActive = this.state.total - 1
      } else {
        this.state.currentActive -= 1
      }
      this.render()
    }

    destroy () {
      this.slides.css('display', '')
    }
  }

  const UPSELLS_COUNT = 6
  const THRESHOLD_CART_LIMIT = 200
  const THRESHOLD_CART_LIMIT_DISCOUNT = 0.75
  const DOM = {
    cart: '#inline-cart',
    backdrop: '#inline-cart .inline-cart__backdrop',
    cartToggle: '[inlincart-toggle]',
    cartContents: '#inline-cart .inline-cart__container',
    cartContainer: '#inline-cart .inline-cart__cart',
    cartMainContainer: '#inline-cart .inline-cart__cartMain',
    upsells: '#inline-cart .inline-cart__upsells',
    upsellsContainer: '#inline-cart [upsell-items]',
    customerJSON: '#customer-metafields',
    totals: '#inline-cart .inline-cart__subtotal',
    totalSavings: '#inline-cart .inline-cart__subtotal .saving',
    totalSavingsValue: '#inline-cart .inline-cart__subtotal .saving span',
    retailPrice: '#inline-cart .inline-cart__subtotal .retail-price',
    loyaltyPrice: '#inline-cart .inline-cart__subtotal .loyalty-price',
    onSaleClass: 'on-sale',
    toggleUpsells: '#inline-cart .inline-cart__upsellsToggle',
    upsellsClosedClass: 'inline-cart--upsellsClosed',
    cartBonuses: '#inline-cart .inline-cart__bonuses',
    emptyCartNote: '#inline-cart .inline-cart--empty',
    cartLineItems: '#inline-cart [cart-lineitems]',
    ticketProductsData: '#inline-cart-json',
    rewardsBarContainer: '#inline-cart [data-rewardsbar]',
    unlockNotices: '#inline-cart [data-unlocksnotices]'
  }

  // <div class='inline-cart__freeShipping'>
  //         <div class="locked"><span>Add <span data-balance></span> more</span> for free shipping!</div>
  //         <div class="unlocked"><span>Free Shipping Unlocked!</span></div>
  //       </div>

  const $DOM = {
    body: $('body'),
    htmlBody: $('html, body')
  }

  const state = {
    upsellCollection: null,
    upsellCollectionPage: 1,
    discountsManager: null,
    isOpen: false,
    cart: null,
    upsellsInitialised: false,
    recommendations: [],
    upsellCollectionProds: [],
    customer: null,
    ready: false,
    upsellCarousel: null,
    freeShippingThreshold: 250,
    findifyPageOffset: 0,
    findifyLoadMore: true,
    findifyBusy: false,
    gotoNextUpsell: false,
    upsellEls: {},
    ticketProducts: [],
    ticketProductIds: [],
    ticketPurchase: false,
    findifyErrorCount: 0
  }

  function main (cart) {
    setCart(cart)
    $DOM.cart = $(DOM.cart)
    $DOM.customerJSON = $(DOM.customerJSON)
    
    if ($DOM.customerJSON.length) {
      const contents = $DOM.customerJSON.html()
      try {
        const customerMeta = JSON.parse(contents)
        if (customerMeta) {
          state.customer = customerMeta
        }
      } catch (error) {
        
      }
    }

    $DOM.ticketProductsData = $(DOM.ticketProductsData)
    if ($DOM.ticketProductsData.length) {
      const contents = $DOM.ticketProductsData.html()
      try {
        const ticketProducts = JSON.parse(contents)
        if (ticketProducts) {
          state.ticketProducts = ticketProducts
          state.ticketProductIds = ticketProducts.map(({ id })=> id)
        }
      } catch (error) {
        
      }
    }

    checkForTickets()
    const freeShippingT = parseFloat($DOM.cart.attr('data-freeshippingthreshold'))

    if (!isNaN(freeShippingT)) {
      state.freeShippingThreshold = freeShippingT
    }
    
    state.upsellCollection = $DOM.cart.attr('data-collection') || null
    state.unlockNotices = new UnlockedNotices($(DOM.unlockNotices))
    state.discountsManager = new DiscountsManager($(DOM.cartBonuses), state, state.cart)
    state.discountsManager.renderRewardsBar($(DOM.rewardsBarContainer))
  }

  function checkForTickets() {
    const hasTicket = state.cart.items.reduce((lastValue, { product_id }) => {
      if (lastValue) return true
      return state.ticketProductIds.indexOf(product_id) >= 0
    }, false)
    // !!window.findifyProdId && state.ticketProductIds.indexOf(window.findifyProdId) >= 0

    if (state.ticketPurchase != hasTicket) {
      state.recommendations = []
      state.findifyBusy = false
      state.findifyErrorCount = 0
      state.findifyPageOffset = 0
      state.findifyLoadMore = true
    }
    state.ticketPurchase = hasTicket
  }

  function filterRecommendations (items) {
    return items.filter(({ id }) => {
      const var_id = parseInt(id)
      const findItem = state.ticketProductIds.indexOf(var_id)
      if (state.ticketPurchase) return findItem >= 0
      return findItem == -1
    })
  }

  function scrollToEnd () {
    $DOM.cartContainer.animate({ scrollTop: $DOM.cartContainer[0].scrollHeight - $DOM.cartContainer[0].clientHeight })
    $DOM.cartMainContainer.animate({ scrollTop: $DOM.cartMainContainer[0].scrollHeight - $DOM.cartMainContainer[0].clientHeight })
  }

  function cacheDOM () {
    $DOM.upsellsContainer = $(DOM.upsellsContainer)
    $DOM.upsells = $(DOM.upsells)
    $DOM.backdrop = $(DOM.backdrop)
    $DOM.cartContents = $(DOM.cartContents)
    $DOM.totalSavings = $(DOM.totalSavings)
    $DOM.totalSavingsValue = $(DOM.totalSavingsValue)
    $DOM.retailPrice = $(DOM.retailPrice)
    $DOM.loyaltyPrice = $(DOM.loyaltyPrice)
    $DOM.cartBonuses = $(DOM.cartBonuses)
    $DOM.emptyCartNote = $(DOM.emptyCartNote)
    $DOM.cartLineItems = $(DOM.cartLineItems)
    $DOM.cartContainer = $(DOM.cartContainer)
    $DOM.cartMainContainer = $(DOM.cartMainContainer)
  }

  const uniqBy = (arr, predicate) => {
    const cb = typeof predicate === 'function' ? predicate : (o) => o[predicate];
    
    return [...arr.reduce((map, item) => {
      const key = (item === null || item === undefined) ? 
        item : cb(item);
      
      map.has(key) || map.set(key, item);
      
      return map;
    }, new Map()).values()];
  }

  async function setupUpdateUpsells (itemsToLoad = UPSELLS_COUNT) {
    if (state.findifyBusy || !itemsToLoad) return
    state.findifyBusy = true
    try {
      const [findityItems, collectionItems] = await Promise.all([loadRecs(itemsToLoad), loadRecCollection()])
      const items = uniqBy([
        ...collectionItems,
        ...findityItems.filteredItems
      ], 'selected_variant_id')

      state.recommendations = [
        ...state.recommendations,
        ...items
      ]
      // loadRecCollection(),
      renderUpsells(items)
    } catch (error) {
      console.log(error)
    } finally {
      state.findifyBusy = false
      checkUpsellsInCart()
    }
  }

  function variantInCart (variantId) {
    if (!state.cartItems) return false
    return state.cartItems[variantId] ? true : false
  }

  function cartHasDiscountedPrice () {
    if (state.ticketPurchase) return false
    return state.discountsManager.hasDiscounts
  }

  function renderUpsells (items, update = false) {
    let initialSlide = 0
    const hasDiscountedPrice = cartHasDiscountedPrice()
    const targetItems = update ? state.recommendations : items
    if (state.recommendations.length === 0) {
      state.upsellEls = {}
      $DOM.upsellsContainer.empty()
    }
    targetItems.forEach((upsellItem) => {
      if (state.upsellEls[upsellItem.selected_variant_id]) {
        state.upsellEls[upsellItem.selected_variant_id].update(upsellItem, hasDiscountedPrice)
      } else {
        state.upsellEls[upsellItem.selected_variant_id] = new UpsellItem(upsellItem, $DOM.upsellsContainer, hasDiscountedPrice)
      }
    })
    
    if (!state.upsellsInitialised && state.recommendations.length) {
      state.upsellsInitialised = true
      $DOM.upsells.addClass('init')
    }

    initResetUpsellsSlider(initialSlide)
  }

  function renderCartLineItems ({ items }) {
    if (items.length == 0) return $DOM.cartLineItems.empty()
    const hasDiscountedPrice = cartHasDiscountedPrice()
    const cartItems = items.map((product, index) => {
      const { line_price, original_line_price, original_price, price, variant_id, product_title, image, total_discount, url, quantity } = product
      const hasSalePrice = line_price !== original_line_price
      const itemPrice = hasSalePrice ? original_line_price/100 : price/100
      return `
        <div class="inline-cart__cart__item inline-cart__lineItem" data-id='${variant_id}'>
          <a href='${url}' class="image"><img src="${image}" alt=""></a>
          <div class="details">
            <a href='${url}' class="name">${product_title}</a>
            <div class="price">
              ${
                hasDiscountedPrice ? `<span class='loyalty-price'>Loyal Customer Price: ${UTILS.pricify(getDiscountedAmount(itemPrice))}</span>` : ''
              }
              <span class='retail-price'>Retail Price: ${UTILS.pricify(hasSalePrice ? original_line_price/100 : price/100)}</span>
            </div>
          </div>
          <div class='actions'>
            <div class='quantity'>
              <div class='quantity__ctrl quantity__minus' quantity-toggle quantity-minus>-</div>
              <input type="number" value="${quantity}" min="1" edit-quantity="${index + 1}" />
              <div class='quantity__ctrl quantity__plus' quantity-toggle quantity-add>+</div>
            </div>
            <button class='remove' data-cart-remove="${index + 1}" remove-lineitem>REMOVE</button>
          </div>
        </div>
      `
    })
    $DOM.cartLineItems.html(cartItems)
  }

  const initResetUpsellsSlider = (initSlide = null) => {
    if (!state.upsellsInitialised) return
    if (UTILS.isBreakpointMd()) {
      if (state.upsellCarousel && initSlide == null) {
        return null
      }
      
      if (state.upsellCarousel) state.upsellCarousel.destroy()
      state.upsellCarousel = new UpsellsSlider($DOM.upsellsContainer)
      $DOM.upsells.off('click.arrows')
      $DOM.upsells.on('click.arrows', '.arrow-prev, .arrow-next', (event) => {
          if ($(event.currentTarget).is('.arrow-prev')) state.upsellCarousel.prev()
          if ($(event.currentTarget).is('.arrow-next')) state.upsellCarousel.next()
        })
    } else {
      if (state.upsellCarousel) {
        $DOM.upsells.off('click.arrows')
        state.upsellCarousel.destroy()
        state.upsellCarousel = null
      }
    }
  }

  const loadRecCollection = async () => {
    if (!state.upsellCollection || state.upsellCollectionPage == false) return []
    try {
      const response = await $.ajax(`/collections/${state.upsellCollection}?view=inline-cart&page=${state.upsellCollectionPage}`).promise()
      const { products, page, pages } = JSON.parse(response)
      state.upsellCollectionPage = ((page + 1) == pages) ? false : state.upsellCollectionPage  + 1
      state.upsellCollectionProds = state.upsellCollectionProds.concat(products)
      return products
    } catch (error) {
      console.log(error)
      return []
    }
  }

  const loadRecs = (itemCount = UPSELLS_COUNT) => {
    return new Promise(async (resolve, reject) => {
      if (!itemCount) return reject('Nothing to laod')
      const request = {
        kind: 'trending',
        name: 'request',
        offset: state.findifyPageOffset,
        limit: state.findifyPageOffset + itemCount
      };
      
      if (window.findifyProdId) {
        const isTicketProcuct = state.ticketProductIds.indexOf(window.findifyProdId) >= 0
        if (isTicketProcuct === state.ticketPurchase || state.cart.items.length === 0) {
          request['kind'] = 'bought'
          request['item_id'] = window.findifyProdId
          if (state.ticketPurchase) {
            request['kind'] = 'viewed'
          }
        }
      }
      await UTILS.wait(2500)
      Findify.sdk.recommendations(request.kind, request).then(
        function(data) {
          state.findifyPageOffset += itemCount
          const filteredItems = filterRecommendations(data.items)
          if (data.items.length === 0 || (state.ticketPurchase && request.offset >= 18)) {
            state.findifyLoadMore = false
          }
          resolve({ items: data.items, filteredItems })
        },
        function(error) {
          console.log("recommendation error", error)
          if (state.findifyErrorCount >= 2) {
            state.findifyLoadMore = false
          } else {
            state.findifyErrorCount += 1
          }
          reject(error)
        }
      )
    })
  }

  function updateCart () {
    CartJS.getCart()
  }

  function checkUpsellsInCart () {
    const foundItems = state.recommendations.filter(({ selected_variant_id }) => variantInCart(selected_variant_id)).length
    const itemsNotInCart = state.recommendations.length - foundItems
    const itemsToAdd = UPSELLS_COUNT - itemsNotInCart
    if (itemsToAdd > 0 && state.findifyLoadMore) return setupUpdateUpsells(itemsToAdd) 
  }

  function discountThresholdPass () {
    if (!state.cart) return false
    return (state.cart.original_total_price/100) >= THRESHOLD_CART_LIMIT
  }

  function getDiscountedAmount (amount) {
    return amount * (1 - state.discountsManager.currentDiscount)
  }

  function handleCartUpdate (cart = null) {
    if (!cart) return null
    setCart(cart)
    state.discountsManager.update(state.cart)
    $('.header .cart-link span').html(state.cart.item_count)
    $DOM.cartContainer.scrollTop(0)
    $DOM.cartMainContainer.scrollTop(0)
    // Upsate upsells
    if (state.upsellsInitialised) {
      checkForTickets()
      renderUpsells([], true)
      checkUpsellsInCart()
    }
    renderCartLineItems(state.cart)

    // Update Totals
    if ((state.discountsManager.hasDiscounts || state.discountsManager.giftCard) && state.cart.items.length) {
      $DOM.retailPrice.addClass(DOM.onSaleClass)
      $DOM.loyaltyPrice.show()
      $DOM.totalSavings.show()

      const currentSubtotals = state.discountsManager.currentSubtotal
      const savings = state.discountsManager.savings
      // finalTotalPrice = discountedPrice
      $DOM.loyaltyPrice.html(UTILS.pricify(currentSubtotals/100))
      $DOM.totalSavingsValue.html(UTILS.pricify(savings/100))
    } else {
      $DOM.retailPrice.removeClass(DOM.onSaleClass)
      $DOM.loyaltyPrice.hide()
      $DOM.totalSavings.hide()
    }

    $DOM.retailPrice.html(UTILS.pricify(state.discountsManager.originalTotal/100))

    if (state.cart.items.length) {
      $DOM.emptyCartNote.hide()
    } else {
      $DOM.emptyCartNote.show()
    }

    setTimeout(scrollToEnd, 1000)
  }

  function editCartLineItem (event) {
    let quantity = parseInt(event.currentTarget.value);
    quantity = isNaN(quantity) ? 1 : quantity;
    const lineIndex = event.currentTarget.getAttribute('edit-quantity');
    const properties = Exigo.setPropertyQtys(CartJS.cart.items[lineIndex - 1].properties, quantity);

    event.currentTarget.value = quantity;
    CartJS.updateItem(lineIndex, quantity, properties)
  }

  https://purium-admin-products.herokuapp.com/get-prod?product_id=3554648096840
  async function handleAddUpsellToCart (event) {
    event.preventDefault()
    const button = $(event.currentTarget)
    const variantId = button.attr('cart-add')
    const item = button.closest('.inline-cart__upsells__item')
    if (item.hasClass('busy') || button.hasClass('added')) {
      CartJS.removeItemById(variantId)
      return false
    }

    const productId = item.attr('data-productid')
    let productData = state.recommendations.find(({ id }) => id === productId)
    const itemProperties = await Exigo.prepareProductProperties(productData)
    const properties = Exigo.setPropertyQtys(itemProperties, 1);
    
    item.addClass('busy')
    CartJS.addItem(variantId, 1, properties, {
      success: () => {
        item.removeClass('busy')
        // if ($DOM.upsellsContainer.length && state.upsellCarousel) state.gotoNextUpsell = true
      },
      error: () => {
        item.removeClass('busy')
      },
    })
  }

  function handleQuantityToggle (event) {
    const target = $(event.currentTarget)
    const input = target.parent().find('[edit-quantity]')
    let currentQuantity = parseInt(input.val())
    if (isNaN(currentQuantity)) currentQuantity = 1

    if (target.is('[quantity-minus]')) {
      if (currentQuantity <= 1) return null
      input.val(currentQuantity - 1).trigger('change')
    }

    if (target.is('[quantity-add]')) {
      input.val(currentQuantity + 1).trigger('change')
    }
  }

  function bindCartJSEvents () {
    $(document).on('cart.requestComplete', function(event, cart) {
      if (
        state.ready &&
        (state.cart == null || 
        (state.cart && state.cart.item_count !== cart.item_count)) &&
        cart.item_count
      ) showCart()
      if (!state.ready) state.ready = true
      handleCartUpdate(cart)
    })

    $DOM.upsellsContainer.on('click', '[cart-add]', handleAddUpsellToCart)
  }

  function bindUIEvents () {
    $(document).on('click', DOM.cartToggle, toggleCart)
    $DOM.backdrop.on('click', hideCart)
    $DOM.cart.on('click', '.inline-cart__upsellsToggle', (e) =>{
      $DOM.cart.toggleClass(DOM.upsellsClosedClass)
    })
    $DOM.cart.on('change.quantityEdit', '[edit-quantity]', editCartLineItem)
    $DOM.cart.on('click.quantityToggle', '[quantity-toggle]', handleQuantityToggle)
    UTILS.optimizedResize.add(() => initResetUpsellsSlider())
  }

  function toggleCart (event) {
    event.preventDefault()
    state.isOpen ? hideCart() : showCart()
  }


  function showCart () {
    console.log('opening')
    if (state.isOpen) return null
    state.isOpen = true

    // const isXMenu = UTILS.isMinBreakpoint(710)
    const isXMenu = true
    $DOM.htmlBody.addClass('inlineCartOpen')
    TweenLite.set($DOM.cartContents, { clearProps: 'all' })
    TweenLite.set($DOM.cartContents, { [`${!isXMenu ? 'y':'x'}Percent`]: 100 })
    TweenLite.set($DOM.cart, { opacity: 0, display: 'block' })
    TweenLite.to($DOM.cart, 0.4, { opacity: 1, ease: Power3.easeOut })
    TweenLite.to($DOM.cartContents, 0.3, { delay: 0.3, [`${!isXMenu ? 'y':'x'}Percent`]: 0, ease: Power3.easeOut })
    initResetUpsellsSlider()
  }

  function hideCart () {
    if (!state.isOpen) return null
    state.isOpen = false
    $DOM.htmlBody.removeClass('inlineCartOpen')
    // const isXMenu = UTILS.isMinBreakpoint(710)
    const isXMenu = true
    TweenLite.to($DOM.cartContents, 0.2, { [`${!isXMenu ? 'y':'x'}Percent`]: 100, ease: Power3.easeIn })
    TweenLite.to($DOM.cart, 0.2, { delay: 0.3, opacity: 0, ease: Power3.easeIn, clearProps: 'all' })
  }

  function setCart (cart = null) {
    if (!cart) state.cart = null
    state.cart = { ...cart }
    state.cartItems = {}
    state.cart.items.forEach((item) => {
      state.cartItems[item.variant_id] = item
    })
  }

  InlineCart.show = showCart
  InlineCart.hide = hideCart

  InlineCart.init = function (permalink = false) {
    if(!window.location.href.includes('?prods=') && !permalink) {
      CartJS.getCart().then((cart) => {
        main(cart);
        setupUpdateUpsells();
        cacheDOM();
        bindUIEvents();
        bindCartJSEvents();
        if (UTILS.getQueryVariable('cart')) {
          showCart()
        }
      })
    } else if(window.location.href.includes('?prods=') && permalink){
      CartJS.getCart().then((cart) => {
        // console.log('heyyyyyyyyyyy')
        main(cart);
        setupUpdateUpsells();
        cacheDOM();
        bindUIEvents();
        bindCartJSEvents();
        showCart();
        // if (UTILS.getQueryVariable('cart')) {
        //   showCart()
        // }
      })
    }
  };

}(window.InlineCart = window.InlineCart || {}, jQuery));
