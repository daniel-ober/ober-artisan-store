import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import ArtisanShopCard from './ArtisanShopCard';
import './ArtisanShop.css';

const ArtisanShop = () => {
  const { isAdmin } = useAuth();               // ✅ admin gate
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        let rows = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(item => !item.status || ['available', 'preorder'].includes(item.status));

        rows.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        // keep Founder’s Toast last (same as before)
        const ft = rows.find(r => r.id === 'founders-toast');
        if (ft) {
          rows = rows.filter(r => r.id !== 'founders-toast');
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

  // ===== reorder (admin) =====
  const moveItem = async (index, dir) => {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;

    const updated = [...items];
    [updated[index], updated[next]] = [updated[next], updated[index]];

    // re-index
    updated.forEach((it, i) => { it.displayOrder = i; });

    setItems(updated);

    try {
      await Promise.all(
        updated.map(it => updateDoc(doc(db, 'products', it.id), { displayOrder: it.displayOrder }))
      );
    } catch (e) {
      console.error('❌ Error updating order:', e);
    }
  };

  if (loading) return <div className="loading">Loading Artisan Shop...</div>;

  return (
    <div className="pre-order-page">
      <h1 className="pre-order-page-header">Explore the Artisan Shop</h1>
      <p className="subtitle">
        Order your handcrafted drum or specialty item — limited availability.
      </p>

      {/* Admin view: same grid, with floating arrows above each card */}
      <div className="pre-order-items">
        {items.map((item, i) => (
          <div key={item.id} className="admin-card-wrap">
            {isAdmin && (
              <div className="sort-controls">
                <button
                  className="sort-btn"
                  aria-label="Move left"
                  onClick={() => moveItem(i, -1)}
                >
                  ←
                </button>
                <button
                  className="sort-btn"
                  aria-label="Move right"
                  onClick={() => moveItem(i, +1)}
                >
                  →
                </button>
              </div>
            )}
            <ArtisanShopCard product={item} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArtisanShop;