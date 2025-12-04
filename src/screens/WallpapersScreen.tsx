import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Pressable,
  Alert,
  SafeAreaView,
  Animated,
  Easing,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as RNImage } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useFocusEffect } from '@react-navigation/native';
import RNFS from 'react-native-fs';

const BG = '#028EE5';
const KEY_MAX = '@max_balls';
const KEY_UNLOCKED = '@unlocked_walls';

type Item = { id: string; title: string; img: any; cost: number };

const ITEMS: Item[] = [
  { id: 'steady', title: 'Steady Core', img: require('../assets/wall_steady.png'), cost: 3 },
  { id: 'calm',   title: 'Calm Drift',  img: require('../assets/wall_calm.png'),   cost: 3 },
  { id: 'quick',  title: 'Quick Spark', img: require('../assets/wall_quick.png'),  cost: 3 },
  { id: 'flow',   title: 'Flow State',  img: require('../assets/wall_flow.png'),   cost: 3 },
  { id: 'moment', title: 'The Moment',  img: require('../assets/wall_moment.png'), cost: 3 },
  { id: 'extra6', title: 'Extra Six',   img: require('../assets/wall_steady.png'), cost: 3 },
];

const ICON_LOCK = require('../assets/icon_lock.png');

const cameraRollSaveCompat: (uri: string, opts?: { type?: 'photo'|'video'|'auto'; album?: string }) => Promise<string> =

  (CameraRoll.save ?? (CameraRoll as any).saveToCameraRoll ?? (CameraRoll as any).saveTag).bind(CameraRoll);

async function ensureAndroidPermission() {
  if (Platform.OS !== 'android') return true;
  const api = Number(Platform.Version) || 0;
  const perm =
    api >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  const res = await PermissionsAndroid.request(perm);
  return res === PermissionsAndroid.RESULTS.GRANTED || res === 'granted';
}

async function saveFromRequire(img: any, filename: string) {
  const src = RNImage.resolveAssetSource(img);
  if (!src?.uri) throw new Error('Failed to get image URI');
  if (!(await ensureAndroidPermission())) throw new Error('No permission to access photos/files');

  const tmpPath = `${RNFS.CachesDirectoryPath}/${filename}_${Date.now()}.png`;

  if (src.uri.startsWith('http://') || src.uri.startsWith('https://')) {
    const res = await RNFS.downloadFile({ fromUrl: src.uri, toFile: tmpPath }).promise;
    if (res.statusCode && res.statusCode >= 400) {
      throw new Error(`HTTP ${res.statusCode} when downloading an image`);
    }
  } else if (Platform.OS === 'android') {
    const rel = src.uri.replace('asset:/', '').replace('file:///android_asset/', '');
    await RNFS.copyFileAssets(rel, tmpPath);
  } else {
    const base64 = await RNFS.readFile(src.uri, 'base64');
    await RNFS.writeFile(tmpPath, base64, 'base64');
  }

  const fileUri = 'file://' + tmpPath;
  await cameraRollSaveCompat(fileUri, { type: 'photo', album: 'RooBall' });
  try { await RNFS.unlink(tmpPath); } catch {}
  return true;
}

function WallItem({
  item, isUnlocked, onBuy, onSave, mountDelay = 0,
}: {
  item: Item; isUnlocked: boolean; onBuy: () => void; onSave: () => void; mountDelay?: number;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(rise, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, mountDelay);
    return () => clearTimeout(t);
  }, [fade, rise, mountDelay]);

  return (
    <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: rise }] }]}>
      <View style={styles.wallWrap}>
        <Image source={item.img} style={styles.wall} resizeMode="cover" />
        {!isUnlocked && (
          <View style={styles.lockOverlay}>
            <Image source={ICON_LOCK} style={{ width: 36, height: 36 }} />
          </View>
        )}
      </View>

      <View style={styles.row}>
        <Text style={styles.title}>{item.title}</Text>
        {isUnlocked ? (
          <Pressable style={styles.dlBtn} onPress={onSave}>
            <Text style={styles.dlBtnTxt}>⤓</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.buyBtn} onPress={onBuy}>
            <Text style={styles.buyTxt}>x{item.cost}</Text>
            <View style={styles.dot} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export default function WallpapersScreen() {
  const [balls, setBalls] = useState<number>(0);
  const [unlocked, setUnlocked] = useState<string[]>([]);

  const loadState = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_MAX);
      const n = Number(raw);
      setBalls(Number.isFinite(n) && n >= 0 ? n : 0);

      const saved = await AsyncStorage.getItem(KEY_UNLOCKED);
      setUnlocked(saved ? JSON.parse(saved) : []);
    } catch {}
  }, []);

  useEffect(() => { loadState(); }, [loadState]);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    (async () => { if (mounted) await loadState(); })();
    return () => { mounted = false; };
  }, [loadState]));

  const saveUnlocked = useCallback(async (list: string[]) => {
    setUnlocked(list);
    await AsyncStorage.setItem(KEY_UNLOCKED, JSON.stringify(list));
  }, []);

  const spendBalls = useCallback(async (cnt: number) => {
    const next = Math.max(0, balls - cnt);
    setBalls(next);
    await AsyncStorage.setItem(KEY_MAX, String(next));
  }, [balls]);

  const askBuy = (it: Item) => {
    Alert.alert(
      'Exchange',
      `Unlock “${it.title}” for ${it.cost} balls?`,
      [
        { text: 'No' },
        {
          text: 'Yes',
          onPress: async () => {
            if (balls < it.cost) { Alert.alert('Not enough balls'); return; }
            const next = [...new Set([...unlocked, it.id])];
            await spendBalls(it.cost);
            await saveUnlocked(next);
          },
        },
      ],
      { cancelable: true },
    );
  };

  const saveToGallery = async (img: any, id: string) => {
    try {
      await saveFromRequire(img, `wall_${id}`);
      Alert.alert('Saved', 'Wallpaper added to Photos (album “RooBall”).');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save file.');
    }
  };

  const renderItem = ({ item, index }: { item: Item; index: number }) => (
    <WallItem
      item={item}
      isUnlocked={unlocked.includes(item.id)}
      onBuy={() => askBuy(item)}
      onSave={() => saveToGallery(item.img, item.id)}
      mountDelay={index * 60}
    />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallpapers</Text>
        <View style={styles.headerLine} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{balls}</Text>
          <View style={styles.dot} />
        </View>
      </View>

      <FlatList
        contentContainerStyle={{ paddingTop: 40, paddingBottom: 140 }}
        data={ITEMS}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 22 }} />}
        ListFooterComponent={<View style={{ height: 120 }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG, paddingHorizontal: 16 },
  header: { alignItems: 'center', paddingTop: 12, marginBottom: 8 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
  headerLine: { marginTop: 8, height: 2, width: '88%', backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 2 },

  badge: {
    position: 'absolute',
    right: 0,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: { color: '#fff', fontWeight: '800', marginRight: 6 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2EC15A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },

  card: { alignItems: 'center' },

  wallWrap: {
    width: '86%',
    aspectRatio: 9 / 14,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0F2433',
  },
  wall: { width: '100%', height: '100%' },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,11,18,0.28)',
  },

  row: { width: '86%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  title: { color: '#fff', fontWeight: '700' },

  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  buyTxt: { color: '#fff', fontWeight: '800', marginRight: 6 },

  dlBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dlBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
