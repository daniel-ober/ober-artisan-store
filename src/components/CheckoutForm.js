import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

// Use env or default to deployed Functions URL
const API_BASE =
  (process.env.REACT_APP_API_URL &&
    process.env.REACT_APP_API_URL.replace(/\/+$/, '')) ||
  'https://us-central1-danoberartisandrums.cloudfunctions.net/api';

const CheckoutForm = () => {
  const { cart } = useCart();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
  });
  const [billingAddress, setBillingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
  });
  const [isBillingSameAsShipping, setIsBillingSameAsShipping] = useState(true);
  const [loading, setLoading] = useState(false);

  // Normalizer helpers
  const norm = (s) => (s ?? '').toString().trim();
  const normLower = (s) => norm(s).toLowerCase();
  function normUpper(s) { return norm(s).toUpperCase(); }

  // Build the products payload your Cloud Function expects
  const buildProductsPayload = () =>
    cart.map((item) => {
      const cfg = item.config || {};
      const isMerch = item.category === 'merch';
      const isFoundersToast = item.productId === 'founders-toast';

      // pick best image
      const img =
        typeof item.image === 'string'
          ? item.image
          : (Array.isArray(item.images) && item.images.length ? item.images[0] : '');

      // config payload
      let configPayload = {};
      if (item.category === 'artisan' && !isFoundersToast) {
        configPayload = {
          size: norm(cfg.size),
          depth: norm(cfg.depth),
          lugQuantity: norm(cfg.lugQuantity),
          staveQuantity: norm(cfg.staveQuantity),
          reRing: typeof cfg.reRing !== 'undefined' ? !!cfg.reRing : undefined,
          hardwareColor: norm(cfg.hardwareColor),
          outerShell: norm(cfg.outerShell),
          innerStave: norm(cfg.innerStave),
        };
      } else if (isMerch) {
        const sizeValue = cfg.Sizes || cfg.size || cfg.sizeName || '';
        const colorValue = cfg.Colors || cfg.color || cfg.colorName || '';
        const variantId = item.variantId || cfg.variantId || '';
        configPayload = {
          sizeName: norm(sizeValue),
          colorName: norm(colorValue),
          variantId: norm(variantId),
        };
      }

      // for merch we use price_data (ephemeral), so omit saved priceId
      let stripePriceId = item.stripePriceId || '';
      if (isMerch) stripePriceId = '';

      return {
        productId: String(item.productId),
        name: item.name || item.title || 'Ober Product',
        category: item.category, // "merch" | "artisan"
        stripePriceId,
        price: Number(item.price) || 0, // dollars, used when we don't pass a saved priceId
        quantity: item.quantity || 1,
        image: img,
        config: configPayload,
      };
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (!cart.length) {
        alert('Your cart is empty');
        return;
      }

      const payload = {
        products: buildProductsPayload(),
        firstName: norm(firstName),
        lastName: norm(lastName),
        customerEmail: norm(customerEmail),
        customerPhone: norm(customerPhone),
        promoCode: norm(promoCode),
        shippingAddress: {
          ...shippingAddress,
          line1: norm(shippingAddress.line1),
          line2: norm(shippingAddress.line2),
          city: norm(shippingAddress.city),
          state: norm(shippingAddress.state),
          postal_code: norm(shippingAddress.postal_code),
          country: normUpper(shippingAddress.country || 'US'),
          firstName: norm(firstName),
          lastName: norm(lastName),
          email: norm(customerEmail),
        },
        billingAddress: isBillingSameAsShipping
          ? {
              ...shippingAddress,
              firstName: norm(firstName),
              lastName: norm(lastName),
              email: norm(customerEmail),
            }
          : {
              ...billingAddress,
              line1: norm(billingAddress.line1),
              line2: norm(billingAddress.line2),
              city: norm(billingAddress.city),
              state: norm(billingAddress.state),
              postal_code: norm(billingAddress.postal_code),
              country: normUpper(billingAddress.country || 'US'),
              firstName: norm(firstName),
              lastName: norm(lastName),
              email: norm(customerEmail),
            },
      };

      // Create the Stripe session (this calls Printify and injects shipping_options)
      const res = await fetch(`${API_BASE}/createCheckoutSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Failed to create checkout session');
      }

      sessionStorage.setItem('checkoutStarted', 'true');
      window.location.href = data.url;
    } catch (error) {
      console.error('❌ Checkout error:', error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Checkout</h2>

      <div>
        <label>
          First Name:
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
      </div>

      <div>
        <label>
          Last Name:
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </label>
      </div>

      <div>
        <label>
          Email:
          <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required />
        </label>
      </div>

      <div>
        <label>
          Phone:
          <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        </label>
      </div>

      <div>
        <label>
          Promotional Code:
          <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Enter promo code" />
        </label>
      </div>

      <h3>Shipping Address</h3>

      <div>
        <label>
          Address Line 1:
          <input type="text" value={shippingAddress.line1} onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })} required />
        </label>
      </div>

      <div>
        <label>
          Address Line 2:
          <input type="text" value={shippingAddress.line2} onChange={(e) => setShippingAddress({ ...shippingAddress, line2: e.target.value })} />
        </label>
      </div>

      <div>
        <label>
          City:
          <input type="text" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} required />
        </label>
      </div>

      <div>
        <label>
          State:
          <input type="text" value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })} required />
        </label>
      </div>

      <div>
        <label>
          Postal Code:
          <input type="text" value={shippingAddress.postal_code} onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })} required />
        </label>
      </div>

      <div>
        <label>
          Country:
          <input type="text" value={shippingAddress.country} onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })} required />
        </label>
      </div>

      <div>
        <label>
          Billing address is the same as shipping:
          <input
            type="checkbox"
            checked={isBillingSameAsShipping}
            onChange={() => setIsBillingSameAsShipping(!isBillingSameAsShipping)}
          />
        </label>
      </div>

      {!isBillingSameAsShipping && (
        <>
          <h3>Billing Address</h3>

          <div>
            <label>
              Address Line 1:
              <input
                type="text"
                value={billingAddress.line1}
                onChange={(e) => setBillingAddress({ ...billingAddress, line1: e.target.value })}
                required
              />
            </label>
          </div>

          <div>
            <label>
              Address Line 2:
              <input
                type="text"
                value={billingAddress.line2}
                onChange={(e) => setBillingAddress({ ...billingAddress, line2: e.target.value })}
              />
            </label>
          </div>

          <div>
            <label>
              City:
              <input
                type="text"
                value={billingAddress.city}
                onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                required
              />
            </label>
          </div>

          <div>
            <label>
              State:
              <input
                type="text"
                value={billingAddress.state}
                onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                required
              />
            </label>
          </div>

          <div>
            <label>
              Postal Code:
              <input
                type="text"
                value={billingAddress.postal_code}
                onChange={(e) => setBillingAddress({ ...billingAddress, postal_code: e.target.value })}
                required
              />
            </label>
          </div>

          <div>
            <label>
              Country:
              <input
                type="text"
                value={billingAddress.country}
                onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
                required
              />
            </label>
          </div>
        </>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Checkout'}
      </button>
    </form>
  );
};

export default CheckoutForm;