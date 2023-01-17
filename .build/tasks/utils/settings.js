'use strict';

import dotenv from 'dotenv';
dotenv.config();

import flags from './flags';
import config from './config';
import { isProduction, selectEnabledItems } from './utility';

import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import liquidcss from 'postcss-shopify-liquid-expander';

import alias from 'rollup-plugin-alias';
import strip from 'rollup-plugin-strip';
import uglify from 'rollup-plugin-uglify';
import replace from 'rollup-plugin-replace';
import commonjs from 'rollup-plugin-commonjs';
import rollupBabel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import rootImport from 'rollup-plugin-root-import';

const sourcemapSettings = {
  init: { loadMaps: true },
  write: { sourceMappingURL: file => `{{ '${file.relative}.map' | asset_url }}` }
};

const size = {
  showFiles: true,
  showTotal: false
};

const sass = {
  outputStyle: 'compressed'
};

const postcssSettings = {
  plugins: [
    { plugin: autoprefixer({ browsers: config.supportedBrowsers }), enabled: true },
    { plugin: liquidcss, enabled: true },
    { plugin: cssnano({ preset: config.cssnano }), enabled: config.cssnano }
  ]
};

const postcss = selectEnabledItems(postcssSettings.plugins);

const babelSettings = {
  babelrc: false,
  presets: [
    ['env', { modules: false, targets: { browsers: config.supportedBrowsers }}],
    'stage-3'
  ],
  plugins: [
    { plugin: 'transform-remove-strict-mode', enabled: true }
  ]
};

const rollupPluginSettings = {
  resolve: { preferBuiltins: false },
  replace: { 'process.env.NODE_ENV': JSON.stringify('development') },
  rootImport: {
    root: `${ process.cwd() }/dev/scripts`,
    useEntry: 'prepend',
    extensions: '.js'
  },
  strip: {
    debugger: true,
    functions: [ 'console.log', 'assert.*', 'debug', 'alert' ],
    sourcemap: true
  },
  babel: {
    include: [ 'dev/scripts/**' ],
    exclude: [ 'node_modules/**' ],
    plugins: [ 'external-helpers' ],
    presets: babelSettings.presets,
    babelrc: babelSettings.babelrc
  },
  alias: {
    '@vue': 'node_modules/vue/dist/vue.esm.js',
    '@axios': 'node_modules/axios-es6/dist/axios.min.js',
    '@algoliasearchlite': 'node_modules/algoliasearch/dist/algoliasearchLite.min.js'
  }
};

const rollupSettings = {
  plugins: [
    { plugin: resolve(rollupPluginSettings.resolve), enabled: true },
    { plugin: rollupBabel(rollupPluginSettings.babel), enabled: true },
    { plugin: commonjs(), enabled: true },
    { plugin: rootImport(rollupPluginSettings.rootImport), enabled: true },
    { plugin: alias(rollupPluginSettings.alias), enabled: true },
    { plugin: replace(rollupPluginSettings.replace), enabled: true },
    { plugin: uglify(), enabled: isProduction() },
    { plugin: strip(rollupPluginSettings.strip), enabled: isProduction() }
  ]
};

// browser-sync.js
export const browserSync = {
  config: {
    open: flags.open,
    online: true,
    port: 1337,
    xip: true
  }
};

// rollup.js
export const rollup = {
  size,
  sourcemap: {
    init: sourcemapSettings.init,
    write: (config.externalSourcemap.js) ? ['.', sourcemapSettings.write] : []
  },
  rename: {
    basename: config.jsBundleName.split('.')[0],
    extname: '.js'
  },
  options: {
    input: 'dev/scripts/main.js',
    plugins: selectEnabledItems(rollupSettings.plugins),
    sourcemap: !isProduction(),
    format: 'iife'
  }
};

// scripts.js
export const scripts = {
  BUNDLE_NAME: config.jsBundleName,
  size,
  sourcemap: {
    write: (config.externalSourcemap.js) ? ['.', sourcemapSettings.write] : []
  },
  babel: {
    presets: babelSettings.presets,
    plugins: selectEnabledItems(babelSettings.plugins)
  }
};

// styles.js
export const styles = {
  size,
  sass,
  postcss,
  sourcemap: {
    write: (config.externalSourcemap.css) ? ['.', sourcemapSettings.write] : []
  }
};

// upload.js
export const upload = {
  shopify: [
    process.env.API_KEY,
    process.env.PASSWORD,
    process.env.URL,
    process.env.THEME_ID,
    { basePath: 'deploy/'}
  ]
};

// vendor-scripts.js
export const vendorScripts = {
  size
};

// vendor-styles.js
export const vendorStyles = {
  size,
  sass,
  postcss
};
