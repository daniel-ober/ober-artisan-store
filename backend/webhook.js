// // backend/webhook.js

// const express = require('express');
// const admin = require('firebase-admin');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// const router = express.Router();

// // Middleware to handle raw Stripe webhook body
// router.post(
//   '/api/webhook',
//   express.raw({ type: 'application/json' }),
//   async (req, res) => {
//     const sig = req.headers['stripe-signature'];
//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(
//         req.body,
//         sig,
//         process.env.STRIPE_WEBHOOK_SECRET
//       );
//     } catch (err) {
//       console.error(`❌ Webhook signature verification failed: ${err.message}`);
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object;

//       if (!session.metadata || !session.metadata.userId) {
//         return res.status(400).send('Missing user metadata.');
//       }

//       const userId = session.metadata.userId;
//       const userEmail = session.customer_email;
//       const totalAmount = session.amount_total / 100;

//       let lineItems;
//       try {
//         const lineItemsResponse = await stripe.checkout.sessions.listLineItems(
//           session.id,
//           { expand: ['data.price.product'] }
//         );

//         lineItems = lineItemsResponse.data.map((item) => {
//           return {
//             stripeProductId: item.price.product?.id || null,
//             stripePriceId: item.price.id || null,
//             name: item.description || null,
//             quantity: item.quantity,
//             price: item.amount_total / 100,
//           };
//         });
//       } catch (error) {
//         console.error('❌ Error fetching line items:', error.message);
//         return res.status(500).send('Error fetching line items.');
//       }

//       try {
//         for (const item of lineItems) {
//           let productSnapshot = await admin
//             .firestore()
//             .collection('products')
//             .where('stripeProductId', '==', item.stripeProductId)
//             .limit(1)
//             .get();

//           if (!productSnapshot || productSnapshot.empty) {
//             console.error(`❌ No product found for Stripe Product ID: ${item.stripeProductId}`);
//             if (item.name) {
//               const formattedName = item.name.toLowerCase().replace(/\s+/g, '');
//               const fallbackSnapshot = await admin
//                 .firestore()
//                 .collection('products')
//                 .where('name', '>=', formattedName)
//                 .where('name', '<=', formattedName + '\uf8ff')
//                 .limit(1)
//                 .get();

//               if (!fallbackSnapshot.empty) {
//                 productSnapshot = fallbackSnapshot;
//               } else {
//                 console.error(`❌ Fallback failed. Product '${item.name}' not found in Firestore.`);
//                 continue;
//               }
//             } else {
//               console.error(`❌ Skipping product due to missing name.`);
//               continue;
//             }
//           }

//           const productDoc = productSnapshot.docs[0];
//           const productRef = productDoc.ref;

//           await admin.firestore().runTransaction(async (transaction) => {
//             const freshProductDoc = await transaction.get(productRef);
//             if (!freshProductDoc.exists) {
//               console.error(`❌ Firestore product missing: ${productRef.id}`);
//               return;
//             }

//             const freshProductData = freshProductDoc.data();
//             const newQuantity = Math.max(
//               0,
//               (freshProductData.currentQuantity || 0) - item.quantity
//             );

//             transaction.update(productRef, {
//               currentQuantity: newQuantity,
//               isAvailable: newQuantity > 0,
//             });
//           });
//         }

//         // ✅ Calculate final order status + overviewStatus correctly:
//         const itemsWithStatus = lineItems.map((item) => ({
//           ...item,
//           status: 'Preparing',
//           productId: item.stripeProductId || item.name?.toLowerCase()?.replace(/\s+/g, ''),
//         }));
//         const finalStatus = getOrderStatusFromItems(itemsWithStatus);
//         const finalOverview = getOverviewStatus('order', finalStatus);

//         const orderId = generateCustomId();
//         const orderData = {
//           orderId,
//           stripeSessionId: session.id,
//           userId,
//           guestToken: session.metadata?.guestToken || null,
//           customerName:
//             session.customer_details?.name ||
//             `${session.metadata?.customerFirstName || ''} ${session.metadata?.customerLastName || ''}`.trim() ||
//             'No Name Provided',
//           customerEmail: userEmail || session.metadata?.customerEmail || 'No Email Provided',
//           customerPhone:
//             session.customer_details?.phone || session.metadata?.customerPhone || 'No Phone Provided',
//           customerAddress: session.customer_details?.address
//             ? `${session.customer_details.address.line1 || ''}, ${session.customer_details.address.city || ''}, ${session.customer_details.address.postal_code || ''}, ${session.customer_details.address.country || ''}`
//             : 'No Address Provided',
//           paymentIntentId: session.payment_intent,
//           totalAmount,
//           currency: session.currency || 'usd',
//           status: finalStatus,
//           overviewStatus: finalOverview,
//           items: itemsWithStatus,
//           createdAt: admin.firestore.FieldValue.serverTimestamp(),
//           systemHistory: [
//             {
//               event: 'Order created from Stripe checkout session',
//               timestamp: new Date().toISOString(),
//             },
//           ],
//         };

//         await admin.firestore().collection('orders').doc(orderId).set(orderData);

//         res.status(200).send('✅ Event processed successfully.');
//       } catch (error) {
//         console.error('❌ Error processing order:', error.message);
//         res.status(500).send('Internal Server Error');
//       }
//     } else {
//       res.status(200).send('Event received.');
//     }
//   }
// );

// function generateCustomId() {
//   return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
// }

// module.exports = router;