import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  collection, doc, getDocs, limit, onSnapshot, orderBy, query,
  serverTimestamp, startAfter, updateDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import EndorsementApplicationModal from './EndorsementApplicationModal';
import './ManageEndorsementApplications.css';
import './AdminModalTheme.css';

const PAGE_SIZE = 10;

const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);

const ManageEndorsementApplications = ({ onClose }) => {
  const [pages, setPages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    status: new Set(['new', 'inProgress', 'completed']),
    search: ''
  });

  const [selected, setSelected] = useState(null); // {id, data}

  const loadPage = async (reset = false) => {
    setLoading(true);
    const base = collection(db, 'endorsement_applications');
    let q = query(base, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
    if (!reset && nextCursor) {
      q = query(base, orderBy('createdAt', 'desc'), startAfter(nextCursor), limit(PAGE_SIZE));
    }
    const snap = await getDocs(q);
    const page = [];
    snap.forEach(d => page.push({ id: d.id, ...d.data() }));
    const nxt = snap.docs[snap.docs.length - 1] || null;

    setPages(reset ? [page] : [...pages, page]);
    setNextCursor(nxt);
    setHasMore(!!nxt);
    setLoading(false);
  };

  useEffect(() => { loadPage(true); /* initial */ }, []); // eslint-disable-line

  // Live updates on already loaded docs
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'endorsement_applications'), (snap) => {
      const map = new Map();
      pages.flat().forEach(r => map.set(r.id, r));
      snap.forEach(d => { if (map.has(d.id)) map.set(d.id, { id: d.id, ...d.data() }); });
      const merged = Array.from(map.values());
      if (merged.length) {
        const chunked = [];
        for (let i = 0; i < merged.length; i += PAGE_SIZE) chunked.push(merged.slice(i, i + PAGE_SIZE));
        setPages(chunked);
      }
    });
    return () => unsub();
  }, [pages.length]); // eslint-disable-line

  const allRows = useMemo(() => pages.flat(), [pages]);
  const visibleRows = useMemo(() => {
    const s = (filters.search || '').trim().toLowerCase();
    return allRows
      .filter(r => filters.status.has((r.status || 'inProgress')))
      .filter(r => {
        if (!s) return true;
        const hay = [
          r.fullName, r.stageName, r.city, r.state, r.country, r.email, r.phone,
          r.instagram, r.tiktok, r.youtube, r.website, r.bands, r.endorsementGoals,
          r.whyOber, r.mediaLinks
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(s);
      });
  }, [allRows, filters]);

  const quickSetStatus = async (row, newStatus) => {
    await updateDoc(doc(db, 'endorsement_applications', row.id), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  };

  // Render the whole overlay stack in a portal to escape parent styles
  return (
    <Portal>
      <div className="eamgr__backdrop">
        <div className="eamgr">
          <div className="eamgr__topbar">
            <h2>Manage Endorsement Applications</h2>
            <div className="eamgr__actions">
              <input
                placeholder="Search name, band, socials…"
                value={filters.search}
                onChange={(e)=>setFilters(f=>({ ...f, search: e.target.value }))}
              />
              <button className="btn btn--ghost" onClick={onClose}>Close</button>
            </div>
          </div>

          <div className="eamgr__filters">
            <div className="chip-row">
              {['new','inProgress','completed'].map(k=>{
                const active = filters.status.has(k);
                const label = k === 'new' ? 'New' : k === 'inProgress' ? 'In Progress' : 'Completed';
                return (
                  <button
                    key={k}
                    className={`chip ${active ? 'chip--on' : ''}`}
                    onClick={()=>{
                      setFilters(f=>{
                        const s = new Set(f.status);
                        if (s.has(k)) s.delete(k); else s.add(k);
                        return { ...f, status: s };
                      });
                    }}
                  >{label}</button>
                );
              })}
            </div>
          </div>

          <div className="eamgr__table">
            <div className="ea-table__head">
              <div>Name</div>
              <div>City</div>
              <div>Bands</div>
              <div>Instagram</div>
              <div>Attachment</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {visibleRows.map(r=>(
              <div className="ea-table__row" key={r.id}>
                <div className="ea-table__cell">
                  <div className="ea-name">
                    <div className="ea-name__top">{r.fullName || '—'}</div>
                    <div className="ea-name__sub">
                      { [r.stageName, r.email, r.phone].filter(Boolean).join(' • ') || '—' }
                    </div>
                  </div>
                </div>
                <div className="ea-table__cell">{[r.city, r.state, r.country].filter(Boolean).join(', ') || '—'}</div>
                <div className="ea-table__cell">{r.bands || '—'}</div>
                <div className="ea-table__cell">
                  {r.instagram ? <a href={`https://instagram.com/${r.instagram.replace(/^@/,'')}`} target="_blank" rel="noreferrer">@{r.instagram.replace(/^@/,'')}</a> : '—'}
                </div>
                <div className="ea-table__cell">
                  {r?.attachment?.url
                    ? <a href={r.attachment.url} target="_blank" rel="noreferrer">View file</a>
                    : (r.hasAttachment && r.url ? <a href={r.url} target="_blank" rel="noreferrer">View file</a> : '—')}
                </div>
                <div className="ea-table__cell">
                  <select value={r.status || 'inProgress'} onChange={(e)=>quickSetStatus(r, e.target.value)}>
                    <option value="new">New</option>
                    <option value="inProgress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="ea-table__cell">
                  <button className="btn btn--sm" onClick={()=>setSelected({ id: r.id, data: r })}>Open</button>
                </div>
              </div>
            ))}

            {visibleRows.length === 0 && <div className="ea-empty">No results.</div>}
          </div>

          <div className="eamgr__pager">
            <button className="btn btn--ghost" disabled={loading || !hasMore} onClick={()=>loadPage(false)}>
              {loading ? 'Loading…' : hasMore ? 'Load more' : 'No more'}
            </button>
          </div>
        </div>

        {selected && (
          <EndorsementApplicationModal
            value={selected.data}
            appId={selected.id}
            onClose={()=>setSelected(null)}
          />
        )}
      </div>
    </Portal>
  );
};

export default ManageEndorsementApplications;