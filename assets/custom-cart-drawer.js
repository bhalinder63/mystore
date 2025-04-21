/**
 * Custom Cart Drawer
 * A lightweight cart drawer implementation for Shopify
 */
document.addEventListener('DOMContentLoaded', function() {
  /**
   * CustomCartDrawer class handles the cart drawer functionality
   * including opening/closing, adding items, and updating the UI
   */
  class CustomCartDrawer {
    constructor() {
      // DOM elements
      this.drawer = document.getElementById('custom-cart-drawer');
      this.overlay = document.getElementById('custom-cart-drawer-overlay');
      this.cartItemsContainer = document.querySelector('.custom-cart-drawer__items');
      this.cartEmptyMessage = document.querySelector('.custom-cart-drawer__empty');
      this.cartItemsWrapper = document.querySelector('.custom-cart-drawer__has-items');
      this.cartFooter = document.querySelector('.custom-cart-drawer__footer');
      this.cartTotalElement = document.querySelector('.custom-cart-drawer__footer-total-value');
      this.cartSubtotalElement = document.querySelector('.custom-cart-drawer__footer-subtotal-value');
      this.cartCountElement = document.querySelector('.custom-cart-drawer__count');
      this.cartCountBubble = document.querySelector('.custom-cart-count-bubble');
      this.cartNoteTextarea = document.getElementById('cart-note');
      
      // Cart state
      this.state = {
        items: [],
        itemCount: 0,
        subtotal: 0,
        total: 0,
        note: '',
        isOpen: false,
        isLoading: false
      };
      
      this.init();
    }
    
    /**
     * Initialize the cart drawer
     */
    init() {
      this.setupEventListeners();
      this.fetchCartState();
    }
    
    /**
     * Set up all event listeners for the cart drawer
     */
    setupEventListeners() {
      // Close drawer when clicking the overlay or close button
      const closeButtons = document.querySelectorAll('.custom-cart-drawer__close');
      closeButtons.forEach(button => {
        button.addEventListener('click', this.close.bind(this));
      });
      
      if (this.overlay) {
        this.overlay.addEventListener('click', this.close.bind(this));
      }
      
      // Close on escape key
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.state.isOpen) {
          this.close();
        }
      });
      
      // Listen for add to cart events from the product form
      document.addEventListener('submit', this.handleFormSubmit.bind(this));
      
      // Listen for cart update events
      document.addEventListener('cart:update', this.fetchCartState.bind(this));
      
      // Prevent body scrolling when drawer is open
      this.drawer.addEventListener('transitionend', this.handleTransitionEnd.bind(this));
      
      // Setup cart note functionality
      if (this.cartNoteTextarea) {
        this.cartNoteTextarea.addEventListener('change', this.handleCartNoteChange.bind(this));
      }
    }
    
    /**
     * Handle cart note changes
     * @param {Event} event - Change event from textarea
     */
    async handleCartNoteChange(event) {
      const note = event.target.value;
      
      try {
        this.setLoading(true);
        
        // Update the cart note
        const response = await fetch('/cart/update.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ note })
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const cart = await response.json();
        this.state.note = cart.note || '';
        
      } catch (error) {
        this.showError('Could not update cart note. Please try again.');
      } finally {
        this.setLoading(false);
      }
    }
    
    /**
     * Handle form submissions to intercept cart additions
     * @param {Event} event - The form submission event
     */
    handleFormSubmit(event) {
      const form = event.target;
      
      // Check if it's a product form that we should intercept
      const isCartForm = form.action && form.action.includes('/cart/add');
      const isCustomForm = form.id === 'custom-product-form' || form.classList.contains('custom-product__form');
      
      if (isCartForm && isCustomForm) {
        event.preventDefault();
        this.addToCart(form);
      }
    }
    
    /**
     * Add an item to the cart and open the drawer
     * @param {HTMLFormElement} form - The product form element
     */
    async addToCart(form) {
      // Set loading state
      this.setLoading(true);
      
      // Get the submit button
      const submitButton = form.querySelector('button[type="submit"]');
      const submitButtonSpan = submitButton ? submitButton.querySelector('span') : null;
      
      try {
        // Update button to show loading state
        if (submitButton) {
          // First add the loading class so the CSS spinner appears immediately
          submitButton.classList.add('loading');
          
          // The span text should automatically become transparent via CSS
          // but we'll ensure it with inline style as a fallback
          if (submitButtonSpan) {
            submitButtonSpan.style.color = 'transparent';
          }
        }
        
        // Create the form data
        const formData = new FormData(form);
        
        // Submit the form via fetch
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        // Open the cart drawer
        this.open();
        
        // Update cart state
        this.fetchCartState();
        
      } catch (error) {
        this.showError('Could not add item to cart. Please try again.');
      } finally {
        // Reset button text
        if (submitButtonSpan) {
          submitButtonSpan.style.color = '';
        }
        
        // Remove loading class
        if (submitButton) {
          submitButton.classList.remove('loading');
        }
        
        this.setLoading(false);
      }
    }
    
    /**
     * Fetch the current cart state from the Shopify API
     */
    async fetchCartState() {
      try {
        // Set loading state
        this.setLoading(true);
        
        // Fetch cart data
        const response = await fetch('/cart.js');
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const cart = await response.json();
        
        // Update state
        this.state.items = cart.items;
        this.state.itemCount = cart.item_count;
        this.state.subtotal = cart.items_subtotal_price || cart.total_price;
        this.state.total = cart.total_price;
        this.state.note = cart.note || '';
        
        // Update the cart note textarea if it exists
        if (this.cartNoteTextarea && this.state.note !== this.cartNoteTextarea.value) {
          this.cartNoteTextarea.value = this.state.note;
        }
        
        // Update the UI
        this.updateUI();
      } catch (error) {
        // Silent fail - cart fetch errors shouldn't interrupt the user experience
      } finally {
        this.setLoading(false);
      }
    }
    
    /**
     * Update a cart item's quantity
     * @param {string} key - The cart item key
     * @param {number} quantity - The new quantity
     */
    async updateCartItem(key, quantity) {
      try {
        // Set loading state
        this.setLoading(true);
        
        // Update the cart line item
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: key, quantity })
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const cart = await response.json();
        
        // Update state
        this.state.items = cart.items;
        this.state.itemCount = cart.item_count;
        this.state.subtotal = cart.items_subtotal_price || cart.total_price;
        this.state.total = cart.total_price;
        
        // Update the UI
        this.updateUI();
      } catch (error) {
        this.showError('Could not update cart. Please try again.');
      } finally {
        this.setLoading(false);
      }
    }
    
    /**
     * Update the cart UI based on current state
     */
    updateUI() {
      // Update cart counts
      this.updateCartCount();
      
      // Clear current items
      if (this.cartItemsContainer) {
        this.cartItemsContainer.innerHTML = '';
      }
      
      // Show empty state or items based on cart content
      if (this.state.itemCount === 0) {
        if (this.cartEmptyMessage) this.cartEmptyMessage.classList.remove('hidden');
        if (this.cartItemsWrapper) this.cartItemsWrapper.classList.add('hidden');
        if (this.cartFooter) this.cartFooter.classList.add('hidden');
        
        // Reset totals to $0.00 when cart is empty
        this.state.subtotal = 0;
        this.state.total = 0;
        this.updateCartTotals();
      } else {
        if (this.cartEmptyMessage) this.cartEmptyMessage.classList.add('hidden');
        if (this.cartItemsWrapper) this.cartItemsWrapper.classList.remove('hidden');
        if (this.cartFooter) this.cartFooter.classList.remove('hidden');
        
        // Render items
        this.renderItems();
        
        // Update totals
        this.updateCartTotals();
      }
      
      // Save cart state to session storage
      this.saveCartState();
      
      // Dispatch cart updated event
      this.dispatchCartUpdatedEvent();
    }
    
    /**
     * Save cart state to session storage
     */
    saveCartState() {
      try {
        window.sessionStorage.setItem('cartState', JSON.stringify({
          itemCount: this.state.itemCount,
          subtotal: this.state.subtotal,
          total: this.state.total
        }));
      } catch (e) {
        // Silent fail if session storage is not available
      }
    }
    
    /**
     * Dispatch a custom event with cart data
     */
    dispatchCartUpdatedEvent() {
      document.dispatchEvent(new CustomEvent('cart:updated', {
        detail: {
          count: this.state.itemCount,
          subtotal: this.state.subtotal,
          total: this.state.total
        }
      }));
    }
    
    /**
     * Render all cart items in the drawer
     */
    renderItems() {
      if (!this.cartItemsContainer) return;
      
      // Render each item
      this.state.items.forEach(item => {
        const lineItem = this.createLineItemElement(item);
        this.cartItemsContainer.appendChild(lineItem);
      });
    }
    
    /**
     * Create a line item element for the cart drawer
     * @param {Object} item - The cart item
     * @returns {HTMLElement} The line item element
     */
    createLineItemElement(item) {
      const lineItem = document.createElement('div');
      lineItem.classList.add('custom-cart-drawer__item');
      lineItem.dataset.key = item.key;
      
      // Format price
      const price = this.formatMoney(item.final_line_price);
      
      // Build image URL
      const imageSrc = item.image 
        ? this.getSizedImageUrl(item.image, '120x') 
        : 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-image.png?format=jpg&quality=90&v=1530129081';
      
      // Determine if quantity is already at max
      const isMaxQuantity = item.quantity >= 5;
      
      lineItem.innerHTML = `
        <div class="custom-cart-drawer__item-image-container">
          <img src="${imageSrc}" alt="${item.title}" loading="lazy" class="custom-cart-drawer__item-image">
        </div>
        <div class="custom-cart-drawer__item-details">
          <h3 class="custom-cart-drawer__item-title">${item.product_title}</h3>
          <p class="custom-cart-drawer__item-variant">${item.variant_title || ''}</p>
          <p class="custom-cart-drawer__item-price">${price}</p>
          <div class="custom-cart-drawer__item-actions">
            <div class="custom-cart-drawer__item-quantity">
              <button class="custom-cart-drawer__quantity-button" data-action="decrease">−</button>
              <span class="custom-cart-drawer__quantity-value">${item.quantity}</span>
              <button class="custom-cart-drawer__quantity-button" data-action="increase" ${isMaxQuantity ? 'disabled' : ''}>+</button>
            </div>
            <button class="custom-cart-drawer__item-remove" aria-label="Remove ${item.product_title}" data-key="${item.key}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="custom-cart-drawer__quantity-limit-message" style="${isMaxQuantity ? 'display: block;' : 'display: none;'}">
            <p>Maximum quantity reached (5)</p>
          </div>
        </div>
      `;
      
      // Add event listeners
      const quantityValue = lineItem.querySelector('.custom-cart-drawer__quantity-value');
      const decreaseBtn = lineItem.querySelector('[data-action="decrease"]');
      const increaseBtn = lineItem.querySelector('[data-action="increase"]');
      const removeBtn = lineItem.querySelector('.custom-cart-drawer__item-remove');
      const limitMessage = lineItem.querySelector('.custom-cart-drawer__quantity-limit-message');
      
      // Decrease button
      decreaseBtn.addEventListener('click', () => {
        let newQty = parseInt(quantityValue.textContent, 10) - 1;
        if (newQty < 1) newQty = 1;
        
        // Update quantity display
        quantityValue.textContent = newQty;
        
        // Update UI state
        if (newQty < 5) {
          increaseBtn.disabled = false;
          limitMessage.style.display = 'none';
        }
        
        // Update cart
        this.updateCartItem(item.key, newQty);
      });
      
      // Increase button
      increaseBtn.addEventListener('click', () => {
        let newQty = parseInt(quantityValue.textContent, 10) + 1;
        
        // Prevent increasing above max quantity
        if (newQty >= 5) {
          newQty = 5;
          increaseBtn.disabled = true;
          limitMessage.style.display = 'block';
        } else {
          increaseBtn.disabled = false;
          limitMessage.style.display = 'none';
        }
        
        // Update quantity display
        quantityValue.textContent = newQty;
        
        // Update cart
        this.updateCartItem(item.key, newQty);
      });
      
      // Remove button
      removeBtn.addEventListener('click', () => {
        this.updateCartItem(item.key, 0);
      });
      
      return lineItem;
    }
    
    /**
     * Update the cart count display
     */
    updateCartCount() {
      if (this.cartCountElement) {
        this.cartCountElement.textContent = this.state.itemCount;
      }
      
      if (this.cartCountBubble) {
        if (this.state.itemCount > 0) {
          this.cartCountBubble.textContent = this.state.itemCount;
          this.cartCountBubble.classList.remove('hidden');
        } else {
          this.cartCountBubble.classList.add('hidden');
        }
      }
    }
    
    /**
     * Update the cart totals display
     */
    updateCartTotals() {
      // Update subtotal
      if (this.cartSubtotalElement) {
        this.cartSubtotalElement.textContent = this.formatMoney(this.state.subtotal);
      }
      
      // Update total
      if (this.cartTotalElement) {
        this.cartTotalElement.textContent = this.formatMoney(this.state.total);
      }
    }
    
    /**
     * Open the cart drawer
     */
    open() {
      if (!this.drawer) return;
      
      // Prevent scrolling the body
      document.body.classList.add('custom-cart-drawer-open');
      
      // Show the drawer and overlay
      this.drawer.classList.add('active');
      if (this.overlay) this.overlay.classList.add('active');
      
      this.state.isOpen = true;
    }
    
    /**
     * Close the cart drawer
     */
    close() {
      if (!this.drawer) return;
      
      // Hide the drawer and overlay
      this.drawer.classList.remove('active');
      if (this.overlay) this.overlay.classList.remove('active');
      
      this.state.isOpen = false;
      
      // Re-enable scrolling after animation finishes
      document.body.classList.remove('custom-cart-drawer-open');
    }
    
    /**
     * Handle transition end events for the drawer
     * @param {TransitionEvent} event - The transition event
     */
    handleTransitionEnd(event) {
      if (event.propertyName === 'transform' && !this.state.isOpen) {
        // Any cleanup after drawer closes can go here
      }
    }
    
    /**
     * Set the loading state of the drawer
     * @param {boolean} isLoading - Whether the drawer is loading
     */
    setLoading(isLoading) {
      this.state.isLoading = isLoading;
      
      if (this.drawer) {
        if (isLoading) {
          this.drawer.classList.add('loading');
        } else {
          this.drawer.classList.remove('loading');
        }
      }
    }
    
    /**
     * Show an error message
     * @param {string} message - The error message to show
     */
    showError(message) {
      // Create error notification
      const errorElement = document.createElement('div');
      errorElement.classList.add('custom-cart-drawer__error');
      errorElement.textContent = message;
      
      document.body.appendChild(errorElement);
      
      // Remove after a delay
      setTimeout(() => {
        errorElement.classList.add('fade-out');
        setTimeout(() => {
          if (document.body.contains(errorElement)) {
            document.body.removeChild(errorElement);
          }
        }, 300);
      }, 3000);
    }
    
    /**
     * Format money value into currency string
     * @param {number|string} cents - The amount in cents
     * @returns {string} Formatted money string
     */
    formatMoney(cents) {
      if (typeof cents === 'string') {
        cents = cents.replace('.', '');
      }
      
      const value = parseInt(cents || 0, 10);
      const dollars = Math.floor(value / 100);
      const remainingCents = value % 100;
      
      // Format as $X.XX
      return '$' + dollars + '.' + (remainingCents < 10 ? '0' : '') + remainingCents;
    }
    
    /**
     * Get a sized image URL from Shopify's CDN
     * @param {string} url - The original image URL
     * @param {string} size - The desired size
     * @returns {string} The sized image URL
     */
    getSizedImageUrl(url, size) {
      if (!url || !size) return url;
      
      // Check if it's already a Shopify CDN URL with size
      if (url.match(/_(pico|icon|thumb|small|compact|medium|large|grande|original|master)\./)) {
        return url.replace(/_(pico|icon|thumb|small|compact|medium|large|grande|original|master)\./, `_${size}.`);
      }
      
      // Check if it's a Shopify CDN URL without size
      const match = url.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);
      if (match) {
        const prefix = url.split(match[0]);
        const suffix = match[0];
        return `${prefix[0]}_${size}${suffix}`;
      }
      
      // If it's not a Shopify CDN URL, return as is
      return url;
    }
  }
  
  /**
   * CustomCartIcon class to handle the cart icon in the header
   */
  class CustomCartIcon {
    constructor() {
      this.icon = document.querySelector('.custom-cart-icon');
      this.countBubble = document.querySelector('.custom-cart-count-bubble');
      
      this.init();
    }
    
    /**
     * Initialize the cart icon
     */
    init() {
      if (this.icon) {
        this.icon.addEventListener('click', this.handleClick.bind(this));
        
        // Initial cart count
        this.fetchCartCount();
      }
    }
    
    /**
     * Fetch the cart count from the Shopify API
     */
    async fetchCartCount() {
      try {
        const response = await fetch('/cart.js');
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const cart = await response.json();
        this.updateCount(cart.item_count);
      } catch (error) {
        // Silent fail - cart count fetch errors shouldn't interrupt the user experience
      }
    }
    
    /**
     * Update the cart count display
     * @param {number} count - The cart item count
     */
    updateCount(count) {
      if (this.countBubble) {
        if (count > 0) {
          this.countBubble.textContent = count;
          this.countBubble.classList.remove('hidden');
        } else {
          this.countBubble.classList.add('hidden');
        }
      }
    }
    
    /**
     * Handle click on the cart icon
     * @param {Event} event - The click event
     */
    handleClick(event) {
      event.preventDefault();
      
      // Use the global cart drawer object if available
      if (window.customCartDrawer) {
        window.customCartDrawer.open();
        return;
      }
      
      // Fallback to manual handling
      const cartDrawer = document.getElementById('custom-cart-drawer');
      const cartDrawerOverlay = document.getElementById('custom-cart-drawer-overlay');
      
      if (cartDrawer) {
        // Add active class to cart drawer and overlay
        cartDrawer.classList.add('active');
        
        if (cartDrawerOverlay) {
          cartDrawerOverlay.classList.add('active');
        }
        
        // Prevent body scrolling
        document.body.classList.add('custom-cart-drawer-open');
        
        // Trigger a custom cart open event that other components can listen for
        document.dispatchEvent(new CustomEvent('cart:open'));
      }
    }
  }
  
  // Initialize the components
  const cartDrawer = new CustomCartDrawer();
  const cartIcon = new CustomCartIcon();
  
  // Listen for custom events
  document.addEventListener('cart:open', () => {
    cartDrawer.open();
  });
  
  // Make cart drawer accessible globally (for easy access from other scripts)
  window.customCartDrawer = cartDrawer;
});

/**
 * Custom Cart Icon
 * Web component for the cart icon in the header
 */
class CustomCartIcon extends HTMLElement {
  constructor() {
    super();
    
    // Elements
    this.iconContainer = this;
    this.countBubble = this.querySelector('.custom-cart-count-bubble');
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the component
   */
  init() {
    // Add click event listener
    this.addEventListener('click', this.handleClick.bind(this));
    
    // Initialize count display
    this.updateCount();
    
    // Subscribe to cart changes
    document.addEventListener('cart:updated', this.handleCartUpdate.bind(this));
  }
  
  /**
   * Handle click on the cart icon
   * @param {Event} event - The click event
   */
  handleClick(event) {
    event.preventDefault();
    
    // Use the global cart drawer object if available
    if (window.customCartDrawer) {
      window.customCartDrawer.open();
      return;
    }
    
    // Fallback to manual handling
    const cartDrawer = document.getElementById('custom-cart-drawer');
    const cartDrawerOverlay = document.getElementById('custom-cart-drawer-overlay');
    
    if (cartDrawer) {
      // Add active class to cart drawer and overlay
      cartDrawer.classList.add('active');
      
      if (cartDrawerOverlay) {
        cartDrawerOverlay.classList.add('active');
      }
      
      // Prevent body scrolling
      document.body.classList.add('custom-cart-drawer-open');
      
      // Trigger a custom cart open event that other components can listen for
      document.dispatchEvent(new CustomEvent('cart:open'));
    }
  }
  
  /**
   * Handle updates to the cart
   */
  handleCartUpdate(event) {
    this.updateCount(event.detail?.count);
  }
  
  /**
   * Update the cart count display
   * @param {number} count - The current cart count
   */
  updateCount(count) {
    // If count not provided, fetch from cart's session storage if available
    if (count === undefined) {
      const cartState = window.sessionStorage.getItem('cartState');
      if (cartState) {
        try {
          const parsedState = JSON.parse(cartState);
          count = parsedState.itemCount || 0;
        } catch (e) {
          count = 0;
        }
      } else {
        // Fallback to checking data attribute
        count = parseInt(this.dataset.count || '0', 10);
      }
    }
    
    // Update count bubble
    if (this.countBubble) {
      this.countBubble.textContent = count;
      
      // Show/hide based on count
      if (count > 0) {
        this.countBubble.classList.remove('hidden');
      } else {
        this.countBubble.classList.add('hidden');
      }
    }
    
    // Update data attribute
    this.dataset.count = count;
  }
}

// Define the custom element
customElements.define('custom-cart-icon', CustomCartIcon); 