'use strict';

var getPipePath = require('./get-pipe-path-BaGxHT0p.cjs');
var Module = require('node:module');
var path = require('node:path');
var node_url = require('node:url');
var getTsconfig = require('get-tsconfig');
var fs = require('node:fs');
var index = require('./index-BApZamEo.cjs');
var client = require('./client-DQ4cSd5u.cjs');

const getOriginalFilePath = (request) => {
  if (!request.startsWith("data:text/javascript,")) {
    return;
  }
  const queryIndex = request.indexOf("?");
  if (queryIndex === -1) {
    return;
  }
  const searchParams = new URLSearchParams(request.slice(queryIndex + 1));
  const filePath = searchParams.get("filePath");
  if (filePath) {
    return filePath;
  }
};
const interopCjsExports = (request) => {
  const filePath = getOriginalFilePath(request);
  if (filePath) {
    Module._cache[filePath] = Module._cache[request];
    delete Module._cache[request];
    request = filePath;
  }
  return request;
};

const getScheme = (url) => {
  const schemeIndex = url.indexOf(":");
  if (schemeIndex === -1) {
    return;
  }
  return url.slice(0, schemeIndex);
};
const isRelativePath = (request) => request[0] === "." && (request[1] === "/" || (request[1] === "." || request[2] === "/"));
const isFilePath = (request) => isRelativePath(request) || path.isAbsolute(request);
const requestAcceptsQuery = (request) => {
  if (isFilePath(request)) {
    return true;
  }
  const scheme = getScheme(request);
  return (
    // Expected to be file, https, etc...
    scheme && scheme !== "node"
  );
};
const fileUrlPrefix = "file://";
const tsExtensionsPattern = /\.([cm]?ts|[tj]sx)($|\?)/;
const cjsExtensionPattern = /[/\\].+\.(?:cts|cjs)(?:$|\?)/;
const isJsonPattern = /\.json($|\?)/;
const isDirectoryPattern = /\/(?:$|\?)/;
const isBarePackageNamePattern = /^(?:@[^/]+\/)?[^/\\]+$/;
const nodeModulesPath = `${path.sep}node_modules${path.sep}`;

exports.fileMatcher = void 0;
exports.tsconfigPathsMatcher = void 0;
exports.allowJs = false;
const loadTsconfig = (configPath) => {
  let tsconfig = null;
  if (configPath) {
    const resolvedConfigPath = path.resolve(configPath);
    tsconfig = {
      path: resolvedConfigPath,
      config: getTsconfig.parseTsconfig(resolvedConfigPath)
    };
  } else {
    try {
      tsconfig = getTsconfig.getTsconfig();
    } catch {
    }
    if (!tsconfig) {
      return;
    }
  }
  exports.fileMatcher = getTsconfig.createFilesMatcher(tsconfig);
  exports.tsconfigPathsMatcher = getTsconfig.createPathsMatcher(tsconfig);
  exports.allowJs = tsconfig?.config.compilerOptions?.allowJs ?? false;
};

const urlSearchParamsStringify = (searchParams) => {
  const size = Array.from(searchParams).length;
  return size > 0 ? `?${searchParams.toString()}` : "";
};

const inlineSourceMapPrefix = "\n//# sourceMappingURL=data:application/json;base64,";
const shouldApplySourceMap = () => process.sourceMapsEnabled ?? true;
const inlineSourceMap = ({ code, map }) => code + inlineSourceMapPrefix + Buffer.from(JSON.stringify(map), "utf8").toString("base64");

const typescriptExtensions = [
  ".cts",
  ".mts",
  ".ts",
  ".tsx",
  ".jsx"
];
const transformExtensions = [
  ".js",
  ".cjs",
  ".mjs"
];
const implicitlyResolvableExtensions = [
  ".ts",
  ".tsx",
  ".jsx"
];
const safeSet = (object, property, value, descriptor) => {
  const existingDescriptor = Object.getOwnPropertyDescriptor(object, property);
  if (existingDescriptor?.set) {
    object[property] = value;
  } else if (!existingDescriptor || existingDescriptor.configurable) {
    Object.defineProperty(object, property, {
      value,
      enumerable: existingDescriptor?.enumerable || descriptor?.enumerable,
      writable: descriptor?.writable ?? (existingDescriptor ? existingDescriptor.writable : true),
      configurable: descriptor?.configurable ?? (existingDescriptor ? existingDescriptor.configurable : true)
    });
  }
};
const createExtensions = (state, extensions, namespace) => {
  const defaultLoader = extensions[".js"];
  const transformer = (module, filePath) => {
    if (state.enabled === false) {
      return defaultLoader(module, filePath);
    }
    const [cleanFilePath, query] = filePath.split("?");
    const searchParams = new URLSearchParams(query);
    if ((searchParams.get("namespace") ?? void 0) !== namespace) {
      return defaultLoader(module, filePath);
    }
    if (module.id.startsWith("data:text/javascript,")) {
      module.path = path.dirname(cleanFilePath);
    }
    if (client.parent?.send) {
      client.parent.send({
        type: "dependency",
        path: cleanFilePath
      });
    }
    const transformTs = typescriptExtensions.some((extension) => cleanFilePath.endsWith(extension));
    const transformJs = transformExtensions.some((extension) => cleanFilePath.endsWith(extension));
    if (!transformTs && !transformJs) {
      return defaultLoader(module, cleanFilePath);
    }
    let code = fs.readFileSync(cleanFilePath, "utf8");
    if (cleanFilePath.endsWith(".cjs")) {
      const transformed = index.transformDynamicImport(filePath, code);
      if (transformed) {
        code = shouldApplySourceMap() ? inlineSourceMap(transformed) : transformed.code;
      }
    } else if (transformTs || index.isESM(code)) {
      const transformed = index.transformSync(
        code,
        filePath,
        {
          tsconfigRaw: exports.fileMatcher?.(cleanFilePath)
        }
      );
      code = shouldApplySourceMap() ? inlineSourceMap(transformed) : transformed.code;
    }
    module._compile(code, cleanFilePath);
  };
  safeSet(extensions, ".js", transformer);
  for (const extension of implicitlyResolvableExtensions) {
    safeSet(extensions, extension, transformer, {
      /**
       * Registeration needs to be enumerable for some 3rd party libraries
       * https://github.com/gulpjs/rechoir/blob/v0.8.0/index.js#L21 (used by Webpack CLI)
       *
       * If the extension already exists, inherit its enumerable property
       * If not, only expose if it's not namespaced
       */
      enumerable: !namespace,
      writable: true,
      configurable: true
    });
  }
  safeSet(extensions, ".mjs", transformer, {
    /**
     * enumerable defaults to whatever is already set, but if not set, it's false
     *
     * This prevent Object.keys from detecting these extensions
     * when CJS loader iterates over the possible extensions
     * https://github.com/nodejs/node/blob/v22.2.0/lib/internal/modules/cjs/loader.js#L609
     */
    writable: true,
    configurable: true
  });
  return () => {
    if (extensions[".js"] === transformer) {
      extensions[".js"] = defaultLoader;
    }
    for (const extension of [...implicitlyResolvableExtensions, ".mjs"]) {
      if (extensions[extension] === transformer) {
        delete extensions[extension];
      }
    }
  };
};

const createImplicitResolver = (nextResolve) => (request) => {
  if (request === "." || request === ".." || request.endsWith("/..")) {
    request += "/";
  }
  if (isDirectoryPattern.test(request)) {
    let joinedPath = path.join(request, "index.js");
    if (request.startsWith("./")) {
      joinedPath = `./${joinedPath}`;
    }
    try {
      return nextResolve(joinedPath);
    } catch {
    }
  }
  try {
    return nextResolve(request);
  } catch (_error) {
    const nodeError = _error;
    if (nodeError.code === "MODULE_NOT_FOUND") {
      try {
        return nextResolve(`${request}${path.sep}index.js`);
      } catch {
      }
    }
    throw nodeError;
  }
};

const implicitJsExtensions = [".js", ".json"];
const implicitTsExtensions = [".ts", ".tsx", ".jsx"];
const localExtensions = [...implicitTsExtensions, ...implicitJsExtensions];
const dependencyExtensions = [...implicitJsExtensions, ...implicitTsExtensions];
const tsExtensions = /* @__PURE__ */ Object.create(null);
tsExtensions[".js"] = [".ts", ".tsx", ".js", ".jsx"];
tsExtensions[".jsx"] = [".tsx", ".ts", ".jsx", ".js"];
tsExtensions[".cjs"] = [".cts"];
tsExtensions[".mjs"] = [".mts"];
const mapTsExtensions = (filePath) => {
  const splitPath = filePath.split("?");
  const pathQuery = splitPath[1] ? `?${splitPath[1]}` : "";
  const [pathname] = splitPath;
  const extension = path.extname(pathname);
  const tryPaths = [];
  const tryExtensions = tsExtensions[extension];
  if (tryExtensions) {
    const extensionlessPath = pathname.slice(0, -extension.length);
    tryPaths.push(
      ...tryExtensions.map(
        (extension_) => extensionlessPath + extension_ + pathQuery
      )
    );
  }
  const guessExtensions = !(filePath.startsWith(fileUrlPrefix) || isFilePath(pathname)) || pathname.includes(nodeModulesPath) || pathname.includes("/node_modules/") ? dependencyExtensions : localExtensions;
  tryPaths.push(
    ...guessExtensions.map(
      (extension_) => pathname + extension_ + pathQuery
    )
  );
  return tryPaths;
};

const resolveTsFilename = (resolve, request, isTsParent) => {
  if (isDirectoryPattern.test(request) || !isTsParent && !exports.allowJs) {
    return;
  }
  const tsPath = mapTsExtensions(request);
  if (!tsPath) {
    return;
  }
  for (const tryTsPath of tsPath) {
    try {
      return resolve(tryTsPath);
    } catch (error) {
      const { code } = error;
      if (code !== "MODULE_NOT_FOUND" && code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") {
        throw error;
      }
    }
  }
};
const createTsExtensionResolver = (nextResolve, isTsParent) => (request) => {
  if (isFilePath(request)) {
    const resolvedTsFilename = resolveTsFilename(nextResolve, request, isTsParent);
    if (resolvedTsFilename) {
      return resolvedTsFilename;
    }
  }
  try {
    return nextResolve(request);
  } catch (error) {
    const nodeError = error;
    if (nodeError.code === "MODULE_NOT_FOUND") {
      if (typeof nodeError.path === "string" && nodeError.path.endsWith(`${path.sep}package.json`)) {
        const isExportsPath = nodeError.message.match(/^Cannot find module '([^']+)'$/);
        if (isExportsPath) {
          const exportsPath = isExportsPath[1];
          const tsFilename = resolveTsFilename(nextResolve, exportsPath, isTsParent);
          if (tsFilename) {
            return tsFilename;
          }
        }
        const isMainPath = nodeError.message.match(/^Cannot find module '([^']+)'. Please verify that the package.json has a valid "main" entry$/);
        if (isMainPath) {
          const mainPath = isMainPath[1];
          const tsFilename = resolveTsFilename(nextResolve, mainPath, isTsParent);
          if (tsFilename) {
            return tsFilename;
          }
        }
      }
      const resolvedTsFilename = resolveTsFilename(nextResolve, request, isTsParent);
      if (resolvedTsFilename) {
        return resolvedTsFilename;
      }
    }
    throw nodeError;
  }
};

const cjsPreparseCall = "at cjsPreparseModuleExports (node:internal";
const isFromCjsLexer = (error) => {
  const stack = error.stack.split("\n").slice(1);
  return stack[1].includes(cjsPreparseCall) || stack[2].includes(cjsPreparseCall);
};

const preserveQuery = (request, parent) => {
  const requestAndQuery = request.split("?");
  const searchParams = new URLSearchParams(requestAndQuery[1]);
  if (parent?.filename) {
    const filePath = getOriginalFilePath(parent.filename);
    let query;
    if (filePath) {
      const pathAndQuery = filePath.split("?");
      const newFilename = pathAndQuery[0];
      query = pathAndQuery[1];
      parent.filename = newFilename;
      parent.path = path.dirname(newFilename);
      parent.paths = Module._nodeModulePaths(parent.path);
      Module._cache[newFilename] = parent;
    }
    if (!query) {
      query = parent.filename.split("?")[1];
    }
    const parentQuery = new URLSearchParams(query);
    const parentNamespace = parentQuery.get("namespace");
    if (parentNamespace) {
      searchParams.append("namespace", parentNamespace);
    }
  }
  return [
    requestAndQuery[0],
    searchParams,
    (resolved, restOfArgsLength) => {
      if (path.isAbsolute(resolved) && !resolved.endsWith(".json") && !resolved.endsWith(".node") && !// Only the CJS lexer doesn't pass in the rest of the arguments
      // https://github.com/nodejs/node/blob/v20.15.0/lib/internal/modules/esm/translators.js#L415
      (restOfArgsLength === 0 && isFromCjsLexer(new Error()))) {
        resolved += urlSearchParamsStringify(searchParams);
      }
      return resolved;
    }
  ];
};

const resolveTsPaths = (request, parent, nextResolve) => {
  if (request.startsWith(fileUrlPrefix)) {
    request = node_url.fileURLToPath(request);
  }
  if (exports.tsconfigPathsMatcher && !isFilePath(request) && !parent?.filename?.includes(nodeModulesPath)) {
    const possiblePaths = exports.tsconfigPathsMatcher(request);
    for (const possiblePath of possiblePaths) {
      try {
        return nextResolve(possiblePath);
      } catch {
      }
    }
  }
  return nextResolve(request);
};
const createResolveFilename = (state, nextResolve, namespace) => (request, parent, ...restOfArgs) => {
  if (state.enabled === false) {
    return nextResolve(request, parent, ...restOfArgs);
  }
  request = interopCjsExports(request);
  const [
    cleanRequest,
    searchParams,
    appendQuery
  ] = preserveQuery(request, parent);
  if ((searchParams.get("namespace") ?? void 0) !== namespace) {
    return nextResolve(request, parent, ...restOfArgs);
  }
  let nextResolveSimple = (request_) => nextResolve(
    request_,
    parent,
    ...restOfArgs
  );
  nextResolveSimple = createTsExtensionResolver(
    nextResolveSimple,
    Boolean(
      // If register.namespace is used (e.g. tsx.require())
      namespace || parent?.filename && tsExtensionsPattern.test(parent.filename)
    )
  );
  nextResolveSimple = createImplicitResolver(nextResolveSimple);
  const resolved = resolveTsPaths(cleanRequest, parent, nextResolveSimple);
  return appendQuery(
    resolved,
    restOfArgs.length
  );
};

const resolveContext = (id, fromFile) => {
  if (!fromFile) {
    throw new Error("The current file path (__filename or import.meta.url) must be provided in the second argument of tsx.require()");
  }
  if (!id.startsWith(".")) {
    return id;
  }
  if (typeof fromFile === "string" && fromFile.startsWith(fileUrlPrefix) || fromFile instanceof URL) {
    fromFile = node_url.fileURLToPath(fromFile);
  }
  return path.resolve(path.dirname(fromFile), id);
};
const register = (options) => {
  const { sourceMapsEnabled } = process;
  const state = {
    enabled: true
  };
  loadTsconfig(process.env.TSX_TSCONFIG_PATH);
  process.setSourceMapsEnabled(true);
  const originalResolveFilename = Module._resolveFilename;
  const resolveFilename = createResolveFilename(state, originalResolveFilename, options?.namespace);
  Module._resolveFilename = resolveFilename;
  const unregisterExtensions = createExtensions(state, Module._extensions, options?.namespace);
  const unregister = () => {
    if (sourceMapsEnabled === false) {
      process.setSourceMapsEnabled(false);
    }
    state.enabled = false;
    if (Module._resolveFilename === resolveFilename) {
      Module._resolveFilename = originalResolveFilename;
    }
    unregisterExtensions();
  };
  if (options?.namespace) {
    const scopedRequire = (id, fromFile) => {
      const resolvedId = resolveContext(id, fromFile);
      const [request, query] = resolvedId.split("?");
      const parameters = new URLSearchParams(query);
      if (options.namespace && !request.startsWith("node:")) {
        parameters.set("namespace", options.namespace);
      }
      return getPipePath.require(request + urlSearchParamsStringify(parameters));
    };
    unregister.require = scopedRequire;
    const scopedResolve = (id, fromFile, resolveOptions) => {
      const resolvedId = resolveContext(id, fromFile);
      const [request, query] = resolvedId.split("?");
      const parameters = new URLSearchParams(query);
      if (options.namespace && !request.startsWith("node:")) {
        parameters.set("namespace", options.namespace);
      }
      return resolveFilename(
        request + urlSearchParamsStringify(parameters),
        module,
        false,
        resolveOptions
      );
    };
    unregister.resolve = scopedResolve;
    unregister.unregister = unregister;
  }
  return unregister;
};

exports.cjsExtensionPattern = cjsExtensionPattern;
exports.fileUrlPrefix = fileUrlPrefix;
exports.inlineSourceMap = inlineSourceMap;
exports.interopCjsExports = interopCjsExports;
exports.isBarePackageNamePattern = isBarePackageNamePattern;
exports.isDirectoryPattern = isDirectoryPattern;
exports.isJsonPattern = isJsonPattern;
exports.isRelativePath = isRelativePath;
exports.loadTsconfig = loadTsconfig;
exports.mapTsExtensions = mapTsExtensions;
exports.register = register;
exports.requestAcceptsQuery = requestAcceptsQuery;
exports.tsExtensionsPattern = tsExtensionsPattern;
