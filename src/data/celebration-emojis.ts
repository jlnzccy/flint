/* Noto animated-emoji pool for the "Extra" celebration. Each entry is the
   codepoint path segment under https://fonts.gstatic.com/s/e/notoemoji/latest/<seg>/lottie.json
   — fetched on demand, nothing bundled. See src/components/emoji-confetti.tsx. */
export const CELEBRATION_LOTTIE: string[] = [
  '1f970', '1f929', '1f973', '1f60a', '263a_fe0f', '1f92f', '1f920', '1f911', '1f47b',
  '1f31e', '1f638', '1f31f', '2728', '1f525', '1f4af', '1f389', '1f38a',
  '2764_fe0f_200d_1f525', '1f483', '1fab7', '2604_fe0f', '1f995', '1f422', '1f40a',
  '1f416', '1f410', '1f423', '1f99a', '1f426_200d_1f525', '1f9ad', '1f433', '1f419',
  '1fabc', '1faa9', '1f386', '1f3c6', '1fa8e', '1f451',
  // New celebration emojis
  '1f61b', '1f61d', '1f61c', '1f92a', '1f92d', '1fae1', '1f639', '1f63b', '1f918',
  '1faf0', '1f90c', '1f989', '1f982', '1f37b', '1f942', '1f37e', '1f375', '1f947', '1f3c1',
];

/* Float pool (U3) — the small animated emojis that drift/bob around the celebration
   hero (U2). Drawn from on demand + cached, same as the hero pool; nothing bundled.
   ✨ (2728) is sprinkled in by the floating field itself, so it's not listed here. */
export const CELEBRATION_FLOAT: string[] = [
  '1f61b', '1f61d', '1f61c', '1f92a', '1f92d', '1fae1', '1f638', '1f639', '1f63b',
  '1f918', '1faf0', '1f90c', '1f989', '1f982', '1f37b', '1f942', '1f37e', '1f375',
  '1f947', '1f3c1',
];
