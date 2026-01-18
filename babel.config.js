module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }],
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@utils': './src/utils',
            '@theme': './src/theme',
            '@hooks': './src/hooks',
            '@assets': './src/assets',
          },
        },
      ],
    ],
};
