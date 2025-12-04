import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  Easing,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W0, height: H0 } = Dimensions.get('window');
const small = W0 <= 360 || H0 <= 700;
const BG = '#028EE5';

const KEY_TYPE = '@choice_type';
const CANDIDATE_MAX_KEYS = ['@max_balls', '@maxBalls', 'max_balls', 'MAX_BALLS', 'maxBalls'];

type ChoiceType = 'calm' | 'steady' | 'quick' | null;

const IMAGES = {
  question: require('../assets/home_question.png'),
  type_calm: require('../assets/type_calm.png'),
  type_steady: require('../assets/type_steady.png'),
  type_quick: require('../assets/type_quick.png'),
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [{ isSmall }, setSize] = useState({ isSmall: small });

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setSize({ isSmall: window.width <= 360 || window.height <= 700 });
    });
    return () => sub.remove();
  }, []);

  const [maxBalls, setMaxBalls] = useState<number>(0);
  const [choiceType, setChoiceType] = useState<ChoiceType>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;
  const imgScale = useRef(new Animated.Value(0.92)).current;
  const glowPulse = useRef(new Animated.Value(0.8)).current;

  const loadFromStorage = async () => {
    try {
      const typeRaw = await AsyncStorage.getItem(KEY_TYPE);
      let ballsRaw: string | null = null;
      for (const k of CANDIDATE_MAX_KEYS) {
        const v = await AsyncStorage.getItem(k);
        if (v !== null) {
          ballsRaw = v;
          break;
        }
      }
      if (typeRaw === 'calm' || typeRaw === 'steady' || typeRaw === 'quick') setChoiceType(typeRaw);
      else setChoiceType(null);
      const n = Number(ballsRaw);
      setMaxBalls(Number.isFinite(n) && n >= 0 ? n : 0);
    } catch {
      setChoiceType(null);
      setMaxBalls(0);
    }
  };

  useEffect(() => {
    loadFromStorage();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadFromStorage();
      return () => {};
    }, [])
  );

  const title = useMemo(() => {
    if (choiceType === 'calm') return 'Calm Drifter';
    if (choiceType === 'steady') return 'Steady Core';
    if (choiceType === 'quick') return 'Quick Spark';
    return '';
  }, [choiceType]);

  const subtitle = useMemo(() => {
    switch (choiceType) {
      case 'calm':
        return "You don’t rush decisions.\nYou like to feel the direction first.\nSlow doesn’t mean weak — it means\ncareful.";
      case 'steady':
        return 'You react when it makes sense.\nNot too fast. Not too late.\nYou stay centered.';
      case 'quick':
        return 'You act first and adjust later.\nSpeed gives you momentum.\nMovement feels natural to you.';
      default:
        return 'Find out how you react.';
    }
  }, [choiceType]);

  const centerImage = useMemo(() => {
    if (choiceType === 'calm') return IMAGES.type_calm;
    if (choiceType === 'steady') return IMAGES.type_steady;
    if (choiceType === 'quick') return IMAGES.type_quick;
    return IMAGES.question;
  }, [choiceType]);

  const imgSize = useMemo(() => {
    const base = isSmall ? 220 : 260;
    return { w: base, h: base };
  }, [isSmall]);

  const imgBottomSpace = useMemo(() => (isSmall ? 40 : 64), [isSmall]);
  const titleSize = useMemo(() => (isSmall ? 26 : 28), [isSmall]);
  const subSize = useMemo(() => (isSmall ? 14 : 15), [isSmall]);
  const topInset = useMemo(() => (isSmall ? 8 : 12), [isSmall]);
  const badgePad = useMemo(() => (isSmall ? 4 : 6), [isSmall]);
  const glowSize = useMemo(() => (isSmall ? 260 : 300), [isSmall]);

  const animateIn = () => {
    fade.setValue(0);
    rise.setValue(16);
    imgScale.setValue(0.92);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(imgScale, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    animateIn();
  }, [choiceType, isSmall]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.8, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const startChoiceType = () => navigation.navigate('quize');

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.counterWrap, { paddingTop: topInset + 108 }]}>
        <View style={[styles.counterBadge, { paddingVertical: badgePad }]}>
          <Text style={[styles.counterText, { fontSize: isSmall ? 12 : 13 }]}>{maxBalls}</Text>
          <View style={styles.counterDot} />
        </View>
      </View>

      <Animated.View
        style={[
          styles.centerWrap,
          { opacity: fade, transform: [{ translateY: rise }], marginBottom: imgBottomSpace },
        ]}
      >
        <Animated.View
          style={[
            styles.glow,
            {
              width: glowSize,
              height: glowSize,
              opacity: glowPulse.interpolate({ inputRange: [0.8, 1], outputRange: [0.28, 0.38] }),
            },
          ]}
        />
        <Animated.Image
          source={centerImage}
          style={{ width: imgSize.w, height: imgSize.h, transform: [{ scale: imgScale }] }}
          resizeMode="contain"
        />
      </Animated.View>

      {choiceType ? (
        <>
          <Animated.Text
            style={[
              styles.typeTitle,
              { opacity: fade, transform: [{ translateY: rise }], fontSize: titleSize, lineHeight: titleSize + 4 },
            ]}
          >
            {title}
          </Animated.Text>
          <Animated.Text
            style={[
              styles.typeSubtitle,
              { opacity: fade, transform: [{ translateY: rise }], fontSize: subSize },
            ]}
          >
            {subtitle}
          </Animated.Text>
        </>
      ) : (
        <>
          <Animated.Text
            style={[
              styles.preSubtitle,
              { opacity: fade, transform: [{ translateY: rise }], fontSize: subSize },
            ]}
          >
            {subtitle}
          </Animated.Text>
          <Pressable style={styles.primaryBtn} onPress={startChoiceType}>
            <Text style={[styles.primaryBtnText, { fontSize: isSmall ? 14 : 15 }]}>Start Choice Type</Text>
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, alignItems: 'center' },
  counterWrap: { width: '100%', paddingHorizontal: 16, alignItems: 'flex-end' },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  counterText: { color: '#FFFFFF', fontWeight: '700', marginRight: 6 },
  counterDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2EC15A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  centerWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  glow: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.32)' },
  preSubtitle: { color: '#FFFFFF', textAlign: 'center', marginTop: 12 },
  primaryBtn: { marginTop: 14, backgroundColor: '#B6FF7A', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  primaryBtnText: { color: '#0E1E2E', fontWeight: '700' },
  typeTitle: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center', marginTop: 8 },
  typeSubtitle: { color: '#FFFFFF', textAlign: 'center', opacity: 0.95, marginTop: 10 },
});
