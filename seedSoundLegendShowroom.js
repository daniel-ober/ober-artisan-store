// seedSoundLegendShowroom.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Ensure this file is in the same directory

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ✅ Drum Data for SL-003 (Rick Ressner)
const drumData = {
  name: 'Rick Ressner – SoundLegend Original',
  heroImage:
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-003%2Fhero.jpeg?alt=media&token=YOUR_TOKEN_HERE',
  gallery: [
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-003%2Fimg1.jpeg?alt=media&token=YOUR_TOKEN_HERE',
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-003%2Fimg2.jpeg?alt=media&token=YOUR_TOKEN_HERE',
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-003%2Fimg3.jpeg?alt=media&token=YOUR_TOKEN_HERE',
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-003%2Fimg4.jpeg?alt=media&token=YOUR_TOKEN_HERE',
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2FSL-003%2Fimg5.jpeg?alt=media&token=YOUR_TOKEN_HERE',
  ],
  specs: {
    size: '14x5.25',
    shell: 'Birch + Cherry Stave',
    finish: 'Mappa Burl Poly Gloss',
    hardware: 'Brass/Gold Diecast Hoops, Vintage Tube Lugs',
    bearingEdges: '45° Inner / Rounded Outer',
    snareWires: 'Puresound Custom 20-strand',
  },
  story: `🥁 Some Rhythms Never Fade. 🎶

For Rick Ressner, music was once a language he spoke fluently. As a young drummer, he played snare in the All City Orchestra and later in the Charleston Band of Doctors. Life, career, and arthritis slowly pushed the sticks out of his hands. Wrists and spine pain made even the simplest rudiments a challenge. Decades passed without a backbeat.

Then one day, Rick saw my SoundLegend Original online. Something about it — the craftsmanship, the voice of the wood — stirred a rhythm he thought was gone. It sparked the question: What’s really stopping me?

We connected, and our stories aligned. Like Rick, I live with arthritis. I know the frustration, the fear of losing music to pain, and the joy of rediscovering it with the right tools. So alongside building his snare, I’m sending Rick my personal booklet on adaptive drumming — tips and tricks I’ve learned through my own journey to keep playing despite the pain.

🔥 Rick Ressner’s Custom SoundLegend Snare
• Size: 14” x 5.25” — compact, fast, and responsive for intricate ghost notes
• Shell: Birch + Cherry stave construction — birch articulation meets cherry warmth
• Finish: Mappa Burl veneer, hand-polished to a glassy polyurethane sheen
• Hardware: 8 vintage tube lugs, diecast hoops, gold/brass finish — elegant and road-ready
• Edges: Precision 45° inner, rounded outer — a perfect balance of attack and resonance
• Voice: Tight, articulate, and effortlessly dynamic — built for a jazz player’s finesse

Rick’s new snare isn’t just an instrument. It’s a bridge back to the music that shaped him.

🎼 For those who think arthritis means the music stops — Rick’s story says otherwise.`,
  links: {
    spotify: '',
    itunes: '',
    youtube: '',
    instagram: '',
    facebook: '',
  },
};

async function seed() {
  try {
    await db.collection('soundlegend_showroom').doc('SL-003').set(drumData);
    console.log('✅ Successfully seeded: SL-003');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seed();