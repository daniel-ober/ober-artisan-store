const feuzonSummaries = {
  pricingOptions: [
    { size: "12", depth: "5.0", price: 1050, reRing: false, stripePriceId: "price_1Qq1kAJbbx8jAR4NoZAX4EbT", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: "6.0", price: 1150, reRing: false, stripePriceId: "price_1Qq1kAJbbx8jAR4NO3d18RPw", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: "7.0", price: 1250, reRing: false, stripePriceId: "price_1Qq1kAJbbx8jAR4NTiyiktS9", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: "5.0", price: 1050, reRing: false, stripePriceId: "price_1QqKTFJbbx8jAR4Ntf8moqYV", lugQuantity: 8, staveQuantity: 16 },
    { size: "12", depth: "6.0", price: 1150, reRing: false, stripePriceId: "price_1QqKTFJbbx8jAR4NT1ELA16g", lugQuantity: 8, staveQuantity: 16 },
    { size: "12", depth: "7.0", price: 1250, reRing: false, stripePriceId: "price_1QqKTFJbbx8jAR4Nb81vzXiA", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: "5.0", price: 1150, reRing: false, stripePriceId: "price_1Qq1ojJbbx8jAR4Ng8g2JK86", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: "6.0", price: 1250, reRing: false, stripePriceId: "price_1Qq1ojJbbx8jAR4NbZLs243e", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: "7.0", price: 1350, reRing: false, stripePriceId: "price_1Qq1ojJbbx8jAR4N1JGwYefS", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: "5.0", price: 1250, reRing: false, stripePriceId: "price_1Qq1ojJbbx8jAR4N6SFUPsta", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: "6.0", price: 1350, reRing: false, stripePriceId: "price_1Qq1ojJbbx8jAR4NU9vCGwFN", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: "7.0", price: 1450, reRing: false, stripePriceId: "price_1Qq1ojJbbx8jAR4NLjCF0Vi3", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: "5.0", price: 1250, reRing: false, stripePriceId: "price_1QqKTFJbbx8jAR4Nbz7gghby", lugQuantity: 10, staveQuantity: 20 },
    { size: "14", depth: "6.0", price: 1350, reRing: false, stripePriceId: "price_1QqKTFJbbx8jAR4NbZ6p64Ad", lugQuantity: 10, staveQuantity: 20 },
    { size: "14", depth: "7.0", price: 1450, reRing: false, stripePriceId: "price_1QqKTFJbbx8jAR4NbJGb3m6H", lugQuantity: 10, staveQuantity: 20 },
    { size: "14", depth: "5.0", price: 1400, reRing: true, stripePriceId: "price_1Qq1ojJbbx8jAR4NF7VCwrg6", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: "6.0", price: 1500, reRing: true, stripePriceId: "price_1Qq1ojJbbx8jAR4NB50atz9L", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: "7.0", price: 1600, reRing: true, stripePriceId: "price_1Qq1ojJbbx8jAR4NmtDd6XKG", lugQuantity: 10, staveQuantity: 10 },
  ],
  '12" - Base Price: $1050-5.0"-6 Lugs-12 - 10mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '12" - Base Price: $1050-5.0"-8 Lugs-16 - 13mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '12" - Base Price: $1050-5.0"-6 Lugs-12 - 10mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '12" - Base Price: $1050-5.0"-8 Lugs-16 - 13mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Fast response with bright attack and controlled resonance.',
    primaryGenre: 'Pop',
    secondaryGenres: ['Jazz', 'Fusion'],
    playingSituation: 'Recording studios & dynamic live sets.',
    recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
  },
  '12" - Base Price: $1050-5.0"-6 Lugs-12 - 10mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '12" - Base Price: $1050-5.0"-8 Lugs-16 - 13mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '12" - Base Price: $1050-5.0"-6 Lugs-12 - 10mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '12" - Base Price: $1050-5.0"-8 Lugs-16 - 13mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '12" - Base Price: $1050-5.0"-6 Lugs-12 - 10mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '12" - Base Price: $1050-5.0"-8 Lugs-16 - 13mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '12" - Base Price: $1050-5.0"-6 Lugs-12 - 10mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '12" - Base Price: $1050-5.0"-8 Lugs-16 - 13mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '12" - Base Price: $1050-5.0"-6 Lugs-12 - 10mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '12" - Base Price: $1050-5.0"-8 Lugs-16 - 13mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Fast response with bright attack and controlled resonance.',
    primaryGenre: 'Pop',
    secondaryGenres: ['Jazz', 'Fusion'],
    playingSituation: 'Recording studios & dynamic live sets.',
    recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
  },
  '12" - Base Price: $1050-5.0"-6 Lugs-12 - 10mm-Cherry-Zebrawood + Mahogany': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '12" - Base Price: $1050-5.0"-8 Lugs-16 - 13mm-Cherry-Zebrawood + Mahogany': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '12" - Base Price: $1050-5.0"-6 Lugs-12 - 10mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '12" - Base Price: $1050-5.0"-8 Lugs-16 - 13mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '12" - Base Price: $1150-6.0"-6 Lugs-12 - 10mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '12" - Base Price: $1150-6.0"-8 Lugs-16 - 13mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '12" - Base Price: $1150-6.0"-6 Lugs-12 - 10mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '12" - Base Price: $1150-6.0"-8 Lugs-16 - 13mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '12" - Base Price: $1150-6.0"-6 Lugs-12 - 10mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '12" - Base Price: $1150-6.0"-8 Lugs-16 - 13mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Fast response with bright attack and controlled resonance.',
    primaryGenre: 'Pop',
    secondaryGenres: ['Jazz', 'Fusion'],
    playingSituation: 'Recording studios & dynamic live sets.',
    recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
  },
  '12" - Base Price: $1150-6.0"-6 Lugs-12 - 10mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '12" - Base Price: $1150-6.0"-8 Lugs-16 - 13mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '12" - Base Price: $1150-6.0"-6 Lugs-12 - 10mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '12" - Base Price: $1150-6.0"-8 Lugs-16 - 13mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '12" - Base Price: $1150-6.0"-6 Lugs-12 - 10mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '12" - Base Price: $1150-6.0"-8 Lugs-16 - 13mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '12" - Base Price: $1150-6.0"-6 Lugs-12 - 10mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '12" - Base Price: $1150-6.0"-8 Lugs-16 - 13mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '12" - Base Price: $1150-6.0"-6 Lugs-12 - 10mm-Cherry-Zebrawood + Mahogany': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '12" - Base Price: $1150-6.0"-8 Lugs-16 - 13mm-Cherry-Zebrawood + Mahogany': {
    highlightedCharacteristics:
      'Fast response with bright attack and controlled resonance.',
    primaryGenre: 'Pop',
    secondaryGenres: ['Jazz', 'Fusion'],
    playingSituation: 'Recording studios & dynamic live sets.',
    recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
  },
  '12" - Base Price: $1150-6.0"-6 Lugs-12 - 10mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '12" - Base Price: $1150-6.0"-8 Lugs-16 - 13mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '12" - Base Price: $1250-7.0"-6 Lugs-12 - 10mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '12" - Base Price: $1250-7.0"-8 Lugs-16 - 13mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '12" - Base Price: $1250-7.0"-6 Lugs-12 - 10mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '12" - Base Price: $1250-7.0"-8 Lugs-16 - 13mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '12" - Base Price: $1250-7.0"-6 Lugs-12 - 10mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '12" - Base Price: $1250-7.0"-8 Lugs-16 - 13mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '12" - Base Price: $1250-7.0"-6 Lugs-12 - 10mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '12" - Base Price: $1250-7.0"-8 Lugs-16 - 13mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Fast response with bright attack and controlled resonance.',
    primaryGenre: 'Pop',
    secondaryGenres: ['Jazz', 'Fusion'],
    playingSituation: 'Recording studios & dynamic live sets.',
    recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
  },
  '12" - Base Price: $1250-7.0"-6 Lugs-12 - 10mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '12" - Base Price: $1250-7.0"-8 Lugs-16 - 13mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '12" - Base Price: $1250-7.0"-6 Lugs-12 - 10mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '12" - Base Price: $1250-7.0"-8 Lugs-16 - 13mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '12" - Base Price: $1250-7.0"-6 Lugs-12 - 10mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '12" - Base Price: $1250-7.0"-8 Lugs-16 - 13mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '12" - Base Price: $1250-7.0"-6 Lugs-12 - 10mm-Cherry-Zebrawood + Mahogany': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '12" - Base Price: $1250-7.0"-8 Lugs-16 - 13mm-Cherry-Zebrawood + Mahogany': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '12" - Base Price: $1250-7.0"-6 Lugs-12 - 10mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '12" - Base Price: $1250-7.0"-8 Lugs-16 - 13mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Fast response with bright attack and controlled resonance.',
    primaryGenre: 'Pop',
    secondaryGenres: ['Jazz', 'Fusion'],
    playingSituation: 'Recording studios & dynamic live sets.',
    recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
  },
  '13" - Base Price: $1150-5.0"-8 Lugs-16 - 13mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '13" - Base Price: $1150-5.0"-8 Lugs-16 - 13mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '13" - Base Price: $1150-5.0"-8 Lugs-16 - 13mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '13" - Base Price: $1150-5.0"-8 Lugs-16 - 13mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '13" - Base Price: $1150-5.0"-8 Lugs-16 - 13mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '13" - Base Price: $1150-5.0"-8 Lugs-16 - 13mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '13" - Base Price: $1150-5.0"-8 Lugs-16 - 13mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '13" - Base Price: $1150-5.0"-8 Lugs-16 - 13mm-Cherry-Zebrawood + Mahogany': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '13" - Base Price: $1150-5.0"-8 Lugs-16 - 13mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '13" - Base Price: $1250-6.0"-8 Lugs-16 - 13mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Fast response with bright attack and controlled resonance.',
    primaryGenre: 'Pop',
    secondaryGenres: ['Jazz', 'Fusion'],
    playingSituation: 'Recording studios & dynamic live sets.',
    recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
  },
  '13" - Base Price: $1250-6.0"-8 Lugs-16 - 13mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '13" - Base Price: $1250-6.0"-8 Lugs-16 - 13mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '13" - Base Price: $1250-6.0"-8 Lugs-16 - 13mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '13" - Base Price: $1250-6.0"-8 Lugs-16 - 13mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '13" - Base Price: $1250-6.0"-8 Lugs-16 - 13mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '13" - Base Price: $1250-6.0"-8 Lugs-16 - 13mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '13" - Base Price: $1250-6.0"-8 Lugs-16 - 13mm-Cherry-Zebrawood + Mahogany': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '13" - Base Price: $1250-6.0"-8 Lugs-16 - 13mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '13" - Base Price: $1350-7.0"-8 Lugs-16 - 13mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '13" - Base Price: $1350-7.0"-8 Lugs-16 - 13mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Fast response with bright attack and controlled resonance.',
    primaryGenre: 'Pop',
    secondaryGenres: ['Jazz', 'Fusion'],
    playingSituation: 'Recording studios & dynamic live sets.',
    recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
  },
  '13" - Base Price: $1350-7.0"-8 Lugs-16 - 13mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '13" - Base Price: $1350-7.0"-8 Lugs-16 - 13mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '13" - Base Price: $1350-7.0"-8 Lugs-16 - 13mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '13" - Base Price: $1350-7.0"-8 Lugs-16 - 13mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '13" - Base Price: $1350-7.0"-8 Lugs-16 - 13mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '13" - Base Price: $1350-7.0"-8 Lugs-16 - 13mm-Cherry-Zebrawood + Mahogany': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '13" - Base Price: $1350-7.0"-8 Lugs-16 - 13mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '14" - Base Price: $1250-5.0"-8 Lugs-16 - 13mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '14" - Base Price: $1250-5.0"-10 Lugs-20 - 14mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '14" - Base Price: $1400-5.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Maple-Walnut + Birch':
    {
      highlightedCharacteristics:
        'Fast response with bright attack and controlled resonance.',
      primaryGenre: 'Pop',
      secondaryGenres: ['Jazz', 'Fusion'],
      playingSituation: 'Recording studios & dynamic live sets.',
      recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
    },
  '14" - Base Price: $1250-5.0"-8 Lugs-16 - 13mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '14" - Base Price: $1250-5.0"-10 Lugs-20 - 14mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '14" - Base Price: $1400-5.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Maple-Oak + Cherry':
    {
      highlightedCharacteristics:
        'Strong midrange presence, perfect for versatile tuning.',
      primaryGenre: 'Blues',
      secondaryGenres: ['Hip-Hop', 'R&B'],
      playingSituation: 'Experimental and avant-garde compositions.',
      recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
    },
  '14" - Base Price: $1250-5.0"-8 Lugs-16 - 13mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '14" - Base Price: $1250-5.0"-10 Lugs-20 - 14mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '14" - Base Price: $1400-5.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Maple-Maple + Bubinga':
    {
      highlightedCharacteristics:
        'Dynamic and expressive, with controlled high-end presence.',
      primaryGenre: 'Fusion',
      secondaryGenres: ['Progressive Rock'],
      playingSituation: 'Gospel choirs and church worship sessions.',
      recordingMic: 'Audix i5 or AKG C414 for precise transients.',
    },
  '14" - Base Price: $1250-5.0"-8 Lugs-16 - 13mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '14" - Base Price: $1250-5.0"-10 Lugs-20 - 14mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '14" - Base Price: $1400-5.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Walnut-Mahogany + Cherry':
    {
      highlightedCharacteristics:
        'Powerful projection with rich overtones and deep lows.',
      primaryGenre: 'Metal',
      secondaryGenres: ['Alternative', 'Hard Rock'],
      playingSituation: 'Stadium shows & high-energy rock gigs.',
      recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
    },
  '14" - Base Price: $1250-5.0"-8 Lugs-16 - 13mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Fast response with bright attack and controlled resonance.',
    primaryGenre: 'Pop',
    secondaryGenres: ['Jazz', 'Fusion'],
    playingSituation: 'Recording studios & dynamic live sets.',
    recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
  },
  '14" - Base Price: $1250-5.0"-10 Lugs-20 - 14mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '14" - Base Price: $1400-5.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Walnut-Walnut + Padauk':
    {
      highlightedCharacteristics:
        'Tight and focused snare with quick decay and smooth balance.',
      primaryGenre: 'Indie',
      secondaryGenres: ['Country', 'Folk'],
      playingSituation: 'R&B and neo-soul jam sessions.',
      recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
    },
  '14" - Base Price: $1250-5.0"-8 Lugs-16 - 13mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '14" - Base Price: $1250-5.0"-10 Lugs-20 - 14mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '14" - Base Price: $1400-5.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Walnut-Oak + Wenge':
    {
      highlightedCharacteristics:
        'Articulate snare with defined stick response and full projection.',
      primaryGenre: 'Gospel',
      secondaryGenres: ['Experimental', 'Ambient'],
      playingSituation: 'Big band and brass ensemble performances.',
      recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
    },
  '14" - Base Price: $1250-5.0"-8 Lugs-16 - 13mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '14" - Base Price: $1250-5.0"-10 Lugs-20 - 14mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '14" - Base Price: $1400-5.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Cherry-Birch + Maple':
    {
      highlightedCharacteristics:
        'Warm, vintage-inspired sound with excellent midrange depth.',
      primaryGenre: 'Jazz',
      secondaryGenres: ['Blues', 'Soul'],
      playingSituation: 'Intimate jazz clubs & acoustic sessions.',
      recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
    },
  '14" - Base Price: $1250-5.0"-8 Lugs-16 - 13mm-Cherry-Zebrawood + Mahogany': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '14" - Base Price: $1250-5.0"-10 Lugs-20 - 14mm-Cherry-Zebrawood + Mahogany':
    {
      highlightedCharacteristics:
        'Fast response with bright attack and controlled resonance.',
      primaryGenre: 'Pop',
      secondaryGenres: ['Jazz', 'Fusion'],
      playingSituation: 'Recording studios & dynamic live sets.',
      recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
    },
  '14" - Base Price: $1400-5.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Cherry-Zebrawood + Mahogany':
    {
      highlightedCharacteristics:
        'Rich, full-bodied tone with natural warmth and clarity.',
      primaryGenre: 'Funk',
      secondaryGenres: ['Latin', 'Afrobeat'],
      playingSituation: 'Funk and groove-driven performances.',
      recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
    },
  '14" - Base Price: $1250-5.0"-8 Lugs-16 - 13mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '14" - Base Price: $1250-5.0"-10 Lugs-20 - 14mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '14" - Base Price: $1400-5.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Cherry-Padauk + Ash':
    {
      highlightedCharacteristics:
        'Deep resonance with punchy attack and controlled sustain.',
      primaryGenre: 'Soul',
      secondaryGenres: ['Neo-Soul', 'Funk'],
      playingSituation: 'Orchestral and concert hall settings.',
      recordingMic:
        'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
    },
  '14" - Base Price: $1350-6.0"-8 Lugs-16 - 13mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '14" - Base Price: $1350-6.0"-10 Lugs-20 - 14mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '14" - Base Price: $1500-6.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Maple-Walnut + Birch':
    {
      highlightedCharacteristics:
        'Crisp attack with balanced sustain, ideal for tight articulation.',
      primaryGenre: 'Rock',
      secondaryGenres: ['Pop', 'Indie'],
      playingSituation: 'Live performances & studio recordings.',
      recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
    },
  '14" - Base Price: $1350-6.0"-8 Lugs-16 - 13mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '14" - Base Price: $1350-6.0"-10 Lugs-20 - 14mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '14" - Base Price: $1500-6.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Maple-Oak + Cherry':
    {
      highlightedCharacteristics:
        'Fast response with bright attack and controlled resonance.',
      primaryGenre: 'Pop',
      secondaryGenres: ['Jazz', 'Fusion'],
      playingSituation: 'Recording studios & dynamic live sets.',
      recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
    },
  '14" - Base Price: $1350-6.0"-8 Lugs-16 - 13mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '14" - Base Price: $1350-6.0"-10 Lugs-20 - 14mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '14" - Base Price: $1500-6.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Maple-Maple + Bubinga':
    {
      highlightedCharacteristics:
        'Strong midrange presence, perfect for versatile tuning.',
      primaryGenre: 'Blues',
      secondaryGenres: ['Hip-Hop', 'R&B'],
      playingSituation: 'Experimental and avant-garde compositions.',
      recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
    },
  '14" - Base Price: $1350-6.0"-8 Lugs-16 - 13mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '14" - Base Price: $1350-6.0"-10 Lugs-20 - 14mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '14" - Base Price: $1500-6.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Walnut-Mahogany + Cherry':
    {
      highlightedCharacteristics:
        'Dynamic and expressive, with controlled high-end presence.',
      primaryGenre: 'Fusion',
      secondaryGenres: ['Progressive Rock'],
      playingSituation: 'Gospel choirs and church worship sessions.',
      recordingMic: 'Audix i5 or AKG C414 for precise transients.',
    },
  '14" - Base Price: $1350-6.0"-8 Lugs-16 - 13mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '14" - Base Price: $1350-6.0"-10 Lugs-20 - 14mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '14" - Base Price: $1500-6.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Walnut-Walnut + Padauk':
    {
      highlightedCharacteristics:
        'Powerful projection with rich overtones and deep lows.',
      primaryGenre: 'Metal',
      secondaryGenres: ['Alternative', 'Hard Rock'],
      playingSituation: 'Stadium shows & high-energy rock gigs.',
      recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
    },
  '14" - Base Price: $1350-6.0"-8 Lugs-16 - 13mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Fast response with bright attack and controlled resonance.',
    primaryGenre: 'Pop',
    secondaryGenres: ['Jazz', 'Fusion'],
    playingSituation: 'Recording studios & dynamic live sets.',
    recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
  },
  '14" - Base Price: $1350-6.0"-10 Lugs-20 - 14mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '14" - Base Price: $1500-6.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Walnut-Oak + Wenge':
    {
      highlightedCharacteristics:
        'Tight and focused snare with quick decay and smooth balance.',
      primaryGenre: 'Indie',
      secondaryGenres: ['Country', 'Folk'],
      playingSituation: 'R&B and neo-soul jam sessions.',
      recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
    },
  '14" - Base Price: $1350-6.0"-8 Lugs-16 - 13mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '14" - Base Price: $1350-6.0"-10 Lugs-20 - 14mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '14" - Base Price: $1500-6.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Cherry-Birch + Maple':
    {
      highlightedCharacteristics:
        'Articulate snare with defined stick response and full projection.',
      primaryGenre: 'Gospel',
      secondaryGenres: ['Experimental', 'Ambient'],
      playingSituation: 'Big band and brass ensemble performances.',
      recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
    },
  '14" - Base Price: $1350-6.0"-8 Lugs-16 - 13mm-Cherry-Zebrawood + Mahogany': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '14" - Base Price: $1350-6.0"-10 Lugs-20 - 14mm-Cherry-Zebrawood + Mahogany':
    {
      highlightedCharacteristics:
        'Crisp attack with balanced sustain, ideal for tight articulation.',
      primaryGenre: 'Rock',
      secondaryGenres: ['Pop', 'Indie'],
      playingSituation: 'Live performances & studio recordings.',
      recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
    },
  '14" - Base Price: $1450-6.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Cherry-Zebrawood + Mahogany':
    {
      highlightedCharacteristics:
        'Warm, vintage-inspired sound with excellent midrange depth.',
      primaryGenre: 'Jazz',
      secondaryGenres: ['Blues', 'Soul'],
      playingSituation: 'Intimate jazz clubs & acoustic sessions.',
      recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
    },
  '14" - Base Price: $1350-6.0"-8 Lugs-16 - 13mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '14" - Base Price: $1350-6.0"-10 Lugs-20 - 14mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Fast response with bright attack and controlled resonance.',
    primaryGenre: 'Pop',
    secondaryGenres: ['Jazz', 'Fusion'],
    playingSituation: 'Recording studios & dynamic live sets.',
    recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
  },
  '14" - Base Price: $1500-6.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Cherry-Padauk + Ash':
    {
      highlightedCharacteristics:
        'Rich, full-bodied tone with natural warmth and clarity.',
      primaryGenre: 'Funk',
      secondaryGenres: ['Latin', 'Afrobeat'],
      playingSituation: 'Funk and groove-driven performances.',
      recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
    },
  '14" - Base Price: $1450-7.0"-8 Lugs-16 - 13mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-20 - 14mm-Maple-Walnut + Birch': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Maple-Walnut + Birch':
    {
      highlightedCharacteristics:
        'Deep resonance with punchy attack and controlled sustain.',
      primaryGenre: 'Soul',
      secondaryGenres: ['Neo-Soul', 'Funk'],
      playingSituation: 'Orchestral and concert hall settings.',
      recordingMic:
        'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
    },
  '14" - Base Price: $1450-7.0"-8 Lugs-16 - 13mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-20 - 14mm-Maple-Oak + Cherry': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Maple-Oak + Cherry':
    {
      highlightedCharacteristics:
        'Crisp attack with balanced sustain, ideal for tight articulation.',
      primaryGenre: 'Rock',
      secondaryGenres: ['Pop', 'Indie'],
      playingSituation: 'Live performances & studio recordings.',
      recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
    },
  '14" - Base Price: $1450-7.0"-8 Lugs-16 - 13mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-20 - 14mm-Maple-Maple + Bubinga': {
    highlightedCharacteristics:
      'Powerful projection with rich overtones and deep lows.',
    primaryGenre: 'Metal',
    secondaryGenres: ['Alternative', 'Hard Rock'],
    playingSituation: 'Stadium shows & high-energy rock gigs.',
    recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-10 - 10mm + Re-Rings 00-7.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Maple-Maple + Bubinga':
    {
      highlightedCharacteristics:
        'Fast response with bright attack and controlled resonance.',
      primaryGenre: 'Pop',
      secondaryGenres: ['Jazz', 'Fusion'],
      playingSituation: 'Recording studios & dynamic live sets.',
      recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
    },
  '14" - Base Price: $1450-7.0"-8 Lugs-16 - 13mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-20 - 14mm-Walnut-Mahogany + Cherry': {
    highlightedCharacteristics:
      'Tight and focused snare with quick decay and smooth balance.',
    primaryGenre: 'Indie',
    secondaryGenres: ['Country', 'Folk'],
    playingSituation: 'R&B and neo-soul jam sessions.',
    recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Walnut-Mahogany + Cherry':
    {
      highlightedCharacteristics:
        'Strong midrange presence, perfect for versatile tuning.',
      primaryGenre: 'Blues',
      secondaryGenres: ['Hip-Hop', 'R&B'],
      playingSituation: 'Experimental and avant-garde compositions.',
      recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
    },
  '14" - Base Price: $1450-7.0"-8 Lugs-16 - 13mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Deep resonance with punchy attack and controlled sustain.',
    primaryGenre: 'Soul',
    secondaryGenres: ['Neo-Soul', 'Funk'],
    playingSituation: 'Orchestral and concert hall settings.',
    recordingMic: 'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-20 - 14mm-Walnut-Walnut + Padauk': {
    highlightedCharacteristics:
      'Articulate snare with defined stick response and full projection.',
    primaryGenre: 'Gospel',
    secondaryGenres: ['Experimental', 'Ambient'],
    playingSituation: 'Big band and brass ensemble performances.',
    recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Walnut-Walnut + Padauk':
    {
      highlightedCharacteristics:
        'Dynamic and expressive, with controlled high-end presence.',
      primaryGenre: 'Fusion',
      secondaryGenres: ['Progressive Rock'],
      playingSituation: 'Gospel choirs and church worship sessions.',
      recordingMic: 'Audix i5 or AKG C414 for precise transients.',
    },
  '14" - Base Price: $1450-7.0"-8 Lugs-16 - 13mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-20 - 14mm-Walnut-Oak + Wenge': {
    highlightedCharacteristics:
      'Warm, vintage-inspired sound with excellent midrange depth.',
    primaryGenre: 'Jazz',
    secondaryGenres: ['Blues', 'Soul'],
    playingSituation: 'Intimate jazz clubs & acoustic sessions.',
    recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Walnut-Oak + Wenge':
    {
      highlightedCharacteristics:
        'Powerful projection with rich overtones and deep lows.',
      primaryGenre: 'Metal',
      secondaryGenres: ['Alternative', 'Hard Rock'],
      playingSituation: 'Stadium shows & high-energy rock gigs.',
      recordingMic: 'Shure Beta 57A or Earthworks DM20 for crisp attack.',
    },
  '14" - Base Price: $1450-7.0"-8 Lugs-16 - 13mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Fast response with bright attack and controlled resonance.',
    primaryGenre: 'Pop',
    secondaryGenres: ['Jazz', 'Fusion'],
    playingSituation: 'Recording studios & dynamic live sets.',
    recordingMic: 'Neumann U87 or Royer R-121 for smooth detail.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-20 - 14mm-Cherry-Birch + Maple': {
    highlightedCharacteristics:
      'Rich, full-bodied tone with natural warmth and clarity.',
    primaryGenre: 'Funk',
    secondaryGenres: ['Latin', 'Afrobeat'],
    playingSituation: 'Funk and groove-driven performances.',
    recordingMic: 'Audix D4 or AKG C214 for deep tone and clarity.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Cherry-Birch + Maple':
    {
      highlightedCharacteristics:
        'Tight and focused snare with quick decay and smooth balance.',
      primaryGenre: 'Indie',
      secondaryGenres: ['Country', 'Folk'],
      playingSituation: 'R&B and neo-soul jam sessions.',
      recordingMic: 'Shure SM7B or Sennheiser MD421 for strong projection.',
    },
  '14" - Base Price: $1450-7.0"-8 Lugs-16 - 13mm-Cherry-Zebrawood + Mahogany': {
    highlightedCharacteristics:
      'Strong midrange presence, perfect for versatile tuning.',
    primaryGenre: 'Blues',
    secondaryGenres: ['Hip-Hop', 'R&B'],
    playingSituation: 'Experimental and avant-garde compositions.',
    recordingMic: 'Coles 4038 or Sennheiser e604 for vintage character.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-20 - 14mm-Cherry-Zebrawood + Mahogany':
    {
      highlightedCharacteristics:
        'Deep resonance with punchy attack and controlled sustain.',
      primaryGenre: 'Soul',
      secondaryGenres: ['Neo-Soul', 'Funk'],
      playingSituation: 'Orchestral and concert hall settings.',
      recordingMic:
        'Earthworks SR25 or Beyerdynamic MC930 for natural presence.',
    },
  '14" - Base Price: $1450-7.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Cherry-Zebrawood + Mahogany':
    {
      highlightedCharacteristics:
        'Articulate snare with defined stick response and full projection.',
      primaryGenre: 'Gospel',
      secondaryGenres: ['Experimental', 'Ambient'],
      playingSituation: 'Big band and brass ensemble performances.',
      recordingMic: 'Royer R-121 or Neumann KM84 for intricate dynamics.',
    },
  '14" - Base Price: $1450-7.0"-8 Lugs-16 - 13mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Dynamic and expressive, with controlled high-end presence.',
    primaryGenre: 'Fusion',
    secondaryGenres: ['Progressive Rock'],
    playingSituation: 'Gospel choirs and church worship sessions.',
    recordingMic: 'Audix i5 or AKG C414 for precise transients.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-20 - 14mm-Cherry-Padauk + Ash': {
    highlightedCharacteristics:
      'Crisp attack with balanced sustain, ideal for tight articulation.',
    primaryGenre: 'Rock',
    secondaryGenres: ['Pop', 'Indie'],
    playingSituation: 'Live performances & studio recordings.',
    recordingMic: 'Shure SM57 or Neumann KM184 for balanced response.',
  },
  '14" - Base Price: $1450-7.0"-10 Lugs-10 - 10mm + Re-Rings + $150 (Re-Rings Required)-Cherry-Padauk + Ash':
    {
      highlightedCharacteristics:
        'Warm, vintage-inspired sound with excellent midrange depth.',
      primaryGenre: 'Jazz',
      secondaryGenres: ['Blues', 'Soul'],
      playingSituation: 'Intimate jazz clubs & acoustic sessions.',
      recordingMic: 'Beyerdynamic M201 TG or AKG C414 for warm articulation.',
    },
};

export default feuzonSummaries;
