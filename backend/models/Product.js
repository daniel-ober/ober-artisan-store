// const admin = require('firebase-admin');
// const db = admin.firestore();

// class ProductModel {
//     static async createProduct(data) {
//         const ref = await db.collection('products').add(data);
//         return { id: ref.id, ...data };
//     }

//     static async getProductById(id) {
//         const doc = await db.collection('products').doc(id).get();
//         if (!doc.exists) throw new Error('Product not found');
//         return { id: doc.id, ...doc.data() };
//     }
// }

// module.exports = ProductModel;
