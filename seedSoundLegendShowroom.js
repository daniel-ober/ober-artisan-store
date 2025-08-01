// seedSoundLegendShowroom.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Make sure this file is in the same directory

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ✅ Updated Drum Data (with URLs from screenshot)
const drumData = {
  name: 'Danny Lopez – SoundLegend Original',
  heroImage:
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-002%2FIMG_1585.jpeg?alt=media&token=76f4daf9-cd02-4a5e-8d9c-abbbb5a31932',
  gallery: [
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-002%2FIMG_1582.jpeg?alt=media&token=98290c5f-df32-445d-8793-c669b8bd7976',
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-002%2FIMG_1575.jpeg?alt=media&token=920d3534-174a-49b4-b555-5bd8c8ef8d8c',
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-002%2FIMG_1584.jpeg?alt=media&token=76b4b876-df1a-43d4-a5ac-12de458b0a17',
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-002%2FIMG_1572.JPG?alt=media&token=e8b2f374-1b8e-4150-b020-5d5898ce2138',
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-002%2FIMG_1594.jpeg?alt=media&token=40c39658-95ac-4497-bc27-f9c92a7d22ea',
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-002%2FIMG_1581.JPG?alt=media&token=cb6a0141-b850-417d-8b15-9dc9f2b79ff3',
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-002%2FIMG_1602.jpg?alt=media&token=ab8399aa-c0dc-4bac-a076-2952892d39bd',
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-002%2FIMG_1599.JPG?alt=media&token=9da0c228-c67b-42a5-9ed3-caf6e1ff6631',
  ],
  specs: {
    size: '14x8',
    shell: 'Maple + Cherry Stave',
    finish: 'Mappa Burl Poly Gloss',
    hardware: 'Brass Diecast Hoops, Vintage Tube Lugs',
    bearingEdges: '45° Inner / Rounded Outer',
    snareWires: 'Puresound Custom 20-strand',
  },
  story:
    'For Daniel El Travieso Lopez, drummer for Arrasando Norte, drumming is more than rhythm—it is a narrative that unfolds with every stroke. After years of performing, Daniel sought a sound that could carry both the intensity of the stage and the soul of his musical heritage. When he discovered the SoundLegend Original, it resonated deeply with his vision. This collaboration resulted in a snare that is both commanding and nuanced, reflecting his artistry and dedication. The SoundLegend Original built for Daniel is not just an instrument; it is a testament to craftsmanship and the story of an artist finding his voice anew.',
  links: {
    spotify: 'https://open.spotify.com/artist/6eYZ04cc9tUzgqeadLu4B7',
    itunes: 'https://music.apple.com/us/artist/arrasando-norte/1725755717',
    youtube: 'https://www.youtube.com/@ARRASANDONORTE',
    instagram: 'https://www.instagram.com/daniel_lopez_arrasando_norte/',
    facebook: 'https://www.facebook.com/daniel.el.travieso.lopez.2025',
  },
};

async function seed() {
  try {
    await db.collection('soundlegend_showroom').doc('SL-002').set(drumData);
    console.log('✅ Successfully seeded: SL-002');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seed();
