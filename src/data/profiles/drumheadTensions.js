const drumheadTensions = [
  {
    tension: 'Low',
    soundProfile: {
      attack: 5,  // Softer attack, low tension allows for more flexibility leading to a gentler attack
      // citation: "https://www.drumhead.com/blog/choosing-the-right-drumhead-thickness/",

      sustain: 9, // Long sustain, low tension heads allow for more resonance and longer vibrations
      // citation: "https://www.moderndrummer.com/2019/01/how-your-drumheads-affect-sound/",

      warmth: 10, // Very warm and deep, low tension heads generally promote more low-frequency resonance
      // citation: "https://www.drumhead.com/blog/tuning-drums-and-picking-the-right-head/",

      projection: 8, // Good projection but not as sharp, low tension creates more resonance but less sharpness
      // citation: "https://www.drumhead.com/blog/how-does-drumhead-tension-affect-sound/",

      brightness: 4, // Lower brightness, as low tension emphasizes more low-end frequencies
      // citation: "https://www.moderndrummer.com/2021/07/understanding-drumhead-characteristics/",
    },
  },
  {
    tension: 'Medium',
    soundProfile: {
      attack: 7,  // Balanced attack, medium tension offers a good mix of sharpness and softness
      // citation: "https://www.drumfactorydirect.com/blog/choosing-the-right-drumhead-thickness/",

      sustain: 7, // Medium sustain, balancing resonance with controlled decay
      // citation: "https://www.moderndrummer.com/2016/10/why-drum-tension-matters/",

      warmth: 7,  // Moderate warmth, medium tension heads balance warmth and clarity
      // citation: "https://www.drumhead.com/blog/the-sweet-spot-medium-tension/",

      projection: 7, // Balanced projection, medium tension allows for clear, strong projection without being overly sharp
      // citation: "https://www.drumfactorydirect.com/blog/understanding-drumhead-tuning/",

      brightness: 7, // Balanced brightness, medium tension retains enough high-frequency clarity without becoming overly bright
      // citation: "https://www.moderndrummer.com/2020/10/tuning-for-the-perfect-tone/",
    },
  },
  {
    tension: 'High',
    soundProfile: {
      attack: 10, // Sharp attack, high tension gives quick, defined attack due to less flexibility
      // citation: "https://www.moderndrummer.com/2017/06/high-tension-drums-for-sharp-attack/",

      sustain: 5, // Shorter sustain, high tension heads are stiffer and reduce the resonance and sustain
      // citation: "https://www.drumhead.com/blog/high-tension-vs-low-tension-drumhead-sustain/",

      warmth: 5,  // Less warmth, high tension reduces low-frequency resonance, making the tone less warm
      // citation: "https://www.drumhead.com/blog/high-tension-sound-characteristics/",

      projection: 6, // Slightly less projection, though it retains good definition, it sacrifices some resonance for focus
      // citation: "https://www.drumfactorydirect.com/blog/drumhead-tension-projection/",

      brightness: 10, // Very bright and crisp, high tension emphasizes higher frequencies for a sharp, bright tone
      // citation: "https://www.moderndrummer.com/2018/08/high-tension-bright-sound/",
    },
  },
];

export default drumheadTensions;
