module.exports = {
  preset: 'react-native',
  testPathIgnorePatterns: [
    '/node_modules/',
    '__tests__/helpers/',      // 테스트 헬퍼 (테스트 파일 아님)
    '__tests__/firestore/',    // 에뮬레이터 필요 (npm run emulators 후 별도 실행)
    '__tests__/App.test.tsx',  // Firebase 네이티브 모듈 필요
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(' + [
      'react-native',
      '@react-native',
      '@react-navigation',
      '@react-native-firebase',
      '@react-native-community',
      '@react-native-seoul',
      '@react-native-kakao',
    ].join('|') + ')/)',
  ],
};
