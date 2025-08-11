import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import SoundLegendVaultCreator from "./SoundLegendVaultCreator";
import "./SoundLegendVaultAdmin.css";

const FALLBACK_HERO = "/fallback-images/images-coming-soon-regular.png";

// helper: parse "SL-007" -> 7 (for sorting)
const slNum = (id) => {
  const m = String(id || "").match(/^SL-(\d{3})$/i);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
};

export default function SoundLegendVaultAdmin() {
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState([]); // {id, name, heroImage}
  const [selectedId, setSelectedId] = useState(""); // SL-###
  const [mode, setMode] = useState("list"); // 'list' | 'edit' | 'new'
  const [refreshTick, setRefreshTick] = useState(0);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "soundlegend_showroom"));
      const rows = snap.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          name: data.name || "",
          heroImage: data.heroImage || FALLBACK_HERO,
        };
      });
      rows.sort((a, b) => slNum(a.id) - slNum(b.id)); // oldest -> newest
      setArtists(rows);
    } catch (e) {
      console.error("Failed to load SL artists:", e);
      alert("Failed to load SL artists. See console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [refreshTick]);

  const onEdit = (id) => {
    setSelectedId(id);
    setMode("edit");
  };

  const onAddNew = () => {
    setSelectedId("");
    setMode("new");
  };

  const onBackToList = () => {
    setMode("list");
    setSelectedId("");
  };

  const grid = useMemo(() => {
    if (!artists?.length) return null;
    return (
      <div className="slv-grid">
        {artists.map((a) => (
          <div key={a.id} className="slv-cardWrap">
            <button
              className="slv-card"
              onClick={() => onEdit(a.id)}
              title={`Edit ${a.name || "(untitled)"} (${a.id})`}
            >
              <div className="slv-thumbWrap">
                <img
                  src={a.heroImage || FALLBACK_HERO}
                  alt={`${a.name} hero`}
                  className="slv-thumb"
                  onError={(e) => (e.currentTarget.src = FALLBACK_HERO)}
                />
              </div>
              <div className="slv-meta">
                <div className="slv-name">{a.name || "Unnamed Artist"}</div>
                <div className="slv-slug">
                  ({a.id})
                  <a
                    href={`/artisan-shop/soundlegend/${a.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="slv-openLink"
                    title="Open in new tab"
                    onClick={(e) => e.stopPropagation()} // prevent edit
                  >
                    🔗
                  </a>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    );
  }, [artists]);

  return (
<div className="slv-wrap">
  <div className="slv-header">
    <h1 className="slv-h1">SoundLegend Vault — Artists</h1>
        <div className="slv-actionsRow">
          {mode !== "list" && (
            <button className="slv-btn" onClick={onBackToList}>
              ← Back to List
            </button>
          )}
          <button className="slv-btn" onClick={() => setRefreshTick((t) => t + 1)}>
            Refresh
          </button>
          <button className="slv-btnPrimary" onClick={onAddNew}>
            + Add New Artist
          </button>
        </div>
      </div>

      {mode === "list" && (
        <>
          {loading ? (
            <div className="slv-hint">Loading artists…</div>
          ) : artists.length ? (
            <>
              <div className="slv-hint">
                Sorted by ID (oldest → newest). Click a card to load & edit.
              </div>
              {grid}
            </>
          ) : (
            <div className="slv-empty">
              No artists yet. Click “Add New Artist” to create your first entry.
            </div>
          )}
        </>
      )}

      {mode === "edit" && (
        <>
          <div className="slv-hint">
            Editing: <code>{selectedId}</code>
          </div>
          <SoundLegendVaultCreator key={selectedId} prefillId={selectedId} />
        </>
      )}

      {mode === "new" && (
        <>
          <div className="slv-hint">
            Create a new showroom doc. Choose an ID like <code>SL-00X</code>.
          </div>
          <SoundLegendVaultCreator key="new" />
        </>
      )}
    </div>
  );
}