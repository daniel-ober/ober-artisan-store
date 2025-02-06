const drumSummaries = {
  // **12" Snares**
  '12" - Base Price: $850-5.0"-6 Lugs-10mm': {
    highlightedCharacteristics: "Bright, cutting attack with tight control. Ideal for high-energy, fast-paced playing.",
    primaryGenre: "Reggae",
    secondaryGenres: ["Funk", "Latin", "Afrobeat"],
    playingSituation: "Festival & Club Settings",
    recordingMic: "Sennheiser e604 or Shure SM81 for crisp definition.",
  },
  '12" - Base Price: $850-5.0"-8 Lugs-13mm': {
    highlightedCharacteristics: "Warm, vintage-inspired snare with excellent midrange control.",
    primaryGenre: "Jazz",
    secondaryGenres: ["Soul", "Folk", "Blues"],
    playingSituation: "Intimate Studio Sessions & Acoustic Gigs",
    recordingMic: "Neumann KM184 or Coles 4038 for warmth & detail.",
  },
  '12" - Base Price: $950-6.0"-6 Lugs-10mm': {
    highlightedCharacteristics: "Tighter, more focused attack with a fuller body.",
    primaryGenre: "Funk",
    secondaryGenres: ["Latin", "Afrobeat"],
    playingSituation: "Club Gigs & Percussion-Heavy Performances",
    recordingMic: "Shure Beta 57A for enhanced attack.",
  },
  '12" - Base Price: $950-6.0"-8 Lugs-13mm': {
    highlightedCharacteristics: "Balanced warmth with excellent sustain.",
    primaryGenre: "Fusion",
    secondaryGenres: ["Pop", "Indie Rock"],
    playingSituation: "Versatile Live & Studio Work",
    recordingMic: "Earthworks SR25 for natural transient response.",
  },
  '12" - Base Price: $1050-7.0"-6 Lugs-10mm': {
    highlightedCharacteristics: "Lush, controlled sustain with deep articulation.",
    primaryGenre: "Gospel",
    secondaryGenres: ["Jazz", "Experimental"],
    playingSituation: "Worship & Session Work",
    recordingMic: "Beyerdynamic M201 TG or Neumann U87 for rich tone.",
  },
  '12" - Base Price: $1050-7.0"-8 Lugs-13mm': {
    highlightedCharacteristics: "Full-bodied warmth with increased tuning flexibility.",
    primaryGenre: "R&B",
    secondaryGenres: ["Neo-Soul", "Funk"],
    playingSituation: "Studio & Live Performance",
    recordingMic: "Sennheiser MD441 for smooth response.",
  },

  // **13" Snares**
  '13" - Base Price: $950-5.0"-8 Lugs-13mm': {
    highlightedCharacteristics: "Crisp, articulate snare with a tight, punchy response.",
    primaryGenre: "Funk",
    secondaryGenres: ["Pop", "Fusion", "Indie Rock"],
    playingSituation: "Small Clubs & Live Sessions",
    recordingMic: "Shure Beta 57A or AKG C414 for enhanced snap.",
  },
  '13" - Base Price: $1050-6.0"-8 Lugs-13mm': {
    highlightedCharacteristics: "Fast attack with balanced sustain and midrange warmth.",
    primaryGenre: "Fusion",
    secondaryGenres: ["Jazz", "Gospel"],
    playingSituation: "Studio & Medium Venues",
    recordingMic: "Audix i5 or Earthworks SR25 for clarity.",
  },
  '13" - Base Price: $1150-7.0"-8 Lugs-13mm': {
    highlightedCharacteristics: "Tight articulation with added depth and warmth.",
    primaryGenre: "Hip-Hop",
    secondaryGenres: ["Neo-Soul", "Pop"],
    playingSituation: "Studio Recording & Live R&B Sets",
    recordingMic: "AKG C414 or Sennheiser MD441 for balanced tone.",
  },

  // **14" Snares**
  '14" - Base Price: $1050-5.5"-8 Lugs-13mm': {
    highlightedCharacteristics: "Balanced warmth with smooth articulation and even sustain.",
    primaryGenre: "Singer-Songwriter",
    secondaryGenres: ["Blues", "Indie", "Country"],
    playingSituation: "Recording Studios & Unplugged Sessions",
    recordingMic: "Neumann U87 for warmth & transparency.",
  },
  '14" - Base Price: $1100-6.0"-8 Lugs-13mm': {
    highlightedCharacteristics: "Full, rich tone with strong midrange clarity and versatility.",
    primaryGenre: "Classic Rock",
    secondaryGenres: ["Country", "Indie"],
    playingSituation: "Studio & Live Gigs",
    recordingMic: "Shure SM7B or Royer R-121 for smooth response.",
  },
  '14" - Base Price: $1150-6.5"-8 Lugs-13mm': {
    highlightedCharacteristics: "Deep, resonant projection with a smooth, controlled attack.",
    primaryGenre: "Metal",
    secondaryGenres: ["Hard Rock", "Progressive Rock"],
    playingSituation: "Arena Performances & High-Energy Sessions",
    recordingMic: "Beyerdynamic M201 TG or Sennheiser MD421 for aggressive tone.",
  },
  '14" - Base Price: $1050-5.5"-10 Lugs-14mm': {
    highlightedCharacteristics: "Powerful, full-bodied snare with deep lows and controlled sustain.",
    primaryGenre: "Rock",
    secondaryGenres: ["Hard Rock", "Alternative"],
    playingSituation: "Large Venues & Studio Recording",
    recordingMic: "Shure SM57 or Beyerdynamic M201 TG for punchy sound.",
  },
  '14" - Base Price: $1100-6.0"-10 Lugs-14mm': {
    highlightedCharacteristics: "Louder projection with a deep, commanding sound signature.",
    primaryGenre: "Hard Rock",
    secondaryGenres: ["Metal", "Alternative"],
    playingSituation: "Stadium & Large Venue Performances",
    recordingMic: "Audix D4 for deep tone & presence.",
  },
  '14" - Base Price: $1150-6.5"-10 Lugs-14mm': {
    highlightedCharacteristics: "Bold, full-bodied, and powerful. Delivers rich depth with crisp highs.",
    primaryGenre: "Metal",
    secondaryGenres: ["Progressive Rock", "Punk"],
    playingSituation: "Arena Performances & High-Energy Sessions",
    recordingMic: "Shure Beta 52A or Earthworks DM20 for aggressive attack.",
  },
  '14" - Base Price: $1200-5.5"-10 Lugs-7mm': {
    highlightedCharacteristics: "Deep, resonant projection with a controlled response.",
    primaryGenre: "Orchestral",
    secondaryGenres: ["Big Band", "Contemporary Jazz"],
    playingSituation: "Concert Halls & Studio Recordings",
    recordingMic: "Royer R-121 or Neumann KM84 for detail.",
  },
  '14" - Base Price: $1250-6.0"-10 Lugs-7mm': {
    highlightedCharacteristics: "Enhanced low-end warmth with precision control.",
    primaryGenre: "Big Band Jazz",
    secondaryGenres: ["Symphonic", "Contemporary Jazz"],
    playingSituation: "Large Ensemble & Studio Work",
    recordingMic: "Neumann U87 for warmth & balance.",
  },
  '14" - Base Price: $1300-6.5"-10 Lugs-7mm': {
    highlightedCharacteristics: "Maximum resonance with deep, complex sustain.",
    primaryGenre: "Orchestral",
    secondaryGenres: ["Contemporary Jazz", "Experimental"],
    playingSituation: "Concert Hall & Recording Studio",
    recordingMic: "AKG C414 for depth & clarity.",
  },
};

export default drumSummaries;