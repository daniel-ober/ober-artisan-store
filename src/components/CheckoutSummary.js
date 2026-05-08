import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, Link } from 'react-router-dom';

import { useCart } from '../context/CartContext';

import './CheckoutSummary.css';

const MAX_LOOKUP_ATTEMPTS = 10;

const LOOKUP_DELAY_MS = 1800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getApiBaseUrl = () => {

  const raw = String(process.env.REACT_APP_API_URL || '').trim();

  return raw.replace(/\/+$/, '');

};

const buildOrderLookupUrl = (sessionId) => {

  const apiBase = getApiBaseUrl();

  if (!apiBase) {

    return `/api/orders/by-session/${sessionId}`;

  }

  if (apiBase.endsWith('/api')) {

    return `${apiBase}/orders/by-session/${sessionId}`;

  }

  return `${apiBase}/api/orders/by-session/${sessionId}`;

};

const formatMoney = (value = 0, currency = 'usd') => {

  const amount = Number(value || 0);

  try {

    return new Intl.NumberFormat('en-US', {

      style: 'currency',

      currency: String(currency || 'usd').toUpperCase(),

    }).format(amount);

  } catch {

    return `$${amount.toFixed(2)}`;

  }

};

const formatOrderDate = (createdAt) => {

  if (createdAt?._seconds) {

    return new Date(createdAt._seconds * 1000).toLocaleString();

  }

  if (createdAt?.seconds) {

    return new Date(createdAt.seconds * 1000).toLocaleString();

  }

  return 'Processing';

};

const getFriendlyStatus = (status = '') => {

  const normalized = String(status || '').toLowerCase();

  if (

    normalized.includes('successful') ||

    normalized.includes('success') ||

    normalized.includes('paid') ||

    normalized.includes('complete')

  ) {

    return 'Payment approved';

  }

  if (

    normalized.includes('declined') ||

    normalized.includes('failed') ||

    normalized.includes('canceled') ||

    normalized.includes('cancelled')

  ) {

    return 'Payment not completed';

  }

  return status || 'Order received';

};

const getCleanOrderId = (fullOrderId = '') => {

  return fullOrderId?.startsWith('ORD-') ? fullOrderId.slice(4) : fullOrderId;

};

const getItemCategory = (item = {}) => {

  const explicitCategory =

    item.category || item.variant?.category || item.config?.category || '';

  if (explicitCategory) return explicitCategory;

  const name = String(item.name || item.description || '').toLowerCase();

  if (

    name.includes('heritage') ||

    name.includes('feuzon') ||

    name.includes('soundlegend')

  ) {

    return 'artisan';

  }

  return 'merch';

};

const renderVariantDetails = (item) => {

  const v = item.variant || item.config || {};

  const name = String(item.name || item.description || '').toLowerCase();

  const category = getItemCategory(item);

  if (name.includes("founder's toast")) {

    return null;

  }

  if (category === 'merch') {

    const merchOptions = [v.size, v.color].filter(Boolean).join(' / ');

    return (

      <div className="variant-details">

        <strong>Options:</strong> {merchOptions || 'Standard'}

      </div>

    );

  }

  if (category === 'artisan') {

    const drumOptions = [

      v.size && v.depth ? `${v.size}" × ${v.depth}"` : '',

      v.lugQuantity && `${v.lugQuantity} Lugs`,

      v.staveQuantity && `${v.staveQuantity} Staves`,

      v.reRing !== undefined && v.reRing !== ''

        ? String(v.reRing).toLowerCase() === 'yes' || v.reRing === true

          ? 'With Re-Rings'

          : 'No Re-Rings'

        : '',

      v.hardwareColor && `Hardware: ${v.hardwareColor}`,

      v.hoopType && `Hoops: ${v.hoopType}`,

      v.scorchDepth && `Finish: ${v.scorchDepth}`,

    ].filter(Boolean);

    return (

      <div className="variant-details">

        <strong>Specs:</strong>{' '}

        {drumOptions.join(' • ') || 'Custom configuration'}

      </div>

    );

  }

  return null;

};

const CheckoutSummary = () => {

  const location = useLocation();

  const { clearCartOnCheckout } = useCart();

  const lookupStartedForSessionRef = useRef('');

  const cartClearedForSessionRef = useRef('');

  const [orderDetails, setOrderDetails] = useState(null);

  const [lookupState, setLookupState] = useState('checking');

  const [error, setError] = useState('');

  const [attemptCount, setAttemptCount] = useState(0);

  const sessionId = useMemo(() => {

    const params = new URLSearchParams(location.search);

    return params.get('session_id') || '';

  }, [location.search]);

  useEffect(() => {

    let isMounted = true;

    const lookupOrder = async () => {

      if (!sessionId) {

        setLookupState('missing-session');

        setError('Session ID missing.');

        return;

      }

      if (lookupStartedForSessionRef.current === sessionId) {

        return;

      }

      lookupStartedForSessionRef.current = sessionId;

      setOrderDetails(null);

      setAttemptCount(0);

      setLookupState('checking');

      setError('');

      for (let attempt = 1; attempt <= MAX_LOOKUP_ATTEMPTS; attempt += 1) {

        if (!isMounted) return;

        setAttemptCount(attempt);

        try {

          const response = await fetch(buildOrderLookupUrl(sessionId));

          if (response.status === 404) {

            if (attempt < MAX_LOOKUP_ATTEMPTS) {

              setLookupState(attempt === 1 ? 'checking' : 'syncing');

              await sleep(LOOKUP_DELAY_MS);

              continue;

            }

            if (!isMounted) return;

            setLookupState('sync-delayed');

            return;

          }

          if (!response.ok) {

            throw new Error(

              `Order lookup failed with status ${response.status}`

            );

          }

          const data = await response.json();

          if (!isMounted) return;

          setOrderDetails(data);

          setLookupState('success');

          if (cartClearedForSessionRef.current !== sessionId) {

            cartClearedForSessionRef.current = sessionId;

            clearCartOnCheckout();

          }

          return;

        } catch (err) {

          if (attempt < MAX_LOOKUP_ATTEMPTS) {

            setLookupState(attempt === 1 ? 'checking' : 'syncing');

            await sleep(LOOKUP_DELAY_MS);

            continue;

          }

          if (!isMounted) return;

          setLookupState('lookup-error');

          setError(err?.message || 'Unable to load order details.');

          return;

        }

      }

    };

    lookupOrder();

    return () => {

      isMounted = false;

    };

  }, [sessionId]);

  const printReceipt = () => window.print();

  if (lookupState === 'missing-session') {

    return (

      <div className="checkout-status-page checkout-status-page--error">

        <div className="checkout-status-card">

          <img

            src="/logos/white_logo.png"

            alt="Ober Artisan Drums"

            className="checkout-status-logo"

          />

          <span className="checkout-status-kicker">Checkout Status</span>

          <h1>We couldn’t find your checkout session.</h1>

          <p>

            This page is missing the Stripe checkout session ID. If you

            completed a purchase, please contact us and we’ll help confirm your

            order.

          </p>

          <div className="checkout-support-box">

            <a href="mailto:support@oberartisandrums.com">

              support@oberartisandrums.com

            </a>

            <a href="tel:+16154450220">615-445-0220</a>

          </div>

          <Link to="/artisan-shop" className="checkout-primary-link">

            Return to Artisan Shop

          </Link>

        </div>

      </div>

    );

  }

  if (lookupState === 'checking' || lookupState === 'syncing') {

    return (

      <div className="checkout-status-page checkout-status-page--loading">

        <div className="checkout-status-card">

          <img

            src="/logos/white_logo.png"

            alt="Ober Artisan Drums"

            className="checkout-status-logo"

          />

          <div className="checkout-spinner" />

          <span className="checkout-status-kicker">Confirming Your Order</span>

          <h1>Your payment is being confirmed.</h1>

          <p>

            Please do not refresh or close this page. Stripe approved checkout

            may take a few moments to sync with your Ober Artisan order record.

          </p>

          <p className="checkout-muted-note">

            Attempt {attemptCount || 1} of {MAX_LOOKUP_ATTEMPTS}

          </p>

        </div>

      </div>

    );

  }

  if (lookupState === 'sync-delayed') {

    return (

      <div className="checkout-status-page checkout-status-page--pending">

        <div className="checkout-status-card">

          <img

            src="/logos/white_logo.png"

            alt="Ober Artisan Drums"

            className="checkout-status-logo"

          />

          <span className="checkout-status-kicker">

            Order Confirmation Pending

          </span>

          <h1>Your checkout was received, but your order details are still syncing.</h1>

          <p>

            This can happen when Stripe finishes payment before the order record

            is ready on our side. Your order is not automatically lost because

            this page is delayed.

          </p>

          <p>

            If you received a charge, receipt, or confirmation email, please

            save this checkout session ID and contact us so we can confirm the

            order manually.

          </p>

          <div className="checkout-session-box">

            <strong>Checkout Session</strong>

            <span>{sessionId}</span>

          </div>

          <div className="checkout-support-box">

            <a href="mailto:support@oberartisandrums.com">

              support@oberartisandrums.com

            </a>

            <a href="tel:+16154450220">615-445-0220</a>

          </div>

          <Link to="/artisan-shop" className="checkout-primary-link">

            Return to Artisan Shop

          </Link>

        </div>

      </div>

    );

  }

  if (lookupState === 'lookup-error') {

    return (

      <div className="checkout-status-page checkout-status-page--error">

        <div className="checkout-status-card">

          <img

            src="/logos/white_logo.png"

            alt="Ober Artisan Drums"

            className="checkout-status-logo"

          />

          <span className="checkout-status-kicker">Order Lookup Error</span>

          <h1>We couldn’t load your order details.</h1>

          <p>

            Your payment may still have completed. Please contact us with the

            checkout session ID below and we’ll confirm your order.

          </p>

          {error && <p className="checkout-error-detail">{error}</p>}

          <div className="checkout-session-box">

            <strong>Checkout Session</strong>

            <span>{sessionId}</span>

          </div>

          <div className="checkout-support-box">

            <a href="mailto:support@oberartisandrums.com">

              support@oberartisandrums.com

            </a>

            <a href="tel:+16154450220">615-445-0220</a>

          </div>

        </div>

      </div>

    );

  }

  if (!orderDetails) {

    return null;

  }

  const {

    orderId: fullOrderId,

    customerName,

    customerEmail,

    customerPhone,

    customerAddress,

    status,

    stripePaymentStatus,

    items = [],

    totalAmount = 0,

    currency = 'usd',

    createdAt,

    stripeSessionId,

  } = orderDetails;

  const orderId = getCleanOrderId(fullOrderId);

  const orderDate = formatOrderDate(createdAt);

  const friendlyStatus = getFriendlyStatus(stripePaymentStatus || status);

  return (

    <div className="transaction-success print-container">

      <div className="checkout-success-hero">

        <div className="print-logo-wrapper">

          <img

            src="/logos/black_logo.png"

            alt="Ober Artisan Drums"

            className="print-logo"

          />

        </div>

        <img

          src="/logos/white_logo.png"

          alt="Ober Artisan Drums"

          className="checkout-success-logo"

        />

        <span className="checkout-success-kicker">Order Received</span>

        <h1>Thank you — your order has been received.</h1>

        <p className="confirmation-msg">

          Your payment was approved and your Ober Artisan order is being

          processed. Order details will be emailed shortly to{' '}

          <strong>{customerEmail}</strong>.

        </p>

      </div>

      <div className="order-details">

        <div className="order-details-header">

          <div>

            <span className="checkout-section-kicker">Order Summary</span>

            <h2>Purchase Details</h2>

          </div>

          <span className="checkout-payment-pill">{friendlyStatus}</span>

        </div>

        <div className="checkout-detail-grid">

          <div>

            <span>Order ID</span>

            <strong>{orderId || fullOrderId || 'Processing'}</strong>

          </div>

          <div>

            <span>Date</span>

            <strong>{orderDate}</strong>

          </div>

          <div>

            <span>Status</span>

            <strong>{friendlyStatus}</strong>

          </div>

          <div>

            <span>Total</span>

            <strong>{formatMoney(totalAmount, currency)}</strong>

          </div>

        </div>

        <section className="checkout-summary-section">

          <h3>Customer Info</h3>

          <div className="checkout-info-list">

            <p>

              <strong>Name:</strong> {customerName || 'N/A'}

            </p>

            <p>

              <strong>Email:</strong> {customerEmail || 'N/A'}

            </p>

            {customerPhone && customerPhone !== 'No phone provided' && (

              <p>

                <strong>Phone:</strong> {customerPhone}

              </p>

            )}

          </div>

        </section>

        <section className="checkout-summary-section">

          <h3>Shipping Address</h3>

          <p>{customerAddress || 'Address confirmation pending'}</p>

        </section>

        <section className="checkout-summary-section">

          <h3>Items Ordered</h3>

          <ul className="checkout-summary-items">

            {items.map((item, idx) => (

              <li

                key={`${item.name || item.description || 'item'}-${idx}`}

                className="checkout-summary-item"

              >

                <div className="checkout-summary-item-main">

                  <strong>{item.name || item.description || 'Item'}</strong>

                  <span>

                    {formatMoney(item.price || 0, currency)} ×{' '}

                    {item.quantity || 1}

                  </span>

                </div>

                {renderVariantDetails(item)}

              </li>

            ))}

          </ul>

        </section>

        <section className="checkout-summary-section checkout-summary-section--timeline">

          <h3>What Happens Next</h3>

          <p>

            You’ll receive order details by email shortly. For built-to-order

            drums, please refer to the product page for estimated build timing.

            For ready-to-ship or merch items, fulfillment and shipping timing

            may vary by item.

          </p>

        </section>

        <div className="checkout-actions">

          <button type="button" onClick={printReceipt} className="print-receipt">

            Print / Download Receipt

          </button>

          <Link to="/artisan-shop" className="continue-shopping">

            Continue Exploring

          </Link>

        </div>

        <div className="support-contact">

          <p>

            Questions about your order?

            <br />

            Contact us at{' '}

            <a href="mailto:support@oberartisandrums.com">

              support@oberartisandrums.com

            </a>{' '}

            or <a href="tel:+16154450220">615-445-0220</a>.

          </p>

        </div>

      </div>

    </div>

  );

};

export default CheckoutSummary;