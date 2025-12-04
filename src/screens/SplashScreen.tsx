import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { WebView } from 'react-native-webview';

export type SplashProps = NativeStackScreenProps<RootStackParamList, 'Splash'>;

type Phase = 'web' | 'logo';

const { width: W, height: H } = Dimensions.get('window');
const isSmall = W <= 360 || H <= 700;
const vw = Math.min(W * (isSmall ? 0.82 : 0.9), 360);
const vh = isSmall ? 100 : 120;
const logoSize = isSmall ? 140 : 180;

export default function SplashScreen({ navigation }: SplashProps) {
  const [phase, setPhase] = useState<Phase>('web');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logo'), 3000);
    const t2 = setTimeout(() => navigation.replace('Onboarding'), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [navigation]);

  const LOADER_HTML = useMemo(
    () => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<style>
  html,body{margin:0;padding:0;width:100%;height:100%;background:transparent;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .wrapper-grid{--animation-duration:2.1s;--cube-color:#0000;--highlight-color:#00cc44;--cube-width:48px;--cube-height:48px;--font-size:1.8em;
    position:relative;inset:0;display:grid;grid-template-columns:repeat(7,var(--cube-width));grid-template-rows:auto;grid-gap:0;
    width:calc(7 * var(--cube-width));height:var(--cube-height);perspective:350px;font-family:sans-serif;font-size:var(--font-size);font-weight:800;color:transparent;transform:translateZ(0)}
  .cube{position:relative;transform-style:preserve-3d;animation:translate-z var(--animation-duration) ease-in-out infinite}
  .face{position:absolute;display:flex;align-items:center;justify-content:center;width:var(--cube-width);height:var(--cube-height);background-color:var(--cube-color);will-change:transform,box-shadow,background-color}
  .face-left,.face-right,.face-back,.face-front{box-shadow:inset 0 0 2px 1px #0001,inset 0 0 12px 1px #fff1}
  .face-front{transform:rotateY(0deg) translateZ(calc(var(--cube-width)/2))}
  .face-back{transform:rotateY(180deg) translateZ(calc(var(--cube-width)/2));opacity:.6}
  .face-left{transform:rotateY(-90deg) translateZ(calc(var(--cube-width)/2));opacity:.6}
  .face-right{transform:rotateY(90deg) translateZ(calc(var(--cube-width)/2));opacity:.6}
  .face-top{height:var(--cube-width);transform:rotateX(90deg) translateZ(calc(var(--cube-width)/2));opacity:.8}
  .face-bottom{height:var(--cube-width);transform:rotateX(-90deg) translateZ(calc(var(--cube-height) - var(--cube-width)*.5));opacity:.8}
  .cube:nth-child(1){z-index:0;animation-delay:0s}.cube:nth-child(2){z-index:1;animation-delay:.2s}.cube:nth-child(3){z-index:2;animation-delay:.4s}
  .cube:nth-child(4){z-index:3;animation-delay:.6s}.cube:nth-child(5){z-index:2;animation-delay:.8s}.cube:nth-child(6){z-index:1;animation-delay:1s}.cube:nth-child(7){z-index:0;animation-delay:1.2s}
  .cube .face{animation:face-color var(--animation-duration) ease-in-out infinite,edge-glow var(--animation-duration) ease-in-out infinite;animation-delay:inherit}
  .cube .face.face-front{animation:face-color var(--animation-duration) ease-in-out infinite,face-glow var(--animation-duration) ease-in-out infinite,edge-glow var(--animation-duration) ease-in-out infinite;animation-delay:inherit}
  @keyframes translate-z{0%,40%,100%{transform:translateZ(-2px)}30%{transform:translateZ(16px) translateY(-1px)}}
  @keyframes face-color{0%,50%,100%{background-color:var(--cube-color)}10%{background-color:var(--highlight-color)}}
  @keyframes face-glow{0%,50%,100%{color:#fff0;filter:none}30%{color:#fff;filter:drop-shadow(0 14px 10px var(--highlight-color))}}
  @keyframes edge-glow{0%,40%,100%{box-shadow:inset 0 0 2px 1px #0001,inset 0 0 12px 1px #fff1}30%{box-shadow:0 0 2px 0 var(--highlight-color)}}
</style></head>
<body>
  <div class="wrapper-grid">
    ${Array.from({ length: 7 }).map(() => `
      <div class="cube">
        <div class="face face-front"></div><div class="face face-back"></div>
        <div class="face face-left"></div><div class="face face-right"></div>
        <div class="face face-top"></div><div class="face face-bottom"></div>
      </div>`).join('')}
  </div>
</body></html>`,
    []
  );

  return (
    <View style={styles.container}>
      {phase === 'web' ? (
        <WebView
          originWhitelist={['*']}
          source={{ html: LOADER_HTML, baseUrl: 'about:blank' }}
          style={[styles.webview, { width: vw, height: vh }]}
          scrollEnabled={false}
          automaticallyAdjustContentInsets={false}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          androidLayerType="hardware"
        />
      ) : (
        <View style={styles.logoWrap}>
          <Image source={require('../assets/logo.png')} style={{ width: logoSize, height: logoSize }} resizeMode="contain" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#028EE5', alignItems: 'center', justifyContent: 'center' },
  webview: { backgroundColor: 'transparent' },
  logoWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
});
