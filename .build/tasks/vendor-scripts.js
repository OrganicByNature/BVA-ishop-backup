'use strict';

import size from 'gulp-size';
import { extname } from 'path';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import { src, dest, watch, series } from 'gulp';
import { existsSync, readdirSync } from 'fs';

import { handleUglifyError, isProduction } from './utils/utility';
import { vendorScripts as settings } from './utils/settings';

const getScriptPaths = dir => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(item => extname(item) === '.js')
    .map(script => `${dir}/${script}`);
};

const getBuildVendorScripts = scripts => {
  return scripts.filter(script => {
    const isOppositeScript = (isProduction()) ? !script.includes('.min.') : script.includes('.min.');
    const scriptPair = (isProduction()) ? script.replace('.js', '.min.js') : script.replace('.min.js', '.js');
    const scriptPairExists = scripts.includes(scriptPair);
    return (isOppositeScript && scriptPairExists) ? false : true;
  });
};

const generateVendorScriptsGlob = dir => {
  const vendorScripts = [ ...getScriptPaths(`${dir}/priority`), ...getScriptPaths(dir) ];
  return getBuildVendorScripts(vendorScripts);
};

export const vendorScriptsGlob = [ ...generateVendorScriptsGlob('dev/vendor/scripts') ];

export const vendorScripts = () =>
  src(vendorScriptsGlob, { allowEmpty: true })
    .pipe(concat('vendor.js'))
    .pipe(uglify().on('error', handleUglifyError))
    .pipe(size(settings.size))
    .pipe(dest('deploy/assets'));

export const vendorScriptsWatch = () =>
  watch(vendorScriptsGlob, series(vendorScripts));

vendorScripts.displayName = 'vendor:scripts';
vendorScripts.description = 'Concatenates and uglifies JavaScript in `dev/vendor/scripts`';
