app.post(
    '/api/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const sig = req.headers['stripe-signature'];
      let event;
  
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
  
      console.log(`Received Stripe event: ${event.type}`);
  
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
  
        console.log('Checkout session completed:', session);
  
        // Fetch line items for the session
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product'],
        });
  
        const items = lineItems.data.map((item) => ({
          name: item.description,
          quantity: item.quantity,
          price: item.amount_total / 100, // Convert to dollars
        }));
  
        // Fetch payment intent for card details
        let cardDetails = {};
        if (session.payment_intent) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent, {
              expand: ['payment_method'],
            });
  
            console.log('Fetched Payment Intent:', paymentIntent); // Debugging log
  
            if (paymentIntent.payment_method && paymentIntent.payment_method_details) {
              const paymentMethod = paymentIntent.payment_method_details.card;
  
              if (paymentMethod) {
                cardDetails = {
                  brand: paymentMethod.brand || 'Unknown',
                  lastFour: paymentMethod.last4 || 'XXXX',
                  expMonth: paymentMethod.exp_month || 'XX',
                  expYear: paymentMethod.exp_year || 'XXXX',
                };
              } else {
                console.error('Payment method details are missing in payment intent');
              }
            } else {
              console.error('Payment method is missing in payment intent');
            }
          } catch (error) {
            console.error('Error fetching payment intent for card details:', error.message);
          }
        } else {
          console.error('Payment intent ID is missing in session');
        }
  
        console.log('Card Details Fetched:', cardDetails); // Log card details for debugging
  
        // Prepare order data
// Prepare order data
const orderData = {
    stripeSessionId: session.id || null,
    userId: session.metadata?.userId || 'guest',
    guestToken: session.metadata?.guestToken || null,
    customerName: session.customer_details?.name || 'No Name Provided',
    customerEmail: session.customer_details?.email || 'No Email Provided',
    customerPhone: session.customer_details?.phone || 'No Phone Provided',
    customerAddress: session.customer_details?.address
      ? `${session.customer_details.address.line1 || ''}, ${session.customer_details.address.city || ''}, ${session.customer_details.address.postal_code || ''}, ${session.customer_details.address.country || ''}`
      : 'No Address Provided',
    shippingDetails: session.shipping?.address
      ? `${session.shipping.address.line1 || ''}, ${session.shipping.address.city || ''}, ${session.shipping.address.state || ''}, ${session.shipping.address.country || ''}, ${session.shipping.address.postal_code || ''}`
      : 'No Shipping Details Provided',
    paymentMethod: session.payment_method_types?.[0] || 'Unknown',
    cardDetails, // Include card details
    totalAmount: session.amount_total / 100 || 0, // Convert to dollars
    currency: session.currency || 'usd',
    status: 'Order Started', // Set to "Order Started" by default
    items, // Include line items
    createdAt: admin.firestore.FieldValue.serverTimestamp(), // Firestore timestamp
  };
  
        console.log('Order Data Prepared:', orderData);
  
        try {
          // Generate custom ID
          const customId = generateCustomId();
  
          // Save the order to Firestore
          const orderRef = db.collection('orders').doc(customId); // Use custom ID as document ID
          await orderRef.set(orderData);
          console.log('Order successfully saved to Firestore with ID:', customId);
  
          res.status(200).send('Event processed successfully');
        } catch (error) {
          console.error('Error saving order to Firestore:', error.message);
          res.status(500).send('Internal Server Error');
        }
      } else {
        console.log(`Unhandled event type: ${event.type}`);
        res.status(200).send('Event received');
      }
    }
  );