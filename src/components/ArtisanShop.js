import React, { useEffect, useState } from 'react';

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

import { db } from '../firebaseConfig';

import { useAuth } from '../context/AuthContext';

import ArtisanShopCard from './ArtisanShopCard';

import './ArtisanShop.css';

const ArtisanShop = () => {
  const { isAdmin } = useAuth();

  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));

        let rows = snap.docs

          .map((d) => ({ id: d.id, ...d.data() }))

          .filter(
            (item) =>
              !item.status || ['available', 'preorder'].includes(item.status)
          );

        rows.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        const ft = rows.find((r) => r.id === 'founders-toast');

        if (ft) {
          rows = rows.filter((r) => r.id !== 'founders-toast');

          rows.push(ft);
        }

        setItems(rows);
      } catch (e) {
        console.error('❌ Error fetching artisan shop items:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const moveItem = async (index, dir) => {
    const next = index + dir;

    if (next < 0 || next >= items.length) return;

    const updated = [...items];

    [updated[index], updated[next]] = [updated[next], updated[index]];

    updated.forEach((it, i) => {
      it.displayOrder = i;
    });

    setItems(updated);

    try {
      await Promise.all(
        updated.map((it) =>
          updateDoc(doc(db, 'products', it.id), {
            displayOrder: it.displayOrder,
          })
        )
      );
    } catch (e) {
      console.error('❌ Error updating order:', e);
    }
  };

  if (loading) {
    return (
      <div className="artisan-shop-page">
        <div className="artisan-shop-overlay" />

        <div className="artisan-shop-shell">
          <div className="artisan-shop-loading">Loading Artisan Shop...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="artisan-shop-page">
      <div className="artisan-shop-overlay" />

      <div className="artisan-shop-shell">
        <section className="artisan-shop-intro">
          <p className="artisan-shop-kicker">Artisan Shop</p>

          <h1 className="artisan-shop-title">From the Ober Workshop</h1>

          <p className="artisan-shop-subtitle">
            Drums and small-batch specialty items, built and offered in limited
            runs.
          </p>
        </section>

        {isAdmin && (
          <div className="artisan-shop-admin-note">
            Admin mode enabled — use the arrows to reorder products.
          </div>
        )}

        <section className="artisan-shop-grid">
          {items.map((item, i) => (
            <div key={item.id} className="artisan-shop-card-wrap">
              {isAdmin && (
                <div className="artisan-shop-sort-controls">
                  <button
                    className="artisan-shop-sort-btn"
                    aria-label="Move item left"
                    onClick={() => moveItem(i, -1)}
                    disabled={i === 0}
                  >
                    ←
                  </button>

                  <button
                    className="artisan-shop-sort-btn"
                    aria-label="Move item right"
                    onClick={() => moveItem(i, 1)}
                    disabled={i === items.length - 1}
                  >
                    →
                  </button>
                </div>
              )}

              <ArtisanShopCard product={item} />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default ArtisanShop;
