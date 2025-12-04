import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  Easing,
  Share,
  Image,
  Platform,
  StatusBar,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ChoiceType = 'calm' | 'steady' | 'quick';

const { width: W0, height: H0 } = Dimensions.get('window');
const small = W0 <= 360 || H0 <= 700;

const BG = '#028EE5';
const KEY_TYPE = '@choice_type';
const KEY_LAST = '@last_balls';
const KEY_MAX = '@max_balls';
const CORRECT: Array<'A' | 'B' | 'C'> = Array(12).fill('B') as Array<'A' | 'B' | 'C'>;

const IMAGES = {
  type_calm: require('../assets/type_calm.png'),
  type_steady: require('../assets/type_steady.png'),
  type_quick: require('../assets/type_quick.png'),
  mentor: require('../assets/mentor_max.png'),
  board: require('../assets/board_clip.png'),
};

type QA = { title: string; a: string; b: string; c: string };

const QUESTIONS: QA[] = [
  { title: 'Unexpected choice\nYou need to decide without preparation.', a: 'Pause and think it through', b: 'Quickly scan the options', c: 'Go with the first instinct' },
  { title: 'Time pressure\nYou’re asked to respond immediately.', a: 'Ask for a moment', b: 'Answer after a short check', c: 'Answer right away' },
  { title: 'New opportunity\nSomething new appears suddenly.', a: 'Look for possible risks', b: 'Weigh pros and cons', c: 'Jump in' },
  { title: 'Too many options\nYou see multiple choices at once.', a: 'Narrow them down slowly', b: 'Pick between two', c: 'Take the first acceptable one' },
  { title: 'First reaction\nA decision lands on you unexpectedly.', a: 'Take a breath', b: 'Focus on the main detail', c: 'Act immediately' },
  { title: 'Instinct check\nYou don’t have full information.', a: 'Wait until you do', b: 'Decide with what’s available', c: 'Trust instinct' },
  { title: 'Interruptions\nSomeone pushes you to choose faster.', a: 'Ask them to wait', b: 'Speed up carefully', c: 'Decide instantly' },
  { title: 'Change of plan\nPlans change last minute.', a: 'Recalculate everything', b: 'Adjust calmly', c: 'Switch instantly' },
  { title: 'Decision fatigue\nYou’ve already made many choices today.', a: 'Slow down', b: 'Simplify the decision', c: 'Choose without thinking' },
  { title: 'Unknown result\nYou don’t know the outcome.', a: 'Prefer safety', b: 'Accept some uncertainty', c: 'Take the risk' },
  { title: 'One-shot choice\nYou can’t redo this decision.', a: 'Double-check internally', b: 'Pick what makes sense', c: 'Commit immediately' },
  { title: 'Final moment\nThe clock is almost at zero.', a: 'Freeze briefly', b: 'Choose steadily', c: 'Act fast' },
];

export default function QuizeScreen() {
  const [{ isSmall }, setSize] = useState({ isSmall: small });
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setSize({ isSmall: window.width <= 360 || window.height <= 700 });
    });
    return () => sub.remove();
  }, []);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [qIndex, setQIndex] = useState(0);
  const [seconds, setSeconds] = useState(10);
  const [picked, setPicked] = useState<'A' | 'B' | 'C' | null>(null);
  const [result, setResult] = useState<ChoiceType | null>(null);
  const counts = useRef({ A: 0, B: 0, C: 0 });
  const correctRef = useRef(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY_TYPE).then((val) => {
      if (val === 'calm' || val === 'steady' || val === 'quick') setResult(val);
    });
  }, []);

  const bar = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  const resFade = useRef(new Animated.Value(0)).current;
  const resRise = useRef(new Animated.Value(24)).current;

  const titleSize = useMemo(() => (isSmall ? 16 : 18), [isSmall]);
  const btnH = useMemo(() => (isSmall ? 44 : 48), [isSmall]);

  const resetAnim = () => {
    fade.setValue(0);
    rise.setValue(16);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const clearTimers = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startTimer = useCallback(() => {
    clearTimers();
    bar.setValue(1);
    setSeconds(10);
    resetAnim();
    Animated.timing(bar, { toValue: 0, duration: 10000, easing: Easing.linear, useNativeDriver: false }).start();
    intervalRef.current = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    timeoutRef.current = setTimeout(() => handleTimeout(), 10000);
  }, [qIndex]);

  useEffect(() => clearTimers, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        clearTimers();
        setPhase('intro');
        setQIndex(0);
        setPicked(null);
        setSeconds(10);
      };
    }, [])
  );

  const start = () => {
    counts.current = { A: 0, B: 0, C: 0 };
    correctRef.current = 0;
    setQIndex(0);
    setPicked(null);
    setPhase('play');
    startTimer();
  };

  const finalize = async () => {
    clearTimers();
    const { A, B, C } = counts.current;
    let typ: ChoiceType = 'calm';
    if (B >= A && B >= C) typ = 'steady';
    else if (C >= A && C > B) typ = 'quick';
    else typ = 'calm';
    setResult(typ);
    await AsyncStorage.setItem(KEY_TYPE, typ);
    const last = correctRef.current;
    await AsyncStorage.setItem(KEY_LAST, String(last));
    const maxRaw = await AsyncStorage.getItem(KEY_MAX);
    const max = Number(maxRaw);
    if (!Number.isFinite(max) || last > max) {
      await AsyncStorage.setItem(KEY_MAX, String(last));
    }
    setPhase('done');
  };

  useEffect(() => {
    if (phase === 'done') {
      resFade.setValue(0);
      resRise.setValue(24);
      Animated.stagger(120, [
        Animated.timing(resFade, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(resRise, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [phase]);

  const handleTimeout = async () => {
    if (picked) return;
    if (qIndex + 1 < QUESTIONS.length) {
      setQIndex((i) => i + 1);
      setPicked(null);
      startTimer();
    } else {
      await finalize();
    }
  };

  const handlePick = async (choice: 'A' | 'B' | 'C') => {
    if (picked) return;
    setPicked(choice);
    if (choice === 'A') counts.current.A += 1;
    if (choice === 'B') counts.current.B += 1;
    if (choice === 'C') counts.current.C += 1;
    if (choice === CORRECT[qIndex]) correctRef.current += 1;

    clearTimers();
    setTimeout(async () => {
      if (qIndex + 1 < QUESTIONS.length) {
        setQIndex(qIndex + 1);
        setPicked(null);
        startTimer();
      } else {
        await finalize();
      }
    }, 320);
  };

  const retry = () => start();

  const shareResult = async () => {
    if (!result) return;
    const title = result === 'calm' ? 'Calm Drifter' : result === 'steady' ? 'Steady Core' : 'Quick Spark';
    const body =
      result === 'calm'
        ? "I don't rush decisions. Slow means careful."
        : result === 'steady'
        ? 'I react when it makes sense. I stay centered.'
        : 'I act fast and adjust later. Movement feels natural to me.';
    await Share.share({ message: `${title}\n${body}` });
  };

  const q = QUESTIONS[qIndex];
  const barWidth = bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const Header = () => (
    <View style={styles.header}>
      <Text style={styles.headerText}>Choice Type</Text>
      <View style={styles.headerUnderline} />
    </View>
  );

  const bottomSafePad = Platform.select({
    ios: isSmall ? 88 : 96,
    android: (StatusBar.currentHeight || 0) + (isSmall ? 68 : 76),
    default: isSmall ? 88 : 96,
  });

  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Header />
          <View style={styles.introFill} />
          <Pressable style={[styles.startBtn, { height: btnH, bottom: bottomSafePad, zIndex: 30 }]} onPress={start}>
            <Text style={styles.startText}>Start Choice Type</Text>
          </Pressable>
          <View pointerEvents="none" style={[styles.manLayer, { bottom: bottomSafePad + (isSmall ? 12 : 16) }]}>
            <Image source={IMAGES.mentor} style={{ width: isSmall ? 260 : 300, height: isSmall ? 400 : 440 }} resizeMode="contain" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'play') {
    const contentTopShift = 90;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Header />
          <View style={styles.timerCenterWrap}>
            <View style={styles.timerBarBg}>
              <Animated.View style={[styles.timerBarFill, { width: barWidth }]} />
            </View>
            <Text style={styles.timerText}>
              {seconds}s • {qIndex + 1}/{QUESTIONS.length}
            </Text>
          </View>

          <Animated.View style={[styles.boardOuter, { opacity: fade, transform: [{ translateY: rise }] }]}>
            <ImageBackground
              source={IMAGES.board}
              style={[styles.boardImg, { minHeight: isSmall ? 500 : 580 }]}
              imageStyle={styles.boardImageStyle}
              resizeMode="stretch"
            >
              <View style={[styles.boardContent, { paddingTop: (isSmall ? 36 : 40) + contentTopShift }]}>
                <Text style={[styles.qTitle, { fontSize: titleSize, color: '#FFFFFF', textAlign: 'center' }]}>
                  {q.title}
                </Text>

                <Pressable onPress={() => handlePick('A')} style={[styles.answer, styles.answerNarrow, picked === 'A' && styles.answerActive]}>
                  <View style={styles.answerPrefix}><Text style={styles.answerPrefixText}>A</Text></View>
                  <Text style={styles.answerText}>{q.a}</Text>
                </Pressable>

                <Pressable onPress={() => handlePick('B')} style={[styles.answer, styles.answerNarrow, picked === 'B' && styles.answerActive]}>
                  <View style={styles.answerPrefix}><Text style={styles.answerPrefixText}>B</Text></View>
                  <Text style={styles.answerText}>{q.b}</Text>
                </Pressable>

                <Pressable onPress={() => handlePick('C')} style={[styles.answer, styles.answerNarrow, picked === 'C' && styles.answerActive]}>
                  <View style={styles.answerPrefix}><Text style={styles.answerPrefixText}>C</Text></View>
                  <Text style={styles.answerText}>{q.c}</Text>
                </Pressable>
              </View>
            </ImageBackground>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const resTitle = result === 'calm' ? 'Calm Drifter' : result === 'steady' ? 'Steady Core' : 'Quick Spark';
  const resText =
    result === 'calm'
      ? "You don’t rush decisions.\nYou like to feel the direction first.\nSlow doesn’t mean weak — it means\ncareful.\n\nYou move after feeling stable."
      : result === 'steady'
      ? "You react when it makes sense.\nNot too fast. Not too late.\nYou stay centered.\n\nYou balance your move."
      : "You act first and adjust later.\nSpeed gives you momentum.\nMovement feels natural to you.\n\nYou don’t wait — you start.";
  const resImg = result === 'calm' ? IMAGES.type_calm : result === 'steady' ? IMAGES.type_steady : IMAGES.type_quick;

  const gapBelowImage = (isSmall ? 18 : 22) + 30;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Header />
        <Animated.View
          style={[
            styles.resultTop,
            { marginTop: 38, marginBottom: gapBelowImage, opacity: resFade, transform: [{ translateY: resRise }] },
          ]}
        >
          <View style={styles.glow} />
          <Image source={resImg} style={{ width: isSmall ? 200 : 240, height: isSmall ? 200 : 240 }} resizeMode="contain" />
        </Animated.View>

        <Animated.Text
          style={[
            styles.resTitle,
            { fontSize: isSmall ? 26 : 28, opacity: resFade, transform: [{ translateY: resRise }] },
          ]}
        >
          {resTitle}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.resText,
            { fontSize: isSmall ? 14 : 15, opacity: resFade, transform: [{ translateY: resRise }] },
          ]}
        >
          {resText}
        </Animated.Text>

        <Animated.View
          style={[
            styles.resBtns,
            { opacity: resFade, transform: [{ translateY: resRise }], marginTop: 16 },
          ]}
        >
          <Pressable style={styles.retryBtn} onPress={retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
          <Pressable style={styles.shareBtn} onPress={shareResult}>
            <Text style={styles.shareText}>Share</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const BTN = '#B6FF7A';
const DARK = '#0E1E2E';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG, alignItems: 'center' },

  header: { width: '100%', paddingTop: 12, paddingBottom: 8, alignItems: 'center' },
  headerText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  headerUnderline: { marginTop: 8, width: '76%', height: 2, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 2 },

  introFill: { flex: 1, width: '100%' },

  startBtn: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: BTN,
    paddingHorizontal: 24,
    borderRadius: 14,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 6,
  },
  startText: { color: DARK, fontWeight: '700', fontSize: 16 },

  manLayer: { position: 'absolute', left: 14, zIndex: 5 },

  timerCenterWrap: { width: '92%', alignItems: 'center', marginTop: 4, marginBottom: 8 },
  timerBarBg: { width: '100%', height: 10, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.15)', overflow: 'hidden' },
  timerBarFill: { height: '100%', backgroundColor: '#2EC15A' },
  timerText: { color: '#FFFFFF', marginTop: 6, fontWeight: '700' },

  boardOuter: { width: '94%' },
  boardImg: { width: '100%', justifyContent: 'flex-start' },
  boardImageStyle: { borderRadius: 16 },
  boardContent: {
    paddingBottom: small ? 24 : 28,
    paddingHorizontal: small ? 18 : 22,
  },

  qTitle: { color: DARK, fontWeight: '800', marginBottom: 12 },

  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: small ? 12 : 14,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    marginTop: 12,
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  answerNarrow: { marginHorizontal: 10 },
  answerActive: { borderColor: '#2EC15A', backgroundColor: '#F3FFF7' },

  answerPrefix: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2EC15A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    transform: [{ translateY: 1 }],
  },
  answerPrefixText: {
    color: '#0A1C12',
    fontWeight: '800',
    fontSize: small ? 13 : 14,
    includeFontPadding: false,
    textAlign: 'center',
  },

  answerText: { color: DARK, flexShrink: 1, fontSize: small ? 15 : 16 },

  resultTop: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: small ? 240 : 280, height: small ? 240 : 280, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.33)' },

  resTitle: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },
  resText: { color: '#FFFFFF', textAlign: 'center', opacity: 0.95, paddingHorizontal: 28, lineHeight: 20 },

  resBtns: { flexDirection: 'row', gap: 12 },
  retryBtn: { backgroundColor: BTN, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: DARK, fontWeight: '700' },
  shareBtn: { backgroundColor: 'rgba(0,0,0,0.18)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  shareText: { color: '#FFFFFF', fontWeight: '700' },
});
