const { expo } = require('./app.json');
module.exports = {
 ...expo,
 android: {...expo.android, googleServicesFile:'./google-services.json'},
 plugins: [
  'expo-font',
  '@react-native-firebase/app',
  '@react-native-google-signin/google-signin',
  ['expo-build-properties',{ios:{useFrameworks:'static'}}],
  ['expo-image-picker',{photosPermission:'Choose a profile picture for Anime Meta Hub.',cameraPermission:false,microphonePermission:false}],
 ],
};
