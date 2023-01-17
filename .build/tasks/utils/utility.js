'use strict';

import chalk from 'chalk';
import log from 'fancy-log';
import { parse } from 'url';
import { resolve } from 'path';
import { request } from 'urllib';
import { branch } from 'git-rev-sync';
import { sync as delSync } from 'del';

import { liquidInCss, liquidInJs } from './config';

export const addLiquidExtension = path => {
  return (path.extname === '.css' && liquidInCss || path.extname === '.js' && liquidInJs) ? path.extname += '.liquid' : path;
};

export const isProduction = (productionBranchName = 'production') => {
  return branch().toLowerCase() === productionBranchName;
};

export const handleSassError = ({ relativePath: path, line, column: col, formatted: msg }) => {
  log.error(chalk`🚨  {white.bgRed.bold Error} {white in} {white.underline ${path}:${line}:${col}}

{red ${msg}}`);
};

export const handleUglifyError = ({ cause: { message: msg, filename: path, line, col }}) => {
  log.error(chalk`🚨  {white.bgRed.bold Error} {white in} {white.underline ${path}:${line}:${col}} {red Error: ${msg}}`);
};

export const getRedirectUrlDestination = redirectUrl => {
  return new Promise((resolve, reject) => {
    request(redirectUrl)
      .then(result => resolve(parse(result.res.headers.location)))
      .catch(err => reject(err));
  });
};

export const selectEnabledItems = items => {
  return items.reduce((enabledItems, item) => {
      if (!item.enabled) {
        return [ ...enabledItems ];
      } else {
        const dataKey = Object.keys(item).filter(key => key !== 'enabled');
        return [ ...enabledItems, item[dataKey] ];
      }
    }, []);
};

export const deleteFromDeploy = path => {
  const tidyPath = path
    .replace('dev/liquid/', '')
    .replace('dev/images', 'assets')
    .replace(/\/.*\//, '/');
  delSync(resolve('deploy', tidyPath));
};
