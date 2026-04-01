import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const PAGE_SIZE = 10;

const normalizeStatus = (status) => {
  const raw = String(status || '').trim();

  if (raw === 'new') return 'new';
  if (raw === 'completed') return 'completed';
  return 'inProgress';
};

const statusLabel = (status) => {
  if (status === 'new') return 'New';
  if (status === 'completed') return 'Completed';
  return 'In Progress';
};

const statusClass = (status) => {
  if (status === 'new') return 'new';
  if (status === 'completed') return 'completed';
  return 'in-progress';
};

const formatDate = (value) => {
  if (!value) return '—';

  try {
    if (value?.toDate) return value.toDate().toLocaleDateString();
    if (typeof value?.seconds === 'number') {
      return new Date(value.seconds * 1000).toLocaleDateString();
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString();
  } catch {
    return '—';
  }
};

const attachmentUrl = (r) =>
  r?.attachment?.url ||
  r?.attachmentUrl ||
  (r?.hasAttachment && r?.url ? r.url : '') ||
  '';

const getCreatedAtMs = (value) => {
  if (!value) return 0;
  try {
    if (value?.toDate) return value.toDate().getTime();
    if (typeof value?.seconds === 'number') return value.seconds * 1000;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  } catch {
    return 0;
  }
};

const ManageEndorsementApplications = () => {
  const [pages, setPages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    status: new Set(['new', 'inProgress', 'completed']),
    search: '',
  });

  const [selected, setSelected] = useState(null); // { id, data }
  const loadedIdsRef = useRef(new Set());

  const chunkRows = (rows) => {
    const output = [];
    for (let i = 0; i < rows.length; i += PAGE_SIZE) {
      output.push(rows.slice(i, i + PAGE_SIZE));
    }
    return output;
  };

  const loadPage = async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const base = collection(db, 'endorsement_applications');
      let q = query(base, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

      if (!reset && nextCursor) {
        q = query(
          base,
          orderBy('createdAt', 'desc'),
          startAfter(nextCursor),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(q);

      const page = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const cursor = snap.docs[snap.docs.length - 1] || null;

      setPages((prev) => (reset ? [page] : [...prev, page]));
      setNextCursor(cursor);
      setHasMore(!!cursor);

      setTimeout(() => {
        const nextLoaded = new Set(reset ? [] : Array.from(loadedIdsRef.current));
        page.forEach((row) => nextLoaded.add(row.id));
        loadedIdsRef.current = nextLoaded;
      }, 0);
    } catch (err) {
      console.error('Failed to load endorsement applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'endorsement_applications'), (snap) => {
      const loadedIds = loadedIdsRef.current;
      if (!loadedIds || loadedIds.size === 0) return;

      const patchMap = new Map();

      snap.forEach((d) => {
        if (loadedIds.has(d.id)) {
          patchMap.set(d.id, { id: d.id, ...d.data() });
        }
      });

      if (patchMap.size === 0) return;

      setPages((prev) => {
        const flat = prev.flat().map((row) => (patchMap.has(row.id) ? patchMap.get(row.id) : row));
        return chunkRows(flat);
      });

      setSelected((prev) => {
        if (!prev) return prev;
        const updated = patchMap.get(prev.id);
        return updated ? { id: prev.id, data: updated } : prev;
      });
    });

    return () => unsub();
  }, []);

  const allRows = useMemo(() => pages.flat(), [pages]);

  const visibleRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return allRows
      .filter((row) => filters.status.has(normalizeStatus(row.status)))
      .filter((row) => {
        if (!search) return true;

        const haystack = [
          row.fullName,
          row.stageName,
          row.city,
          row.state,
          row.country,
          row.email,
          row.phone,
          row.instagram,
          row.tiktok,
          row.youtube,
          row.website,
          row.bands,
          row.endorsementGoals,
          row.whyOber,
          row.mediaLinks,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      })
      .sort((a, b) => getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt));
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
    } catch (err) {
      console.error('Failed to update endorsement application status:', err);
    }
  };

  const counts = useMemo(() => {
    const total = allRows.length;
    const newCount = allRows.filter((r) => normalizeStatus(r.status) === 'new').length;
    const inProgressCount = allRows.filter(
      (r) => normalizeStatus(r.status) === 'inProgress'
    ).length;
    const completedCount = allRows.filter(
      (r) => normalizeStatus(r.status) === 'completed'
    ).length;

    return { total, newCount, inProgressCount, completedCount };
  }, [allRows]);

  return (
    <div className="endorsements-v2">
      <div className="endorsements-v2__header">
        <div className="endorsements-v2__header-copy">
          <div className="endorsements-v2__eyebrow">Admin Workspace</div>
          <h2>Manage Endorsement Applications</h2>
          <p>
            Review inbound artist applications, track status, scan social presence,
            and open each submission for full detail review.
          </p>
        </div>

        <div className="endorsements-v2__summary">
          <div className="endorsements-v2__pill endorsements-v2__pill--neutral">
            Total: {counts.total}
          </div>
          <div className="endorsements-v2__pill endorsements-v2__pill--new">
            New: {counts.newCount}
          </div>
          <div className="endorsements-v2__pill endorsements-v2__pill--progress">
            In Progress: {counts.inProgressCount}
          </div>
          <div className="endorsements-v2__pill endorsements-v2__pill--completed">
            Completed: {counts.completedCount}
          </div>
        </div>
      </div>

      <div className="endorsements-v2__toolbar">
        <div className="endorsements-v2__search">
          <label htmlFor="endorsement-search">Search</label>
          <input
            id="endorsement-search"
            placeholder="Search name, band, city, socials, goals…"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                search: e.target.value,
              }))
            }
          />
        </div>

        <div className="endorsements-v2__chips">
          {['new', 'inProgress', 'completed'].map((key) => {
            const active = filters.status.has(key);
            return (
              <button
                key={key}
                type="button"
                className={`endorsements-v2__chip ${active ? 'is-active' : ''}`}
                onClick={() => {
                  setFilters((prev) => {
                    const next = new Set(prev.status);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return { ...prev, status: next };
                  });
                }}
              >
                {statusLabel(key)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="endorsements-v2__table-shell">
        <div className="endorsements-v2__table-scroll">
          <table className="endorsements-v2__table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Location</th>
                <th>Bands / Projects</th>
                <th>Instagram</th>
                <th>Submitted</th>
                <th>Attachment</th>
                <th>Status</th>
                <th>Open</th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="endorsements-v2__empty">
                    No endorsement applications matched your current filters.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => {
                  const ig = String(row.instagram || '').replace(/^@/, '').trim();
                  const fileUrl = attachmentUrl(row);
                  const normalized = normalizeStatus(row.status);

                  return (
                    <tr
                      key={row.id}
                      className={`endorsements-v2__row status-${statusClass(normalized)}`}
                    >
                      <td>
                        <div className="endorsements-v2__primary">
                          <div className="endorsements-v2__primary-title">
                            {row.fullName || '—'}
                          </div>
                          <div className="endorsements-v2__primary-meta">
                            {[row.stageName, row.email, row.phone]
                              .filter(Boolean)
                              .join(' • ') || '—'}
                          </div>
                          <div className="endorsements-v2__row-id">
                            ID: <code>{row.id}</code>
                          </div>
                        </div>
                      </td>

                      <td>
                        {[row.city, row.state, row.country].filter(Boolean).join(', ') || '—'}
                      </td>

                      <td className="endorsements-v2__bands-cell">
                        {row.bands || '—'}
                      </td>

                      <td>
                        {ig ? (
                          <a
                            href={`https://instagram.com/${ig}`}
                            target="_blank"
                            rel="noreferrer"
                            className="endorsements-v2__link"
                          >
                            @{ig}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td>{formatDate(row.createdAt)}</td>

                      <td>
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="endorsements-v2__link"
                          >
                            View file
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td>
                        <div className="endorsements-v2__status-stack">
                          <span
                            className={`endorsements-v2__status-pill status-${statusClass(
                              normalized
                            )}`}
                          >
                            {statusLabel(normalized)}
                          </span>
{/* 
                          <select
                            value={normalized}
                            onChange={(e) => quickSetStatus(row, e.target.value)}
                            className="endorsements-v2__status-select"
                          >
                            <option value="new">New</option>
                            <option value="inProgress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select> */}
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="endorsements-v2__open-btn"
                          onClick={() => setSelected({ id: row.id, data: row })}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="endorsements-v2__footer">
        <button
          type="button"
          className="endorsements-v2__loadmore"
          disabled={loading || !hasMore}
          onClick={() => loadPage(false)}
        >
          {loading ? 'Loading…' : hasMore ? 'Load more applications' : 'No more applications'}
        </button>
      </div>

      {selected && (
        <EndorsementApplicationModal
          value={selected.data}
          appId={selected.id}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export default ManageEndorsementApplications;