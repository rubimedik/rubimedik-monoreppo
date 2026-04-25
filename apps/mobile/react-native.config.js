module.exports = {
  dependencies: {
    'agora-react-native-rtm': {
      platforms: {
        ios: null, // disable autolinking on iOS to avoid aosl.xcframework conflict
      },
    },
  },
};
