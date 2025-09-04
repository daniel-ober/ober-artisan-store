import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './EndorsementApplicationsCard.css';

const EndorsementApplicationsCard = ({ onOpen }) => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'endorsement_applications'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setRows(list);
    });
    return () => unsub();
  }, []);

  const counts = useMemo(() => {
    const c = { total: rows.length, new: 0, inProgress: 0, completed: 0 };
    for (const r of rows) {
      const s = r.status || 'inProgress';
      if (s === 'new') c.new++;
      else if (s === 'completed') c.completed++;
      else c.inProgress++;
    }
    return c;
  }, [rows]);

  return (
    <div className="ea-card" onClick={onOpen} role="button" tabIndex={0}>
      <div className="ea-card__header">
        <h3>Artist Endorsement Applications</h3>
        <div className="ea-card__badges">
          {counts.new > 0 && <span className="badge badge--green">{counts.new} New</span>}
          {counts.inProgress > 0 && <span className="badge badge--yellow">{counts.inProgress} In Progress</span>}
          {counts.completed > 0 && <span className="badge">{counts.completed} Completed</span>}
        </div>
      </div>

      <div className="ea-card__meta">
        <div className="ea-card__stat">
          <div className="ea-card__stat-num">{counts.total}</div>
          <div className="ea-card__stat-label">Total</div>
        </div>
      </div>

      <button className="ea-card__cta" onClick={onOpen} type="button">
        Review Applications
      </button>
    </div>
  );
};

export default EndorsementApplicationsCard;