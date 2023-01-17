'use strict';

import browserSync from 'browser-sync';

import { browserSync as settings } from './utils/settings';
import { getRedirectUrlDestination } from './utils/utility';

const initBrowserSync = (config = settings.config) => {
  return new Promise((resolve, reject) => {
    bs.init(config, () => resolve());
  });
};

export const bs = browserSync.create();

export const startBrowserSync = async () => {
  const destination = await getRedirectUrlDestination(process.env.URL);
  settings.config.proxy = `${destination.href}?preview_theme_id=${process.env.THEME_ID}`;
  await initBrowserSync(settings.config);
  return Promise.resolve(true);
};

startBrowserSync.displayName = 'browser-sync';
startBrowserSync.description = 'Enables browser-sync to live reload your changes';
