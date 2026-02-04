import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./VerifyDrumBySerial.css";

export default function VerifySerial() {
  const { serial } = useParams();
  const [status, setStatus] = useState("Fetching drum data...");
  const [expectedUID, setExpectedUID] = useState("");
  const [scannedUID, setScannedUID] = useState("");
  const [drumData, setDrumData] = useState(null);
  const [verified, setVerified] = useState(null);

  useEffect(() => {
    const fetchDrum = async () => {
      try {
        const ref = doc(db, "nfc_tags", serial);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setExpectedUID(data.tagUID?.toUpperCase() || "");
          setDrumData(data);
          setStatus("✅ Serial found. Now tap your phone to the Ober logo to verify.");
        } else {
          setStatus("❌ Serial not found. Please check and try again.");
        }
      } catch (err) {
        console.error(err);
        setStatus("❌ Error retrieving drum data.");
      }
    };

    if (serial) fetchDrum();
  }, [serial]);

  useEffect(() => {
    if (!expectedUID) return;

    if (typeof window === "undefined" || !window.NDEFReader) {
      setStatus("❌ This device does not support NFC scanning.");
      return;
    }

    let cancelled = false;

    const startScan = async () => {
      try {
        const NFCReader = window.NDEFReader;
        const ndef = new NFCReader();

        await ndef.scan();
        if (cancelled) return;

        setStatus("📡 Scanning… hold your phone near the drum's badge.");

        ndef.onreading = async (event) => {
          const uid = event?.serialNumber?.toUpperCase() || "";
          setScannedUID(uid);

          const match = uid === expectedUID;
          setVerified(match);

          setStatus(
            match
              ? "✅ This drum is CERTIFIED authentic."
              : "❌ UID mismatch. Unable to verify authenticity."
          );

          try {
            await addDoc(collection(db, "nfc_logs"), {
              serial,
              scannedUID: uid,
              matched: match,
              timestamp: serverTimestamp(),
              userAgent: navigator.userAgent,
            });
          } catch (logErr) {
            console.warn("Failed to log NFC scan", logErr);
          }
        };
      } catch (err) {
        console.error(err);
        setStatus("❌ NFC scan failed. This device may not support scanning.");
      }
    };

    startScan();

    return () => {
      cancelled = true;
    };
  }, [expectedUID, serial]);

  return (
    <div className="verify-drum-container">
      <h1>Verification for: {serial}</h1>
      <p>{status}</p>

      {verified === true && drumData && (
        <div className="drum-details">
          <p>
            <strong>Model:</strong> {drumData.model}
          </p>
          <p>
            <strong>Status:</strong> {drumData.status}
          </p>
        </div>
      )}

      {verified === true && <p className="auth-valid">✅ Genuine Ober Drum</p>}
      {verified === false && <p className="auth-invalid">❌ Verification Failed</p>}

      {scannedUID && (
        <p style={{ marginTop: 12, opacity: 0.8 }}>
          <strong>Scanned UID:</strong> {scannedUID}
        </p>
      )}
    </div>
  );
}