import React from 'react';
import './PaymentHistory.css';
import { useActorContext } from '../../hooks/useActorContext';

const STRIPE_LOGO = '/logos/stripe-logo.png';

/* -------------------- tiny helpers (local only) -------------------- */

function cleanOrderId(id = '') {
  return id.startsWith('ORD-') ? id.replace('ORD-', '') : id;
}

function tsToMillis(v) {
  if (!v) return 0;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  }
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime() || 0;
  if (typeof v === 'object' && v.seconds) return v.seconds * 1000;
  try {
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

function fmtDate(v) {
  const ms = tsToMillis(v);
  return ms ? new Date(ms).toLocaleDateString() : '—';
}

function dollars(cents) {
  if (cents == null) return '—';
  const num = Number(cents);
  if (!Number.isFinite(num)) return '—';
  return `$${(num / 100).toFixed(2)}`;
}

/* -------------------- main component -------------------- */

export default function PaymentHistory({ orders }) {
  const { actorIsAdmin, isImpersonating, subjectEmail } = useActorContext();

  const hasOrders = Array.isArray(orders) && orders.length > 0;
  const isAdminViewingOther = actorIsAdmin && isImpersonating;

  if (!hasOrders) {
    return (
      <div className="slp-card ph-card" data-component="PaymentHistory">
        <h3>Payments &amp; Orders</h3>

        {isAdminViewingOther && (
          <p className="slp-admin-note">
            Admin view: no order/payment records were found for this artist
            {subjectEmail ? ` (${subjectEmail})` : ''}.
          </p>
        )}

        {!isAdminViewingOther && (
          <p className="slp-muted">
            No order/payment records found for your account email.
          </p>
        )}

        {/* Stripe security message even if there are no orders */}
        <StripeSecurityNotice />
      </div>
    );
  }

  return (
    <div className="slp-card ph-card" data-component="PaymentHistory">
      <h3>Payments &amp; Orders</h3>

      {isAdminViewingOther && (
        <p className="slp-admin-note">
          Admin view: you’re viewing payment history for
          {subjectEmail ? ` ${subjectEmail}` : ' this artist'}.
        </p>
      )}

      {/* ✅ Stripe security message */}
      <StripeSecurityNotice />

      <div className="ph-table-wrap">
        <table className="slp-table ph-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Tracking #</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="mono">{cleanOrderId(o.id)}</td>
                <td>{fmtDate(o.createdAt)}</td>
                <td>{dollars(o.amountTotal ?? o.totalAmount)}</td>
                <td>
                  {(o.status || o.paymentMethodDetails?.status || '—')
                    .toString()
                    .toUpperCase()}
                </td>
                <td>{o.trackingNumber || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------- Stripe security notice -------------------- */

function StripeSecurityNotice() {
  const tooltip =
    'Ober Artisan Drums uses Stripe for a secure checkout experience. ' +
    'Even Ober Artisan Drums does not store or save any sensitive card details.';

  return (
    <div className="ph-stripe-info" title={tooltip}>
      <span className="ph-stripe-check" aria-hidden="true">
        ✓
      </span>
      <span className="ph-stripe-text">
        All payments are processed securely through
        <span className="ph-stripe-logo-wrap">
          <img src={STRIPE_LOGO} alt="Stripe" className="ph-stripe-logo" />
        </span>
      </span>
    </div>
  );
}