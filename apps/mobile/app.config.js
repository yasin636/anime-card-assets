const { expo } = require('./app.json');
module.exports = {
 ...expo,
 android: {...expo.android, googleServicesFile:'./google-services.json'},
 plugins: [
  ['expo-video',{supportsBackgroundPlayback:false,supportsPictureInPicture:false}],
  'expo-font',
  ['expo-secure-store',{configureAndroidBackup:true}],
  '@react-native-firebase/app',
  '@react-native-google-signin/google-signin',
  ['expo-build-properties',{ios:{useFrameworks:'static'}}],
  ['expo-image-picker',{photosPermission:'Choose profile and Feed photos for AniGooD.',cameraPermission:false,microphonePermission:false}],
 ],
};
