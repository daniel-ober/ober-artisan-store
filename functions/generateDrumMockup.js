const functions = require('firebase-functions/v2');
const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const { OpenAI } = require('openai');

const openaiKey = functions.params.defineSecret('OPENAI_API_KEY');

if (!admin.apps.length) {
  admin.initializeApp();
}
const storage = getStorage();

exports.generateDrumMockup = onCall({ secrets: [openaiKey] }, async (req) => {
  const {
    veneer,
    accentColor,
    hardware,
    diameter,
    depth,
    docId,
    veneerImageId,
  } = req.data;

  console.log('📨 Received drum mockup request with:', req.data);

  try {
    const openai = new OpenAI({ apiKey: openaiKey.value() });
    const prompt = `A high-end handcrafted snare drum, ${diameter}x${depth} inches, made from ${veneer} wood with ${accentColor} resin accents. 
    Fitted with ${hardware} tension rods and hoops. Photographed under dramatic studio lighting against a black background. 
    Front-facing angle showing drumhead and partial shell depth. Wax-sealed artisan badge in the center of the shell. 
    Captured with a macro lens, ultra-realistic product photo, hyper-detailed wood grain, polished metal hardware, and tight depth of field.`;


const imagePayload = {
  prompt,
  size: '1024x1024',
  response_format: 'url',
};

    if (veneerImageId) {
      imagePayload.referenced_image_ids = [veneerImageId];
    }

    const response = await openai.images.generate(imagePayload);

    if (!response.data?.[0]?.url) {
      throw new Error('No image URL returned from OpenAI');
    }
    
    const imageUrl = response.data[0].url;
    console.log('🖼️ Generated image URL:', imageUrl);

    const imageRes = await fetch(imageUrl);
    const buffer = await imageRes.buffer();
    console.log('📦 Image buffer fetched');

    const bucket = storage.bucket();
    const filePath = `soundlegend_mockups/${docId}.png`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
        metadata: { firebaseStorageDownloadTokens: uuidv4() },
      },
    });
    console.log('✅ Image uploaded to Firebase Storage:', filePath);

    const signedUrl = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2030',
    });

    await admin
    .firestore()
    .collection('soundlegend_submissions')
    .doc(docId)
    .update({
      mockupImageUrl: signedUrl[0],
      mockupStatus: 'complete',
    });
  
  console.log('🧾 Firestore updated with:', {
    mockupImageUrl: signedUrl[0],
    mockupStatus: 'complete',
  });

    return { url: signedUrl[0] };
  } catch (err) {
    console.error('❌ Mockup generation failed:', err);
    throw new functions.https.HttpsError(
      'internal',
      'Mockup generation failed'
    );
  }
});
