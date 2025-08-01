import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import './VerifyDrumBySerial.css';

export default function VerifyDrumBySerial() {
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
          setExpectedUID(data.tagUID.toUpperCase());
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

    fetchDrum();
  }, [serial]);

  useEffect(() => {
    if (!expectedUID || !("NDEFReader" in window)) return;

    const startScan = async () => {
      try {
        const ndef = new NDEFReader();
        await ndef.scan();
        setStatus("📡 Scanning… hold your phone near the drum's badge.");

        ndef.onreading = async (event) => {
          const uid = event.serialNumber.toUpperCase();
          setScannedUID(uid);

          const match = uid === expectedUID;
          setVerified(match);
          setStatus(
            match
              ? "✅ This drum is CERTIFIED authentic."
              : "❌ UID mismatch. Unable to verify authenticity."
          );

          // Optional: log the scan attempt
          await addDoc(collection(db, "nfc_logs"), {
            serial,
            scannedUID: uid,
            matched: match,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent
          });
        };
      } catch (err) {
        console.error(err);
        setStatus("❌ NFC scan failed. This device may not support scanning.");
      }
    };

    startScan();
  }, [expectedUID, serial]);

  return (
    <div className="verify-drum-container">
      <h1>Verification for: {serial}</h1>
      <p>{status}</p>

      {verified && drumData && (
        <div className="drum-details">
          <p><strong>Model:</strong> {drumData.model}</p>
          <p><strong>Status:</strong> {drumData.status}</p>
        </div>
      )}

      {verified === true && <p className="auth-valid">✅ Genuine Ober Drum</p>}
      {verified === false && <p className="auth-invalid">❌ Verification Failed</p>}
    </div>
  );
}