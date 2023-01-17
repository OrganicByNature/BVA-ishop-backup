'use strict';

import opn from 'opn';

export const open = () => {
  opn(`http://${process.env.URL}?preview_theme_id=${process.env.THEME_ID}`);
  return Promise.resolve(true);
};

open.description = 'Opens browser window to preview theme defined in `.env`';
