import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getOverviewStatus } from '../utils/statusConfig';

export const backfillOverviewStatus = async () => {
    try {
      const submissionsRef = collection(db, 'soundlegend_submissions');
      const snapshot = await getDocs(submissionsRef);
  
      let updatedCount = 0;
  
      const promises = snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const rawStatus = data.status || 'New';
        const overviewStatus = getOverviewStatus('soundlegend', rawStatus);
  
        // console.log(`🧪 ${docSnap.id}: status="${rawStatus}" → overview="${overviewStatus}"`);
  
        if (!data.overviewStatus || data.overviewStatus !== overviewStatus) {
          await updateDoc(doc(db, 'soundlegend_submissions', docSnap.id), {
            overviewStatus,
          });
          updatedCount++;
        }
      });
  
      await Promise.all(promises);
  
      // console.log(`✅ Backfill complete. Updated ${updatedCount} documents.`);
    } catch (err) {
      console.error('❌ Backfill failed:', err);
    }
  };