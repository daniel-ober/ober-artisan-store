// src/components/CheckoutForm.js
import React, { useState } from 'react';

const CheckoutForm = ({ onPaymentSuccess, cart }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });
  const [billingAddress, setBillingAddress] = useState({
    line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });
  const [isBillingSameAsShipping, setIsBillingSameAsShipping] = useState(true);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const response = await fetch('http://localhost:5959/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: cart,
        firstName,
        lastName,
        customerEmail,
        customerPhone,
        promoCode,
        shippingAddress,
        billingAddress: isBillingSameAsShipping ? shippingAddress : billingAddress,
      }),
    });

    const session = await response.json();
    window.location.href = session.url;
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
          <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
        </label>
      </div>

      <div>
        <label>
          Promotional Code:
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter promo code"
          />
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
          <input type="checkbox" checked={isBillingSameAsShipping} onChange={() => setIsBillingSameAsShipping(!isBillingSameAsShipping)} />
        </label>
      </div>

      {!isBillingSameAsShipping && (
        <>
          <h3>Billing Address</h3>
          <div>
            <label>
              Address Line 1:
              <input type="text" value={billingAddress.line1} onChange={(e) => setBillingAddress({ ...billingAddress, line1: e.target.value })} required />
            </label>
          </div>
          <div>
            <label>
              City:
              <input type="text" value={billingAddress.city} onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })} required />
            </label>
          </div>
          <div>
            <label>
              State:
              <input type="text" value={billingAddress.state} onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })} required />
            </label>
          </div>
          <div>
            <label>
              Postal Code:
              <input type="text" value={billingAddress.postal_code} onChange={(e) => setBillingAddress({ ...billingAddress, postal_code: e.target.value })} required />
            </label>
          </div>
          <div>
            <label>
              Country:
              <input type="text" value={billingAddress.country} onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })} required />
            </label>
          </div>
        </>
      )}

      <button type="submit">Checkout</button>
    </form>
  );
};

export default CheckoutForm;