import LottieView from 'lottie-react-native';

/* Native celebration fire. lottie-react-native's web build pulls in
   @lottiefiles/dotlottie-react (not installed, and a heavy wasm dep), so web gets the
   emoji variant in fire-anim.web.tsx — Metro resolves that automatically. */
export function FireAnim({ size }: { size: number }) {
  return (
    <LottieView
      source={require('../../assets/lottie/fire.json')}
      autoPlay
      loop
      style={{ width: size, height: size, alignSelf: 'center' }}
    />
  );
}
