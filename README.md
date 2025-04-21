# Custom Shopify Components

A collection of custom JavaScript components designed to enhance the Shopify storefront experience with improved product pages and cart functionality.

## Features

### 1. Custom Product Page Components

![Product Page](https://via.placeholder.com/800x400?text=Product+Page+Component)

- **Interactive Product Gallery** with thumbnails and featured image
- **Dynamic Variant Selection** with automatic image updates
- **Quantity Selector** with min/max validation
- **Responsive Design** for all device sizes

### 2. Custom Cart Drawer

![Cart Drawer](https://via.placeholder.com/800x400?text=Cart+Drawer+Component)

- **Slide-out Cart** with smooth animations
- **AJAX Cart Updates** without page refreshes
- **Real-time Quantity Updates** for cart items
- **Cart Note Functionality** for special instructions

## Installation

1. Add the JavaScript files to your Shopify theme's assets folder:

   - `custom-product-components.js`
   - `custom-cart-drawer.js`

2. Add the CSS files to your theme's assets folder:

   - `section-main-custom-product.css`
   - `custom-cart-drawer.css`

3. Include the scripts and styles in your theme by adding to `theme.liquid`:

   ```liquid
   {{ 'custom-product-components.js' | asset_url | script_tag }}
   {{ 'custom-cart-drawer.js' | asset_url | script_tag }}
   {{ 'section-main-custom-product.css' | asset_url | stylesheet_tag }}
   {{ 'custom-cart-drawer.css' | asset_url | stylesheet_tag }}
   ```

4. Copy the required HTML templates to your theme:
   - `sections/main-custom-product.liquid`
   - Include the cart drawer snippet in your theme's layout file

## Usage

### Setting Up the Product Page

1. Create a new section in your theme using the `main-custom-product.liquid` template
2. Add the section to your product template:
   ```liquid
   {% section 'main-custom-product' %}
   ```

### Setting Up the Cart Drawer

1. Add the cart drawer HTML structure to your theme's layout file
2. Ensure the cart icon in your header has the appropriate classes and data attributes

## Component Documentation

### ProductGallery

Manages the product image gallery with thumbnails and featured media.

```javascript
// Initialize a gallery
const gallery = new ProductGallery(container);
```

**Methods:**

- `handleThumbnailClick(event)`: Process thumbnail selection
- `updateFeaturedMedia(media)`: Update the main product image
- `setActiveThumbnail(thumbnail)`: Highlight the selected thumbnail
- `setActiveByMediaId(mediaId)`: Find and activate a thumbnail by ID

### CustomQuantityInput

Web component that handles quantity inputs with increment/decrement buttons.

```html
<custom-quantity-input>
  <button name="minus">-</button>
  <input type="number" value="1" min="1" max="5" />
  <button name="plus">+</button>
</custom-quantity-input>
```

**Features:**

- Validates input against min/max values
- Provides visual feedback when max quantity is reached
- Updates "Add to Cart" button states

### CustomVariantSelector

Web component that handles product variant selection with color swatches.

```html
<custom-variant-selector>
  <!-- Variant options render here -->
</custom-variant-selector>
```

**Features:**

- Updates product images when colors change
- Updates form values for correct checkout
- Manages availability status

### CustomCartDrawer

Manages the slide-out cart with AJAX updates.

```javascript
// The drawer initializes automatically
document.addEventListener("DOMContentLoaded", function () {
  new CustomCartDrawer();
});
```

**Methods:**

- `addToCart(form)`: Add items via AJAX
- `updateCartItem(key, quantity)`: Update item quantities
- `open()` / `close()`: Control drawer visibility

## Customization

### Theme Settings

The components automatically use your theme's styles and color scheme. You can customize:

- Gallery layout and image sizes
- Variant selector style (buttons vs. dropdowns)
- Cart drawer width and animation timing

### CSS Variables

Both components use CSS variables for easy theming:

```css
:root {
  --color-nocturnal: 43, 48, 63;
  --color-mediterraneo: 68, 93, 108;
  --color-ocean-fog: 160, 185, 185;
  --color-potters-clay: 145, 125, 115;
  --color-mushroom: 203, 193, 179;
  --color-white-linen: 247, 247, 237;
}
```

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- IE11 (basic functionality)
