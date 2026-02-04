// src/components/ManageEndorsementApplications.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import EndorsementApplicationModal from './EndorsementApplicationModal';
import './ManageEndorsementApplications.css';
import './AdminModalTheme.css';

const PAGE_SIZE = 10;

const Portal = ({ children }) => ReactDOM.createPortal(children, document.body);

const ManageEndorsementApplications = ({ onClose }) => {
  const [pages, setPages] = useState([]); // Array<Array<Row>>
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    status: new Set(['new', 'inProgress', 'completed']),
    search: '',
  });

  const [selected, setSelected] = useState(null); // {id, data}

  // Track loaded ids so live updates can patch only what we already loaded
  const loadedIdsRef = useRef(new Set());

  const chunk = (rows) => {
    const out = [];
    for (let i = 0; i < rows.length; i += PAGE_SIZE) out.push(rows.slice(i, i + PAGE_SIZE));
    return out;
  };

  const loadPage = async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const base = collection(db, 'endorsement_applications');
      let q = query(base, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

      if (!reset && nextCursor) {
        q = query(base, orderBy('createdAt', 'desc'), startAfter(nextCursor), limit(PAGE_SIZE));
      }

      const snap = await getDocs(q);

      const page = snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, ...data };
      });

      const nxt = snap.docs[snap.docs.length - 1] || null;

      setPages((prev) => (reset ? [page] : [...prev, page]));
      setNextCursor(nxt);
      setHasMore(!!nxt);

      // update loaded ids
      setTimeout(() => {
        const s = new Set(reset ? [] : Array.from(loadedIdsRef.current));
        page.forEach((r) => s.add(r.id));
        loadedIdsRef.current = s;
      }, 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(true); // initial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live updates: listen to collection and patch ONLY loaded ids.
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'endorsement_applications'), (snap) => {
      const loaded = loadedIdsRef.current;
      if (!loaded || loaded.size === 0) return;

      const patch = new Map();
      snap.forEach((d) => {
        if (loaded.has(d.id)) patch.set(d.id, { id: d.id, ...d.data() });
      });

      if (patch.size === 0) return;

      setPages((prev) => {
        const flat = prev.flat().map((r) => (patch.has(r.id) ? patch.get(r.id) : r));
        return chunk(flat);
      });

      // if modal is open, patch it too
      setSelected((prev) => {
        if (!prev) return prev;
        const updated = patch.get(prev.id);
        return updated ? { id: prev.id, data: updated } : prev;
      });
    });

    return () => unsub();
  }, []);

  const allRows = useMemo(() => pages.flat(), [pages]);

  const visibleRows = useMemo(() => {
    const s = (filters.search || '').trim().toLowerCase();

    return allRows
      .filter((r) => filters.status.has(String(r.status || 'inProgress')))
      .filter((r) => {
        if (!s) return true;
        const hay = [
          r.fullName,
          r.stageName,
          r.city,
          r.state,
          r.country,
          r.email,
          r.phone,
          r.instagram,
          r.tiktok,
          r.youtube,
          r.website,
          r.bands,
          r.endorsementGoals,
          r.whyOber,
          r.mediaLinks,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return hay.includes(s);
      });
  }, [allRows, filters]);

  const quickSetStatus = async (row, newStatus) => {
    try {
      await updateDoc(doc(db, 'endorsement_applications', row.id), {
        status: newStatus,
        overviewStatus:
          newStatus === 'new'
            ? 'new'
            : newStatus === 'completed'
            ? 'completed'
            : 'inProgress',
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const attachmentUrl = (r) => {
    // Normalize whatever shape you used historically:
    // - attachment: { url }
    // - url + hasAttachment
    // - attachmentUrl
    return (
      r?.attachment?.url ||
      r?.attachmentUrl ||
      (r?.hasAttachment && r?.url ? r.url : '') ||
      ''
    );
  };

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
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
              <button className="btn btn--ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>

          <div className="eamgr__filters">
            <div className="chip-row">
              {['new', 'inProgress', 'completed'].map((k) => {
                const active = filters.status.has(k);
                const label =
                  k === 'new' ? 'New' : k === 'inProgress' ? 'In Progress' : 'Completed';

                return (
                  <button
                    key={k}
                    className={`chip ${active ? 'chip--on' : ''}`}
                    onClick={() => {
                      setFilters((f) => {
                        const s = new Set(f.status);
                        if (s.has(k)) s.delete(k);
                        else s.add(k);
                        return { ...f, status: s };
                      });
                    }}
                  >
                    {label}
                  </button>
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

            {visibleRows.map((r) => {
              const ig = String(r.instagram || '').replace(/^@/, '').trim();
              const url = attachmentUrl(r);

              return (
                <div className="ea-table__row" key={r.id}>
                  <div className="ea-table__cell">
                    <div className="ea-name">
                      <div className="ea-name__top">{r.fullName || '—'}</div>
                      <div className="ea-name__sub">
                        {[r.stageName, r.email, r.phone].filter(Boolean).join(' • ') || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="ea-table__cell">
                    {[r.city, r.state, r.country].filter(Boolean).join(', ') || '—'}
                  </div>

                  <div className="ea-table__cell">{r.bands || '—'}</div>

                  <div className="ea-table__cell">
                    {ig ? (
                      <a href={`https://instagram.com/${ig}`} target="_blank" rel="noreferrer">
                        @{ig}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>

                  <div className="ea-table__cell">
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer">
                        View file
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>

                  <div className="ea-table__cell">
                    <select
                      value={r.status || 'inProgress'}
                      onChange={(e) => quickSetStatus(r, e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="inProgress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="ea-table__cell">
                    <button
                      className="btn btn--sm"
                      onClick={() => setSelected({ id: r.id, data: r })}
                    >
                      Open
                    </button>
                  </div>
                </div>
              );
            })}

            {visibleRows.length === 0 && <div className="ea-empty">No results.</div>}
          </div>

          <div className="eamgr__pager">
            <button
              className="btn btn--ghost"
              disabled={loading || !hasMore}
              onClick={() => loadPage(false)}
            >
              {loading ? 'Loading…' : hasMore ? 'Load more' : 'No more'}
            </button>
          </div>
        </div>

        {selected && (
          <EndorsementApplicationModal
            value={selected.data}
            appId={selected.id}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </Portal>
  );
};

export default ManageEndorsementApplications;