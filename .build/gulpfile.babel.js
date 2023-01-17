'use strict';

import { task, series, parallel } from 'gulp';

import { copy, copyWatch } from './tasks/copy';
import { open } from './tasks/open';
import { clean } from './tasks/clean';
import { styles, stylesWatch } from './tasks/styles';
import { upload } from './tasks/upload';
import { scripts, scriptsWatch } from './tasks/scripts';
import { imageCopy, imageCopyWatch } from './tasks/image-copy';
import { vendorStyles, vendorStylesWatch } from './tasks/vendor-styles';
import {
  rollupTask as rollup,
  rollupTaskWatch as rollupWatch,
} from './tasks/rollup';
import {
  vendorScripts,
  vendorScriptsGlob,
  vendorScriptsWatch,
} from './tasks/vendor-scripts';
import { startBrowserSync as browserSync } from './tasks/browser-sync';
import { svgstore, svgstoreWatch } from './tasks/svgstore';

import flags from './tasks/utils/flags';
import config from './tasks/utils/config';
import { selectEnabledItems } from './tasks/utils/utility';

const watch = () => {
  copyWatch();
  imageCopyWatch();
  stylesWatch();
  config.rollup ? rollupWatch() : scriptsWatch();
  vendorStylesWatch();
  vendorScriptsWatch();
  svgstoreWatch();
  return Promise.resolve(true);
};

const tasks = {
  prebuild: [{ task: clean, enabled: true }],
  build: [
    { task: svgstore, enabled: true },
    { task: copy, enabled: true },
    { task: imageCopy, enabled: true },
    { task: styles, enabled: true },
    { task: config.rollup ? rollup : scripts, enabled: true },
    { task: vendorStyles, enabled: true },
    { task: vendorScripts, enabled: vendorScriptsGlob.length > 0 },
  ],
  postbuild: [
    { task: browserSync, enabled: flags.browserSync },
    { task: open, enabled: flags.open && !flags.browserSync },
    { task: watch, enabled: true },
  ],
};

const prebuildTasks = series(selectEnabledItems(tasks.prebuild));
const buildTasks = parallel(selectEnabledItems(tasks.build));
const postbuildTasks = parallel(selectEnabledItems(tasks.postbuild));

const build = series(prebuildTasks, buildTasks);
build.displayName = 'build';
build.description = 'Checks for new version of build and then runs a new build';

const defaultTasks = series(prebuildTasks, buildTasks, postbuildTasks, upload);
defaultTasks.description =
  'Checks for new version of build, then runs a new build and watches files';
defaultTasks.flags = {
  '--skip-update': 'Bypasses check for new build version',
  '--bs': 'Enables browser-sync',
  '-o': 'Enables open',
  '-n': 'Enables upload notifications',
};

task(clean);
task(copy);
task(imageCopy);
task(svgstore);
task(styles);
task(scripts);
task(rollup);
task(vendorStyles);
task(vendorScripts);
task(browserSync);
task(open);
task(watch);
task(upload);
task(build);

export default defaultTasks;
