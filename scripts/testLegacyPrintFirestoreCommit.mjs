import { commitApprovalTransaction } from '../src/legacyPrint/firestoreRuntime/commitApprovalTransaction.js';

import { sampleApprovalContext } from '../src/legacyPrint/testFixtures/sampleApprovalContext.js';

async function run() {

  // Mock Firestore (safe in-memory batch simulator)

  const firestore = {

    _writes: [],

    collection(name) {

      return {

        doc: (id) => ({

          set: (data) => {

            firestore._writes.push({ type: 'set', name, id, data });

          },

          delete: () => {

            firestore._writes.push({ type: 'delete', name, id });

          }

        })

      };

    },

    batch() {

      return {

        ops: [],

        set(ref, data) {

          this.ops.push({ type: 'set', ref, data });

        },

        delete(ref) {

          this.ops.push({ type: 'delete', ref });

        },

        async commit() {

          firestore._writes.push(...this.ops);

        }

      };

    }

  };

  const result = await commitApprovalTransaction({

    firestore,

    ...sampleApprovalContext,

    reason: 'Firestore commit test'

  });

  console.log('\nLegacyPrint Firestore Commit Result:\n');

  console.log(JSON.stringify(result, null, 2));

  console.log('\nMock Firestore Writes:\n');

  console.log(JSON.stringify(firestore._writes, null, 2));

  if (result.success && firestore._writes.length > 0) {

    console.log('\n✅ Firestore commit pipeline passed.\n');

  } else {

    console.log('\n⚠️ Firestore commit pipeline failed.\n');

  }

}

run();