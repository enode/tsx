'use strict';

var register = require('../../register-DkZnad-9.cjs');
require('../../get-pipe-path-BaGxHT0p.cjs');
var register$1 = require('../../register-Ub5WlxfS.cjs');
require('../../require-B8HkRup7.cjs');
var nodeFeatures = require('../../node-features-B5a2EPMS.cjs');
require('node:module');
require('node:worker_threads');
require('node:url');
require('module');
require('node:path');
require('../../temporary-directory-dlKDKQR6.cjs');
require('node:os');
require('get-tsconfig');
require('node:fs');
require('../../index-BApZamEo.cjs');
require('esbuild');
require('node:crypto');
require('../../client-DQ4cSd5u.cjs');
require('node:net');

const tsImport = (specifier, options) => {
  if (!options || typeof options === "object" && !options.parentURL) {
    throw new Error("The current file path (import.meta.url) must be provided in the second argument of tsImport()");
  }
  const isOptionsString = typeof options === "string";
  const parentURL = isOptionsString ? options : options.parentURL;
  const namespace = Date.now().toString();
  const cjs = register$1.register({
    namespace
  });
  if (!nodeFeatures.isFeatureSupported(nodeFeatures.esmLoadReadFile) && (!register$1.isBarePackageNamePattern.test(specifier) && register$1.cjsExtensionPattern.test(specifier))) {
    return Promise.resolve(cjs.require(specifier, parentURL));
  }
  const api = register.register({
    namespace,
    ...isOptionsString ? {} : options
  });
  return api.import(specifier, parentURL);
};

exports.register = register.register;
exports.tsImport = tsImport;
