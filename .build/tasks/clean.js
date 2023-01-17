'use strict';

import del from 'del';

export const cleanGlob = [ 'deploy/**/*' ];

export const clean = () =>
  del(cleanGlob, { force: true });

clean.description = 'Deletes generated files inside of `/deploy`';
