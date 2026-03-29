import path from 'path';
import type { UserConfigExport } from '@tarojs/cli';

export default {
  projectName: 'clocktower-miniapp',
  date: '2026-03-28',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist_mp_runtimefix',
  plugins: [],
  defineConstants: {},
  copy: {
    patterns: [
      { from: 'src/assets/', to: 'dist/assets/' },
    ],
    options: {},
  },
  framework: 'react',
  compiler: 'webpack5',
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
    react: path.resolve(__dirname, '..', 'node_modules', 'react'),
    'react-dom': path.resolve(__dirname, '..', 'node_modules', '@tarojs', 'react'),
    'react-dom/client': path.resolve(__dirname, '..', 'node_modules', '@tarojs', 'react'),
    scheduler: path.resolve(__dirname, '..', 'node_modules', 'scheduler'),
    uuid: path.resolve(__dirname, '..', 'src', 'shims', 'uuid.ts'),
  },
  mini: {
    debugReact: true,
    compile: {
      include: [
        (modulePath: string) => modulePath.indexOf('packages/core') >= 0,
      ],
    },
    postcss: {
      pxtransform: { enable: true, config: {} },
      cssModules: { enable: false, config: { namingPattern: 'module', generateScopedName: '[name]__[local]___[hash:base64:5]' } },
    },
  },
} satisfies UserConfigExport;
