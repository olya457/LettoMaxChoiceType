import RNFS from 'react-native-fs';
import { Image as RNImage } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { PermissionsAndroid, Platform } from 'react-native';

async function ensurePermission() {
  if (Platform.OS !== 'android') return true;

  const api = Number(Platform.Version);
  const perm =
    api >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

  const res = await PermissionsAndroid.request(perm);
  return res === PermissionsAndroid.RESULTS.GRANTED;
}

export async function saveFromRequire(img: any, filename: string) {
  const src = RNImage.resolveAssetSource(img);
  if (!src?.uri) throw new Error('Failed to get image URI');

  await ensurePermission();

  const tempPath = `${RNFS.CachesDirectoryPath}/${filename}_${Date.now()}.png`;

  if (src.uri.startsWith('http')) {
   
    await RNFS.downloadFile({ fromUrl: src.uri, toFile: tempPath }).promise;
  } else {
   
    if (Platform.OS === 'android') {
      let rel = src.uri.replace('asset:/', '').replace('file:///android_asset/', '');
      await RNFS.copyFileAssets(rel, tempPath);
    } else {
      const base64 = await RNFS.readFile(src.uri, 'base64');
      await RNFS.writeFile(tempPath, base64, 'base64');
    }
  }

  const finalUri = 'file://' + tempPath;

  await CameraRoll.save(finalUri, {
    type: 'photo',
    album: 'RooBall',
  });

  return true;
}
