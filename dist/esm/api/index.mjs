import { r as register$1 } from '../../register-B_JUAKoE.mjs';
import '../../get-pipe-path-D2pYDmQS.mjs';
import { r as register, i as isBarePackageNamePattern, c as cjsExtensionPattern } from '../../register-BaEVGEKQ.mjs';
import '../../require-BX8UoeTJ.mjs';
import { i as isFeatureSupported, e as esmLoadReadFile } from '../../node-features-Bye2pwSD.mjs';
import 'node:module';
import 'node:worker_threads';
import 'node:url';
import 'module';
import 'node:path';
import '../../temporary-directory-CM_Hq0H1.mjs';
import 'node:os';
import 'get-tsconfig';
import 'node:fs';
import '../../index-CI_rqePr.mjs';
import 'esbuild';
import 'node:crypto';
import '../../client-Cg5Bp24g.mjs';
import 'node:net';

const tsImport = (specifier, options) => {
  if (!options || typeof options === "object" && !options.parentURL) {
    throw new Error("The current file path (import.meta.url) must be provided in the second argument of tsImport()");
  }
  const isOptionsString = typeof options === "string";
  const parentURL = isOptionsString ? options : options.parentURL;
  const namespace = Date.now().toString();
  const cjs = register({
    namespace
  });
  if (!isFeatureSupported(esmLoadReadFile) && (!isBarePackageNamePattern.test(specifier) && cjsExtensionPattern.test(specifier))) {
    return Promise.resolve(cjs.require(specifier, parentURL));
  }
  const api = register$1({
    namespace,
    ...isOptionsString ? {} : options
  });
  return api.import(specifier, parentURL);
};

export { register$1 as register, tsImport };
