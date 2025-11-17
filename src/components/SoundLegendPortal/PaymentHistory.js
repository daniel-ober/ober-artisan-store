import React, { useMemo, useState } from 'react';
import './PaymentHistory.css';
import { useActorContext } from '../../hooks/useActorContext';
import { db, storage } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';

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

function prettyStatus(status) {
  if (!status) return '—';
  return status
    .toString()
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function extOf(url = '') {
  try {
    const u = new URL(url);
    const p = u.pathname.toLowerCase();
    const m = p.match(/\.[a-z0-9]+$/i);
    return m ? m[0] : '';
  } catch {
    const p = String(url || '').toLowerCase();
    const m = p.match(/\.[a-z0-9]+$/i);
    return m ? m[0] : '';
  }
}

/* -------------------- main component -------------------- */

export default function PaymentHistory({ orders }) {
  const { actorIsAdmin, isImpersonating, subjectEmail } = useActorContext();

  const isAdminViewingOther = actorIsAdmin && isImpersonating;
  const hasOrders = Array.isArray(orders) && orders.length > 0;

  // local copy so uploads feel instant while Firestore listeners catch up
  const [rows, setRows] = useState(orders || []);
  const [uploadingOrderId, setUploadingOrderId] = useState(null);
  const [draggingOrderId, setDraggingOrderId] = useState(null);

  const [activeReceipt, setActiveReceipt] = useState(null); // { url, name }

  React.useEffect(() => {
    setRows(orders || []);
  }, [orders]);

  const sortedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    // newest first by createdAt
    return [...rows].sort(
      (a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt)
    );
  }, [rows]);

  const openReceiptModal = (order) => {
    if (!order?.receiptUrl) return;
    setActiveReceipt({
      url: order.receiptUrl,
      name:
        order.receiptFilename ||
        `Receipt – ${cleanOrderId(order.id || '') || 'Order'}`,
    });
  };

  const closeReceiptModal = () => setActiveReceipt(null);

  const handleDownloadReceipt = (url, name) => {
    if (!url) return;
    const filename = name || 'receipt';
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Receipt download failed, opening in new tab.', err);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const performUpload = async (order, file) => {
    if (!order?.id || !file) return;
    setUploadingOrderId(order.id);
    try {
      const path = `orders/${order.id}/receipt/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);

      await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file);
        task.on(
          'state_changed',
          () => {},
          (err) => reject(err),
          () => resolve()
        );
      });

      const url = await getDownloadURL(storageRef);

      // update Firestore order doc
      try {
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
          receiptUrl: url,
          receiptFilename: file.name,
          receiptUploadedAt: new Date(),
        });
      } catch (err) {
        console.warn(
          '[PaymentHistory] Could not update Firestore order doc; UI will still show receipt URL.',
          err
        );
      }

      // optimistic local update
      setRows((prev) =>
        (prev || []).map((row) =>
          row.id === order.id
            ? {
                ...row,
                receiptUrl: url,
                receiptFilename: file.name,
              }
            : row
        )
      );
    } catch (err) {
      console.error('Receipt upload error:', err);
      alert(
        `Sorry, there was a problem uploading the receipt.\n\n${
          err?.message || String(err)
        }`
      );
    } finally {
      setUploadingOrderId(null);
    }
  };

  const handleReceiptInputChange = (order, e) => {
    const file = e.target.files?.[0];
    if (file) performUpload(order, file);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const handleDropReceipt = (order, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingOrderId(null);
    if (!isAdminViewingOther || uploadingOrderId === order.id) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) performUpload(order, file);
  };

  const handleDeleteReceipt = async (order) => {
    if (!order?.id || !order.receiptUrl) return;
    const ok = window.confirm(
      'Delete the stored receipt for this order? The file will no longer be accessible from this portal.'
    );
    if (!ok) return;

    setUploadingOrderId(order.id);
    try {
      try {
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, {
          receiptUrl: null,
          receiptFilename: null,
          receiptUploadedAt: null,
        });
      } catch (err) {
        console.warn(
          '[PaymentHistory] Could not clear receipt fields on Firestore doc.',
          err
        );
      }

      setRows((prev) =>
        (prev || []).map((row) =>
          row.id === order.id
            ? {
                ...row,
                receiptUrl: null,
                receiptFilename: null,
              }
            : row
        )
      );
    } catch (err) {
      console.error('Receipt delete error:', err);
      alert(
        `Sorry, there was a problem deleting the receipt.\n\n${
          err?.message || String(err)
        }`
      );
    } finally {
      setUploadingOrderId(null);
    }
  };

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
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((o) => {
              const status =
                o.status || o.paymentMethodDetails?.status || '—';
              const hasReceipt = !!o.receiptUrl;
              const inputId = `ph-receipt-input-${o.id}`;
              const uploading = uploadingOrderId === o.id;

              return (
                <tr key={o.id}>
                  <td className="mono">{cleanOrderId(o.id)}</td>
                  <td>{fmtDate(o.createdAt)}</td>
                  <td>{dollars(o.amountTotal ?? o.totalAmount)}</td>
                  <td>{prettyStatus(status)}</td>
                  <td>{o.trackingNumber || '—'}</td>
                  <td className="ph-receipt-cell">
                    <div
                      className={
                        'ph-receipt-drop' +
                        (draggingOrderId === o.id ? ' is-dragover' : '')
                      }
                      onDragOver={(e) => {
                        if (!isAdminViewingOther) return;
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggingOrderId !== o.id) {
                          setDraggingOrderId(o.id);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggingOrderId === o.id) {
                          setDraggingOrderId(null);
                        }
                      }}
                      onDrop={(e) => handleDropReceipt(o, e)}
                    >
                      {hasReceipt ? (
                        <>
                          <button
                            type="button"
                            className="apo-btn ph-receipt-btn"
                            onClick={() => openReceiptModal(o)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="apo-btn ph-receipt-btn"
                            onClick={() =>
                              handleDownloadReceipt(
                                o.receiptUrl,
                                o.receiptFilename
                              )
                            }
                          >
                            Download
                          </button>
                          {isAdminViewingOther && (
                            <button
                              type="button"
                              className="apo-btn ph-receipt-btn ph-receipt-btn-secondary"
                              onClick={() => handleDeleteReceipt(o)}
                              disabled={uploading}
                            >
                              Delete
                            </button>
                          )}
                        </>
                      ) : isAdminViewingOther ? (
                        <>
                          <label
                            htmlFor={inputId}
                            className="apo-btn ph-receipt-btn"
                          >
                            {uploading ? 'Uploading…' : 'Upload receipt'}
                          </label>
                          <span className="ph-receipt-hint">
                            or drag file here
                          </span>
                        </>
                      ) : (
                        <span className="ph-receipt-none">—</span>
                      )}

                      {isAdminViewingOther && (
                        <input
                          id={inputId}
                          type="file"
                          accept="application/pdf,image/*"
                          style={{ display: 'none' }}
                          onChange={(e) =>
                            handleReceiptInputChange(o, e)
                          }
                          disabled={uploading}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Receipt preview modal (re-uses Media modal styling) */}
      {activeReceipt && (
        <div
          className="mg-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target.classList.contains('mg-modal')) {
              closeReceiptModal();
            }
          }}
        >
          <div className="mg-modal-inner">
            <div className="mg-modal-top">
              <div className="mg-nav-info">
                <div
                  className="mg-modal-name"
                  title={activeReceipt.name || 'Receipt'}
                >
                  {activeReceipt.name || 'Receipt'}
                </div>
              </div>
              <div className="mg-actions">
                <button
                  type="button"
                  className="apo-btn"
                  onClick={() =>
                    handleDownloadReceipt(
                      activeReceipt.url,
                      activeReceipt.name
                    )
                  }
                >
                  Download
                </button>
                <button
                  type="button"
                  className="apo-btn"
                  onClick={closeReceiptModal}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mg-modal-body">
              {extOf(activeReceipt.url) === '.pdf' ? (
                <iframe
                  title={activeReceipt.name || 'Receipt PDF'}
                  src={activeReceipt.url}
                  style={{
                    width: '100%',
                    height: '72vh',
                    border: 'none',
                    background: '#fff',
                  }}
                />
              ) : (
                <div className="mg-image-viewport">
                  <div className="mg-image-wrap">
                    <img
                      src={activeReceipt.url}
                      alt={activeReceipt.name || 'Receipt'}
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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