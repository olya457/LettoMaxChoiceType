import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Animated,
  Easing,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

export type OnbProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: W, height: H } = Dimensions.get('window');
const BG = '#028EE5';
const isSmall = W <= 360 || H <= 700;

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  cta: string;
  image: any;
  imageW: number;
  imageH: number;
  offsetY?: number;
};

const scale = (n: number) => (isSmall ? Math.round(n * 0.88) : n);

const SLIDES: Slide[] = [
  {
    key: '1',
    title: 'Meet Max',
    subtitle: "I don't analyze you. I just watch how you choose.",
    cta: 'Start',
    image: require('../assets/onb_man1.png'),
    imageW: scale(300),
    imageH: scale(460),
    offsetY: 10,
  },
  {
    key: '2',
    title: 'One question.\nThree choices.',
    subtitle: 'You have 10 seconds. No thinking too long.',
    cta: 'Sounds fair',
    image: require('../assets/onb_man2.png'),
    imageW: scale(320),
    imageH: scale(440),
    offsetY: 4,
  },
  {
    key: '3',
    title: "This isn't a test.",
    subtitle: "It's about how you react. Fast. Slow. Or balanced.",
    cta: 'Show my type',
    image: require('../assets/onb_man3.png'),
    imageW: scale(300),
    imageH: scale(430),
    offsetY: 0,
  },
  {
    key: '4',
    title: 'One action.\nOne ball.',
    subtitle: 'Start when you’re ready. Finish before time runs out.',
    cta: 'Start',
    image: require('../assets/onb_man4.png'),
    imageW: scale(320),
    imageH: scale(440),
    offsetY: 0,
  },
];

export default function OnboardingScreen({ navigation }: OnbProps) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  const fade = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(16)).current;

  const titleSize = useMemo(() => (isSmall ? 30 : 34), []);
  const subtitleSize = useMemo(() => (isSmall ? 15 : 16), []);
  const bubbleWidth = useMemo(() => Math.min(360, W - 40), []);

  const animateIn = () => {
    fade.setValue(0);
    translate.setValue(16);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    animateIn();
  }, [index]);

  const onNext = () => {
    if (index < SLIDES.length - 1) setIndex((v) => v + 1);
    else navigation.replace('MainTabs');
  };

  const onSkip = () => navigation.replace('MainTabs');

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.slide, { opacity: fade, transform: [{ translateY: translate }] }]}>
        <View style={styles.figureWrap}>
          <Image
            source={slide.image}
            style={{ width: slide.imageW, height: slide.imageH, marginTop: slide.offsetY ?? 0 }}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleSize + 4 }]}>{slide.title}</Text>

        <View style={[styles.bubble, { width: bubbleWidth }]}>
          <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>{slide.subtitle}</Text>
        </View>

        <Pressable style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>{slide.cta}</Text>
        </Pressable>

        <Pressable style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  slide: { flex: 1, alignItems: 'center', paddingTop: isSmall ? 12 : 24, paddingHorizontal: 20 },
  figureWrap: { width: '100%', alignItems: 'center', justifyContent: 'flex-start', marginTop: isSmall ? 0 : 8 },
  title: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center', marginTop: isSmall ? 4 : 8 },
  bubble: {
    backgroundColor: 'rgba(0, 36, 86, 0.35)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: isSmall ? 10 : 14,
    marginTop: isSmall ? 8 : 12,
  },
  subtitle: { color: '#EAF4FF', textAlign: 'center' },
  button: {
    marginTop: isSmall ? 14 : 18,
    paddingHorizontal: isSmall ? 24 : 28,
    paddingVertical: isSmall ? 12 : 14,
    borderRadius: 16,
    backgroundColor: '#B6FF7A',
  },
  buttonText: { color: '#0E1E2E', fontSize: isSmall ? 15 : 16, fontWeight: '700' },
  skipBtn: { marginTop: isSmall ? 8 : 10, padding: 8 },
  skipText: { color: '#EAF4FF', opacity: 0.9, fontSize: isSmall ? 13 : 14 },
  dots: {
    position: 'absolute',
    bottom: isSmall ? 12 : 18,
    width: W,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#FFFFFF', width: 20 },
});
