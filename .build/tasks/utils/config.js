import chalk from 'chalk';
import log from 'fancy-log';

import config from '../../../.config.json';

const getType = value => {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
};

const validateConfig = (configSetting, types, fallback = false) => {
  const value = config[configSetting];
  const type = getType(value);
  const isValid = types.includes(type);
  if (!isValid && value !== undefined) {
    log.error(chalk`⚠️  {white.bgRed.bold Warning} {white in} {white.underline .config.json}: {bold \`${configSetting}\`} is {bold ${type}}, expected ${types.map(type => chalk.bold(type)).join(' or ')}. Falling back to {bold \`${JSON.stringify(fallback)}\`}`);
  }
  return (isValid) ? value : fallback;
};

export const babel = validateConfig('babel', ['boolean']);

export const cssnano = validateConfig('cssnano', ['boolean', 'string']);

export const externalSourcemap = validateConfig('externalSourcemap', ['object'], { css: false, js: false });

export const jsBundleName = validateConfig('jsBundleName', ['string'], 'bvaccel.js');

export const liquidInCss = validateConfig('liquidInCss', ['boolean'], true);

export const liquidInJs = validateConfig('liquidInJs', ['boolean'], true);

export const rollup = validateConfig('rollup', ['boolean']);

export const stripDebug = validateConfig('stripDebug', ['boolean']);

export const supportedBrowsers = validateConfig('browserSupport', ['string', 'array'], '> 2.5% in US');

export const svgstoreFileName = validateConfig('svgstoreFileName', ['string'], 'icon-store.liquid');

export default {
  babel,
  cssnano,
  externalSourcemap,
  jsBundleName,
  liquidInCss,
  liquidInJs,
  rollup,
  stripDebug,
  supportedBrowsers,
  svgstoreFileName
};
