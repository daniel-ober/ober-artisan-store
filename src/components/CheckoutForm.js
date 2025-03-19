// src/components/CheckoutForm.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CheckoutForm = ({ cart }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });
  const [billingAddress, setBillingAddress] = useState({
    line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });
  const [isBillingSameAsShipping, setIsBillingSameAsShipping] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ✅ Ensure API URL is correctly loaded

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      // ✅ Validate product quantities before proceeding
      console.log("📡 Sending Cart Validation Request...");
      const validationResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/validate-cart-before-checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart }),
        }
      );

      const validationResult = await validationResponse.json();

      if (validationResponse.status === 400 && validationResult.invalidItems) {
        // Redirect back to cart and show unavailable products
        console.warn("⚠️ Some items are unavailable:", validationResult.invalidItems);
        navigate("/cart", { state: { invalidItems: validationResult.invalidItems } });
        return;
      }

      // ✅ Proceed to create Stripe checkout session
      console.log("📡 Creating Stripe Checkout Session...");
      const checkoutResponse = await fetch(
        `${process.env.REACT_APP_API_URL}createCheckoutSession`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        }
      );

      const session = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        throw new Error(session.error || "Failed to create checkout session");
      }

      console.log("✅ Redirecting to Stripe Checkout:", session.url);
      window.location.href = session.url;
    } catch (error) {
      console.error("❌ Checkout error:", error);
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
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Last Name:
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Email:
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Phone:
          <input
            type="text"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
          />
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
          <input
            type="text"
            value={shippingAddress.line1}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, line1: e.target.value })
            }
            required
          />
        </label>
      </div>
      <div>
        <label>
          City:
          <input
            type="text"
            value={shippingAddress.city}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, city: e.target.value })
            }
            required
          />
        </label>
      </div>
      <div>
        <label>
          State:
          <input
            type="text"
            value={shippingAddress.state}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, state: e.target.value })
            }
            required
          />
        </label>
      </div>
      <div>
        <label>
          Postal Code:
          <input
            type="text"
            value={shippingAddress.postal_code}
            onChange={(e) =>
              setShippingAddress({
                ...shippingAddress,
                postal_code: e.target.value,
              })
            }
            required
          />
        </label>
      </div>
      <div>
        <label>
          Country:
          <input
            type="text"
            value={shippingAddress.country}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, country: e.target.value })
            }
            required
          />
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
                onChange={(e) =>
                  setBillingAddress({ ...billingAddress, line1: e.target.value })
                }
                required
              />
            </label>
          </div>
          <div>
            <label>
              City:
              <input
                type="text"
                value={billingAddress.city}
                onChange={(e) =>
                  setBillingAddress({ ...billingAddress, city: e.target.value })
                }
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
                onChange={(e) =>
                  setBillingAddress({ ...billingAddress, state: e.target.value })
                }
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
                onChange={(e) =>
                  setBillingAddress({
                    ...billingAddress,
                    postal_code: e.target.value,
                  })
                }
                required
              />
            </label>
          </div>
        </>
      )}
      <button type="submit" disabled={loading}>
        {loading ? "Processing..." : "Checkout"}
      </button>
    </form>
  );
};

export default CheckoutForm;
