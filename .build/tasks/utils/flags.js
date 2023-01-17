import { argv } from 'yargs';

export const open = argv.o;

export const browserSync = argv.bs;

export const notify = argv.n;

export default { open, browserSync, notify };
