/**
 * Custom Product Components
 * A set of custom web components for enhancing product pages in Shopify
 */

/**
 * Product Gallery Component
 * Handles thumbnail clicks and updating the featured media
 */
class ProductGallery {
  constructor(container) {
    if (!container) return;

    this.container = container;
    this.featuredMedia = container.querySelector('.custom-product__featured-media');
    this.thumbnailButtons = container.querySelectorAll('.custom-product__thumbnail-button');
    
    // Check if we have a proper gallery to initialize
    if (!this.featuredMedia) return;
    
    // Add click event listeners to thumbnails
    this.thumbnailButtons.forEach(button => {
      button.addEventListener('click', this.handleThumbnailClick.bind(this));
    });
  }
  
  /**
   * Handle thumbnail click events
   * @param {Event} event - The click event
   */
  handleThumbnailClick(event) {
    const thumbnail = event.currentTarget;
    const mediaId = thumbnail.dataset.mediaId;
    
    if (!mediaId) return;
    
    // Create a media object from the thumbnail data attributes
    const media = {
      id: mediaId,
      src: thumbnail.dataset.src || thumbnail.querySelector('img')?.src,
      alt: thumbnail.dataset.alt || thumbnail.querySelector('img')?.alt || '',
      width: parseInt(thumbnail.dataset.width, 10) || undefined,
      height: parseInt(thumbnail.dataset.height, 10) || undefined
    };
    
    if (media.src) {
      // Mark this thumbnail as active before updating the image
      this.setActiveThumbnail(thumbnail);
      
      // Update the featured media with the selected media
      this.updateFeaturedMedia(media);
    }
  }
  
  /**
   * Update the featured media with the selected media
   * @param {Object} media - The media object
   */
  updateFeaturedMedia(media) {
    if (!media || !this.featuredMedia) return;
    
    // Add loading state before updating
    this.featuredMedia.classList.add('loading');
    
    // Clear the current content
    this.featuredMedia.innerHTML = '';
    
    // Create new image element
    const img = document.createElement('img');
    
    // Set image source and attributes based on media format
    if (media.preview_image && media.preview_image.src) {
      // Handle Shopify media object with preview_image
      img.src = media.preview_image.src;
      img.alt = media.alt || media.preview_image.alt || '';
      
      // Generate srcset if we have dimensions
      if (media.preview_image.width) {
        img.srcset = this.generateSrcset(media.preview_image.src, media.preview_image.width);
      }
    } else if (media.src) {
      // Handle simple media object with direct src
      img.src = media.src;
      img.alt = media.alt || '';
      
      // Generate srcset if we have dimensions
      if (media.width) {
        img.srcset = this.generateSrcset(media.src, media.width);
      }
    }
    
    // Add loading and dimensions if available
    img.loading = 'eager';
    if (media.width || media.preview_image?.width) img.width = media.width || media.preview_image.width;
    if (media.height || media.preview_image?.height) img.height = media.height || media.preview_image.height;
    img.classList.add('custom-product__featured-image');
    img.dataset.mediaId = media.id;
    
    // Handle image load
    img.onload = () => {
      this.featuredMedia.classList.remove('loading');
    };
    
    // Add the new image
    this.featuredMedia.appendChild(img);
  }
  
  /**
   * Generate a srcset for responsive images
   * @param {string} src - The original image URL
   * @param {number} width - The original image width
   * @returns {string} The srcset attribute value
   */
  generateSrcset(src, width) {
    if (!src || !width) return '';
    
    // Return a srcset with multiple size options
    const widths = [180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 2048];
    return widths
      .filter(w => w <= width * 2) // Only include sizes up to 2x the original
      .map(w => {
        // If URL contains dimensions, replace them with new width
        let newSrc = src;
        if (src.includes('_')) {
          newSrc = src.replace(/(_\d+x)/, `_${w}x`);
        }
        return `${newSrc} ${w}w`;
      })
      .join(', ');
  }
  
  /**
   * Set the active thumbnail
   * @param {HTMLElement} thumbnail - The thumbnail element to set as active
   */
  setActiveThumbnail(thumbnail) {
    // Remove active class from all thumbnails
    this.thumbnailButtons.forEach(thumb => {
      thumb.classList.remove('active');
      thumb.setAttribute('aria-selected', 'false');
    });
    
    // Add active class to selected thumbnail
    if (thumbnail) {
      thumbnail.classList.add('active');
      thumbnail.setAttribute('aria-selected', 'true');
    }
  }
  
  /**
   * Find thumbnail by media ID and set it as active
   * @param {string} mediaId - The media ID to find
   * @returns {boolean} Whether the thumbnail was found and set
   */
  setActiveByMediaId(mediaId) {
    if (!mediaId) return false;
    
    const thumbnail = Array.from(this.thumbnailButtons).find(thumb => 
      thumb.dataset.mediaId === mediaId.toString()
    );
    
    if (thumbnail) {
      this.setActiveThumbnail(thumbnail);
      return true;
    }
    
    return false;
  }
}

/**
 * Custom Quantity Input Component
 * Handles increase/decrease buttons for quantity inputs
 */
class CustomQuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });
    this.form = this.closest('.custom-product__form');
    this.maxExceededMessage = this.form?.querySelector('.custom-product__quantity-message');
    this.addButton = this.form?.querySelector('.custom-product__add-button');
    
    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  /**
   * Handle button clicks (increase/decrease)
   * @param {Event} event - The click event
   */
  onButtonClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const input = this.querySelector('input');
    const value = Number(input.value);
    const step = Number(input.step) || 1;
    const max = Number(input.max) || 5; // Default max to 5 if not specified
    
    if (button.name === 'plus') {
      // Check if adding more would exceed the maximum
      if (value + step > max) {
        input.value = max;
        this.showQuantityLimitMessage();
        this.disableAddButton();
      } else {
        input.value = value + step;
        if (value + step === max) {
          this.showQuantityLimitMessage();
          this.disableAddButton();
        } else {
          this.hideQuantityLimitMessage();
          this.enableAddButton();
        }
      }
    } else {
      input.value = value - step < 1 ? 1 : value - step;
      // If decreasing from max, enable button and hide message
      if (value === max && value - step < max) {
        this.hideQuantityLimitMessage();
        this.enableAddButton();
      }
    }
    
    input.dispatchEvent(this.changeEvent);
  }
  
  /**
   * Set up event listeners when element is connected
   */
  connectedCallback() {
    if (this.input) {
      this.input.addEventListener('change', this.validateInput.bind(this));
      this.input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.validateInput();
        }
      });
      
      // Initial validation to handle pre-filled values
      setTimeout(() => this.validateInput(), 100);
    }
  }

  /**
   * Validate the input value and ensure it's between min and max values
   */
  validateInput() {
    const min = parseInt(this.input.min, 10) || 1;
    const max = parseInt(this.input.max, 10) || 5; // Default max to 5 if not specified
    const value = parseInt(this.input.value, 10);
    
    if (isNaN(value) || value < min) {
      this.input.value = min;
      this.hideQuantityLimitMessage();
      this.enableAddButton();
    } else if (value > max) {
      this.input.value = max;
      this.showQuantityLimitMessage();
      this.disableAddButton();
    } else if (value === max) {
      this.showQuantityLimitMessage();
      this.disableAddButton();
    } else {
      this.hideQuantityLimitMessage();
      this.enableAddButton();
    }
  }
  
  /**
   * Show the quantity limit message
   */
  showQuantityLimitMessage() {
    if (this.maxExceededMessage) {
      this.maxExceededMessage.style.display = 'block';
    }
  }
  
  /**
   * Hide the quantity limit message
   */
  hideQuantityLimitMessage() {
    if (this.maxExceededMessage) {
      this.maxExceededMessage.style.display = 'none';
    }
  }
  
  /**
   * Disable the add to cart button and show the appropriate message
   * @param {boolean} maxQuantity - Whether the maximum quantity was reached
   */
  disableAddButton() {
    if (!this.addButton) return;
    
    // Disable the button
    this.addButton.setAttribute('disabled', 'disabled');
    
    // If we're at max quantity, add the max-quantity class
    if (this.isAtMaxQuantity()) {
      this.addButton.classList.add('max-quantity');
      
      // Show the max quantity message
      this.showQuantityLimitMessage();
    } else {
      // Standard loading state
      this.addButton.classList.add('loading');
      
      // Make button text transparent to show only the spinner
      const buttonText = this.addButton.querySelector('span');
      if (buttonText) {
        buttonText.style.color = 'transparent';
      }
    }
  }
  
  /**
   * Enable the add to cart button
   */
  enableAddButton() {
    if (!this.addButton) return;
    
    // Remove disabled attribute
    this.addButton.removeAttribute('disabled');
    
    // Remove special classes
    this.addButton.classList.remove('max-quantity', 'loading');
    
    // Restore button text color
    const buttonText = this.addButton.querySelector('span');
    if (buttonText) {
      buttonText.style.color = '';
    }
    
    // Hide quantity message
    this.hideQuantityLimitMessage();
  }

  /**
   * Check if the current quantity is at the maximum allowed
   * @returns {boolean} True if at max quantity
   */
  isAtMaxQuantity() {
    if (!this.input) return false;
    const max = Number(this.input.max) || 5; // Default max to 5 if not specified
    const value = Number(this.input.value);
    return value >= max;
  }
}

/**
 * Custom Variant Selector Component
 * Handles variant selection and updates the form ID when a variant is selected
 */
class CustomVariantSelector extends HTMLElement {
  constructor() {
    super();
    this.gallery = null;
    this.colorOptionIndex = -1;
    this.variantData = [];
    this.mediaByVariantId = new Map();
    this.addButton = null;
    this.addButtonText = '';
  }
  
  /**
   * Set up the variant selector when the element is connected
   */
  connectedCallback() {
    // Parse variant data
    try {
      this.variantData = JSON.parse(this.querySelector('script').textContent || '[]');
      
      // Pre-process variant media data for quick lookup
      this.variantData.forEach(variant => {
        if (variant.featured_media && variant.featured_media.id) {
          this.mediaByVariantId.set(variant.id.toString(), variant.featured_media);
        }
      });
    } catch (error) {
      this.variantData = [];
    }
    
    // Find the color option index if it exists
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    fieldsets.forEach((fieldset, index) => {
      const legend = fieldset.querySelector('legend');
      if (legend && (legend.textContent.toLowerCase().includes('color') || 
                    legend.textContent.toLowerCase().includes('colour'))) {
        this.colorOptionIndex = index;
      }
    });
    
    // Find the associated gallery
    const productContainer = this.closest('.custom-product__container');
    if (productContainer) {
      const galleryContainer = productContainer.querySelector('.custom-product__gallery');
      if (galleryContainer) {
        // Find the gallery instance in the DOM
        this.gallery = galleryContainer;
      }
      
      // Find the add to cart button
      this.addButton = productContainer.querySelector('.custom-product__add-button');
      if (this.addButton) {
        this.addButtonText = this.addButton.textContent.trim();
      }
    }
    
    // Update form ID when variant changes
    this.addEventListener('change', this.onVariantChange.bind(this));
    
    // Initialize with the current selected variant
    if (this.variantData.length > 0) {
      this.onVariantChange();
    }
  }
  
  /**
   * Handle variant changes
   * @param {Event} event - The change event
   */
  onVariantChange(event) {
    // Find the selected variant option
    const selectedOptions = Array.from(this.querySelectorAll('input:checked')).map(input => input.value);
    
    if (selectedOptions.length === 0 || !this.variantData.length) return;
    
    // Find the matching variant
    const variant = this.variantData.find(v => {
      return v.options.every((option, index) => option === selectedOptions[index]);
    });
    
    if (!variant) return;
    
    // Update the form ID
    const form = document.getElementById('custom-product-form');
    if (form) {
      const idInput = form.querySelector('input[name="id"]');
      if (idInput) {
        idInput.value = variant.id;
      }
    }
    
    // Update button state based on variant availability
    this.updateAddButtonState(variant);
    
    // Check if we should update the media
    let shouldUpdateMedia = false;
    
    if (!event) {
      // This is initialization, show the variant image
      shouldUpdateMedia = true;
    } else if (event.target) {
      // Check if this is a color input
      const targetInput = event.target;
      const fieldset = targetInput.closest('fieldset');
      const legend = fieldset?.querySelector('legend');
      
      if (legend && (
        legend.textContent.toLowerCase().includes('color') || 
        legend.textContent.toLowerCase().includes('colour')
      )) {
        shouldUpdateMedia = true;
      }
    }
    
    // Update the featured media if needed
    if (shouldUpdateMedia && variant.featured_media) {
      this.updateVariantMedia(variant);
    }
  }
  
  /**
   * Update the add to cart button state based on variant availability
   * @param {Object} variant - The variant object
   */
  updateAddButtonState(variant) {
    if (!this.addButton) return;
    
    // Find or create the text span in the button
    let buttonText = this.addButton.querySelector('span');
    if (!buttonText) {
      // If no span exists, wrap the text content in a span
      const originalText = this.addButton.textContent.trim();
      this.addButton.textContent = '';
      buttonText = document.createElement('span');
      buttonText.textContent = originalText;
      this.addButton.appendChild(buttonText);
    }
    
    // Store original text if not already stored
    if (!this.addButtonText) {
      this.addButtonText = buttonText.textContent;
    }
    
    // Check if the variant is available
    const isAvailable = variant.available === true;
    
    if (isAvailable) {
      // Variant is available - restore original state
      this.addButton.disabled = false;
      buttonText.textContent = this.addButtonText;
      buttonText.style.color = '';
      this.addButton.classList.remove('sold-out', 'loading');
    } else {
      // Variant is sold out - update button
      this.addButton.disabled = true;
      buttonText.textContent = 'Out of Stock';
      this.addButton.classList.add('sold-out');
      this.addButton.classList.remove('loading');
    }
  }
  
  /**
   * Update the variant media directly without using the section rendering API
   * @param {Object} variant - The variant object with media information
   */
  updateVariantMedia(variant) {
    if (!variant || !variant.featured_media) return;
    
    // Try to find gallery if it doesn't exist
    if (!this.gallery) {
      const productContainer = this.closest('.custom-product__container');
      if (productContainer) {
        this.gallery = productContainer.querySelector('.custom-product__gallery');
      }
    }
    
    if (!this.gallery) return;
    
    // Get gallery instance if available, or initialize a new instance
    let galleryInstance = null;
    if (this.gallery.id && window.productGalleryInstances && window.productGalleryInstances[this.gallery.id]) {
      galleryInstance = window.productGalleryInstances[this.gallery.id];
    } else {
      galleryInstance = new ProductGallery(this.gallery);
    }
    
    // If we have a gallery instance
    if (galleryInstance) {
      const mediaId = variant.featured_media.id.toString();
      
      // First try to find and click the thumbnail with this media ID
      const didSetThumbnail = galleryInstance.setActiveByMediaId(mediaId);
      
      if (didSetThumbnail) {
        // Find the thumbnail with this media ID and trigger a click
        const thumbnail = this.gallery.querySelector(`.custom-product__thumbnail-button[data-media-id="${mediaId}"]`);
        if (thumbnail) {
          thumbnail.click();
          return;
        }
      }
      
      // If no matching thumbnail found, update featured media directly
      const featuredMedia = this.gallery.querySelector('.custom-product__featured-media');
      if (featuredMedia) {
        galleryInstance.updateFeaturedMedia(variant.featured_media);
      }
    }
  }
}

// Initialize all components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize product gallery
  const galleryContainers = document.querySelectorAll('.custom-product__gallery');
  window.productGalleryInstances = {};
  
  galleryContainers.forEach(container => {
    // Check if gallery is already initialized to avoid duplicate initialization
    if (container.dataset.initialized === 'true') return;
    
    // Initialize gallery
    const gallery = new ProductGallery(container);
    
    // Store the gallery instance globally for easy access
    if (container.id) {
      window.productGalleryInstances[container.id] = gallery;
    }
    
    // Mark as initialized
    container.dataset.initialized = 'true';
  });

  // Initialize variant selectors with references to galleries
  const variantSelectors = document.querySelectorAll('custom-variant-selector');
  variantSelectors.forEach(selector => {
    // Find the associated gallery for this variant selector
    const productContainer = selector.closest('.custom-product__container');
    if (productContainer) {
      const gallery = productContainer.querySelector('.custom-product__gallery');
      if (gallery) {
        // Add gallery reference to the variant selector
        selector.gallery = gallery;
      }
    }
  });
  
  // Register custom elements
  if (!customElements.get('custom-variant-selector')) {
    customElements.define('custom-variant-selector', CustomVariantSelector);
  }
  
  if (!customElements.get('custom-quantity-input')) {
    customElements.define('custom-quantity-input', CustomQuantityInput);
  }
});