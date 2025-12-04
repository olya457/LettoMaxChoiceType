import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  SafeAreaView,
  Image,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W0, height: H0 } = Dimensions.get('window');
const small0 = W0 <= 360 || H0 <= 700;

const BG = '#028EE5';
const BTN = '#63B861';
const BTN_LIGHT = '#9EE38F';
const DOT = '#2EC15A';

const KEY_MAX = '@max_balls';
const DURATION_SEC = 3 * 60 * 60;

const IMAGES = {
  man: require('../assets/man_clip.png'),
};

type Phase = 'idle' | 'active' | 'done';

export default function MaxActiveScreen() {
  const [{ isSmall }, setSize] = useState({ isSmall: small0 });
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setSize({ isSmall: window.width <= 360 || window.height <= 700 });
    });
    return () => sub.remove();
  }, []);

  const [phase, setPhase] = useState<Phase>('idle');
  const [remaining, setRemaining] = useState<number>(DURATION_SEC);
  const [balls, setBalls] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [task, setTask] = useState<string | null>(null);

  const TASKS: string[] = [
    'Do 10 push-ups.',
    'Stand up and stretch for 30 seconds.',
    'Walk for 2 minutes.',
    'Drink a full glass of water.',
    'Take 5 deep breaths.',
    'Read one short random fact.',
    'Learn one thing you didn’t know today.',
    'Look out the window for 20 seconds.',
    'Write down one quick thought.',
    'Close your eyes for 15 seconds.',
    'Do 15 squats.',
    'Clean one small surface nearby.',
    'Put your phone down for 1 minute.',
    'Check your posture and correct it.',
    'Smile for 10 seconds.',
    'Move your arms for 20 seconds.',
    'Read a short quote once.',
    'Stand still and relax your shoulders.',
    'Reset your desk area briefly.',
    'Take a slow breath in and out five times.',
  ];

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const loadBalls = async () => {
    const raw = await AsyncStorage.getItem(KEY_MAX);
    const n = Number(raw);
    setBalls(Number.isFinite(n) && n >= 0 ? n : 0);
  };

  useEffect(() => {
    loadBalls();
    return clearTimer;
  }, []);

  const format = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  };

  const pickRandomTask = () => TASKS[Math.floor(Math.random() * TASKS.length)];

  const contentFade = useRef(new Animated.Value(0)).current;
  const contentRise = useRef(new Animated.Value(16)).current;

  const animateIn = () => {
    contentFade.setValue(0);
    contentRise.setValue(16);
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentRise, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    animateIn();
  }, [phase, isSmall, remaining === DURATION_SEC]);

  const start = () => {
    setTask(pickRandomTask());
    setPhase('active');
    setRemaining(DURATION_SEC);
    clearTimer();
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setPhase('idle');
          setTask(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finish = async () => {
    if (phase !== 'active') return;
    clearTimer();
    const next = balls + 1;
    setBalls(next);
    await AsyncStorage.setItem(KEY_MAX, String(next));
    setPhase('done');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setPhase('idle');
    setTask(null);
    setRemaining(DURATION_SEC);
  };

  const titleSize = useMemo(() => (isSmall ? 16 : 18), [isSmall]);
  const manW = isSmall ? 200 : 240;
  const manH = isSmall ? 315 : 360;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Max Active</Text>
          <View style={styles.headerUnderline} />
        </View>

        <View style={styles.badgeWrap}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{balls}</Text>
            <View style={styles.badgeDot} />
          </View>
        </View>

        {phase === 'active' ? (
          <Animated.View style={[styles.center, { opacity: contentFade, transform: [{ translateY: contentRise }] }]}>
            <Text style={styles.timerText}>{format(remaining)}</Text>
            {task && <Text style={[styles.taskText, { fontSize: titleSize }]}>{task}</Text>}
            <Pressable onPress={finish} style={styles.btn}>
              <View style={styles.btnTop} />
              <Text style={styles.btnText}>Done</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.center, { opacity: contentFade, transform: [{ translateY: contentRise }] }]}>
            <Pressable onPress={start} style={[styles.btn, { marginTop: 28 }]}>
              <View style={styles.btnTop} />
              <Text style={styles.btnText}>Start</Text>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View
          style={[
            styles.manWrap,
            { opacity: contentFade, transform: [{ translateY: contentRise }] },
          ]}
        >
          <Image source={IMAGES.man} style={{ width: manW, height: manH, resizeMode: 'contain' }} />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>One move. One ball.</Text>
          </View>
        </Animated.View>

        <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
          <View style={styles.modalBackdrop}>
            <Animated.View
              style={[
                styles.modalCard,
                { opacity: contentFade, transform: [{ translateY: contentRise }] },
              ]}
            >
              <Text style={styles.modalTitle}>Done. One ball earned.</Text>
              <View style={styles.modalRow}>
                <View style={[styles.badgeDot, { width: 16, height: 16, borderRadius: 8, borderWidth: 0 }]} />
                <Text style={styles.modalPlus}>+1</Text>
              </View>
              <Pressable onPress={closeModal} style={[styles.btn, { width: 140, marginTop: 14 }]}>
                <View style={styles.btnTop} />
                <Text style={styles.btnText}>Cool</Text>
              </Pressable>
              <Pressable style={styles.modalClose} onPress={closeModal}>
                <Text style={{ color: '#395247', fontWeight: '800' }}>×</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const TAB_H = 64;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG, alignItems: 'center' },

  header: { width: '100%', paddingTop: 12, paddingBottom: 8, alignItems: 'center' },
  headerText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  headerUnderline: { marginTop: 8, width: '76%', height: 2, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 2 },

  badgeWrap: { position: 'absolute', right: 12, top: 40, paddingTop: 20 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeText: { color: '#fff', fontWeight: '800', marginRight: 6 },
  badgeDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: DOT, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },

  center: { alignItems: 'center', marginTop: 12 },

  timerText: { color: '#FFFFFF', fontWeight: '800', marginTop: 8 },
  taskText: { color: '#FFFFFF', textAlign: 'center', marginTop: 10, paddingHorizontal: 24 },

  btn: { marginTop: 12, backgroundColor: BTN, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 14, overflow: 'hidden' },
  btnTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 14, backgroundColor: BTN_LIGHT, opacity: 0.35, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  btnText: { color: '#0E1E2E', fontWeight: '800' },

  manWrap: { position: 'absolute', left: 18, bottom: 24 + TAB_H - 30, alignItems: 'center' },
  bubble: { position: 'absolute', left: 160, top: 60, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 },
  bubbleText: { color: '#17322A', fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: 280, backgroundColor: '#ECF8F0', borderRadius: 14, borderWidth: 2, borderColor: '#7ACB93', padding: 16, alignItems: 'center' },
  modalTitle: { color: '#1A2B22', fontWeight: '800', marginBottom: 10 },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalPlus: { color: '#1A2B22', fontWeight: '800' },
  modalClose: { position: 'absolute', right: 8, top: 6, padding: 6 },
});
