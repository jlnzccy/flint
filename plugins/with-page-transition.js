// Expo config plugin — durable native override of react-native-screens' Android
// `ios_from_right` page-push animation.
//
// Why: rns ships this preset on the SHORT system anim-time (~100-150ms), which reads as
// a snap on Android (measured ~100ms vs Duolingo's ~290ms glide), and it ignores the
// JS `animationDuration` prop for this preset. The real lever is the native res/anim
// XMLs. App resources override a library's by name, so we drop our own copies in.
//
// This project is CNG (android/ is gitignored + regenerated), so a hand-edited res file
// wouldn't survive a prebuild — this plugin re-writes them on every prebuild instead.
// Keep the four files in sync (duration + interpolator). predictiveBackGestureEnabled is
// false in app.json, so the fragment tween path (these anims) is what actually runs.

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const DURATION = 300; // ms — Duolingo-ish glide; well inside the Material full-screen band

// Material "standard easing" = cubic-bezier(0.4, 0, 0.2, 1), Android's built-in
// fast_out_slow_in. Gentle ramp in, smooth decelerate to rest — the canonical buttery
// page-push curve. Used on all four layers so the foreground + parallax move in lockstep.
const EASING = '@android:interpolator/fast_out_slow_in';

// incoming page slides in from the right
const FOREGROUND_OPEN = `<?xml version="1.0" encoding="utf-8"?>
<translate xmlns:android="http://schemas.android.com/apk/res/android"
    android:duration="${DURATION}"
    android:interpolator="${EASING}"
    android:fromXDelta="100%"
    android:toXDelta="0%" />
`;

// outgoing page parallaxes -30% as the new one enters; matched to the foreground
const BACKGROUND_OPEN = `<?xml version="1.0" encoding="utf-8"?>
<translate xmlns:android="http://schemas.android.com/apk/res/android"
    android:duration="${DURATION}"
    android:interpolator="${EASING}"
    android:fromXDelta="0%"
    android:toXDelta="-30%" />
`;

// pop: the top page slides back off to the right
const FOREGROUND_CLOSE = `<?xml version="1.0" encoding="utf-8"?>
<translate xmlns:android="http://schemas.android.com/apk/res/android"
    android:duration="${DURATION}"
    android:interpolator="${EASING}"
    android:fromXDelta="0%"
    android:toXDelta="100%" />
`;

// pop: the previous page slides back in from its -30% parallax offset to rest
const BACKGROUND_CLOSE = `<?xml version="1.0" encoding="utf-8"?>
<translate xmlns:android="http://schemas.android.com/apk/res/android"
    android:duration="${DURATION}"
    android:interpolator="${EASING}"
    android:fromXDelta="-30%"
    android:toXDelta="0%" />
`;

const FILES = {
  'rns_ios_from_right_foreground_open.xml': FOREGROUND_OPEN,
  'rns_ios_from_right_background_open.xml': BACKGROUND_OPEN,
  'rns_ios_from_right_foreground_close.xml': FOREGROUND_CLOSE,
  'rns_ios_from_right_background_close.xml': BACKGROUND_CLOSE,
};

module.exports = function withPageTransition(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const animDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'anim'
      );
      fs.mkdirSync(animDir, { recursive: true });
      for (const [name, xml] of Object.entries(FILES)) {
        fs.writeFileSync(path.join(animDir, name), xml, 'utf8');
      }
      return cfg;
    },
  ]);
};
