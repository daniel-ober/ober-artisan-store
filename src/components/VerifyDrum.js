import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import './VerifyDrum.css'; // Optional: for styles

const VerifyDrum = () => {
  const [status, setStatus] = useState('');
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    try {
      if ('NDEFReader' in window) {
        const reader = new NDEFReader();
        setStatus('🔍 Scanning... Hold your phone near the drum.');
        setLoading(true);

        await reader.scan();

        reader.onreading = async (event) => {
          const tagUID = event.serialNumber;
          setUid(tagUID);

          const docRef = doc(db, 'nfc_tags', tagUID);
          const docSnap = await getDoc(docRef);

          const isCertified = docSnap.exists();
          const data = docSnap.data();

          // Log the scan under nfc_logs
          await addDoc(collection(db, 'nfc_logs'), {
            uid: tagUID,
            result: isCertified ? 'certified' : 'unrecognized',
            series: data?.series || null,
            drumId: data?.drumId || null,
            timestamp: serverTimestamp(),
          });

          if (isCertified) {
            setStatus(`✅ This is a certified ${data.series} drum (ID: ${data.drumId})`);
          } else {
            setStatus('❌ Product unrecognized. Please contact support@oberartisandrums.com');
          }

          setLoading(false);
        };

        reader.onerror = () => {
          setStatus('⚠️ NFC scan failed. Try again.');
          setLoading(false);
        };
      } else {
        setStatus('❌ Web NFC not supported on this device.');
      }
    } catch (err) {
      setStatus('❌ NFC error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="verify-container">
      <h1>Verify Your Ober Artisan Drum</h1>
      <button onClick={handleScan} disabled={loading}>
        {loading ? 'Scanning...' : 'Tap to Scan Drum'}
      </button>
      {uid && <p><strong>Tag UID:</strong> {uid}</p>}
      <p>{status}</p>
    </div>
  );
};

export default VerifyDrum;