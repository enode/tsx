import { isMainThread } from 'node:worker_threads';
import { i as isFeatureSupported, a as importAttributes, e as esmLoadReadFile, m as moduleRegister } from '../node-features-Bye2pwSD.mjs';
import { r as register } from '../register-B_JUAKoE.mjs';
import '../get-pipe-path-D2pYDmQS.mjs';
import 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import 'get-tsconfig';
import { l as loadTsconfig, t as tsExtensionsPattern, b as isJsonPattern, f as fileUrlPrefix, d as fileMatcher, e as inlineSourceMap, g as requestAcceptsQuery, h as tsconfigPathsMatcher, j as isDirectoryPattern, m as mapTsExtensions, k as isRelativePath, n as allowJs } from '../register-BaEVGEKQ.mjs';
import fs from 'node:fs';
import 'esbuild';
import 'node:crypto';
import { i as isESM, a as transformSync, t as transform, b as transformDynamicImport, r as readJsonFile } from '../index-CI_rqePr.mjs';
import { p as parent } from '../client-Cg5Bp24g.mjs';
import '../require-BX8UoeTJ.mjs';
import { readFile } from 'node:fs/promises';
import 'module';
import '../temporary-directory-CM_Hq0H1.mjs';
import 'node:os';
import 'node:net';

const data = {
  active: true
};
const initialize = async (options) => {
  if (!options) {
    throw new Error("tsx must be loaded with --import instead of --loader\nThe --loader flag was deprecated in Node v20.6.0 and v18.19.0");
  }
  data.namespace = options.namespace;
  if (options.tsconfig !== false) {
    loadTsconfig(options.tsconfig ?? process.env.TSX_TSCONFIG_PATH);
  }
  if (options.port) {
    data.port = options.port;
    options.port.on("message", (message) => {
      if (message === "deactivate") {
        data.active = false;
        options.port.postMessage({ type: "deactivated" });
      }
    });
  }
};
const globalPreload = () => {
  loadTsconfig(process.env.TSX_TSCONFIG_PATH);
  return "process.setSourceMapsEnabled(true);";
};

const packageJsonCache = /* @__PURE__ */ new Map();
const readPackageJson = async (filePath) => {
  if (packageJsonCache.has(filePath)) {
    return packageJsonCache.get(filePath);
  }
  const exists = await fs.promises.access(filePath).then(
    () => true,
    () => false
  );
  if (!exists) {
    packageJsonCache.set(filePath, void 0);
    return;
  }
  const packageJsonString = await fs.promises.readFile(filePath, "utf8");
  try {
    const packageJson = JSON.parse(packageJsonString);
    packageJsonCache.set(filePath, packageJson);
    return packageJson;
  } catch {
    throw new Error(`Error parsing: ${filePath}`);
  }
};
const findPackageJson = async (filePath) => {
  let packageJsonUrl = new URL("package.json", filePath);
  while (true) {
    if (packageJsonUrl.pathname.endsWith("/node_modules/package.json")) {
      break;
    }
    const packageJsonPath = fileURLToPath(packageJsonUrl);
    const packageJson = await readPackageJson(packageJsonPath);
    if (packageJson) {
      return packageJson;
    }
    const lastPackageJSONUrl = packageJsonUrl;
    packageJsonUrl = new URL("../package.json", packageJsonUrl);
    if (packageJsonUrl.pathname === lastPackageJSONUrl.pathname) {
      break;
    }
  }
};
const getPackageType = async (filePath) => {
  const packageJson = await findPackageJson(filePath);
  return packageJson?.type ?? "commonjs";
};

const getFormatFromExtension = (fileUrl) => {
  [fileUrl] = fileUrl.split("?");
  const extension = path.extname(fileUrl);
  if (extension === ".mts") {
    return "module";
  }
  if (extension === ".cts") {
    return "commonjs";
  }
};
const getFormatFromFileUrl = (fileUrl) => {
  const format = getFormatFromExtension(fileUrl);
  if (format) {
    return format;
  }
  if (tsExtensionsPattern.test(fileUrl)) {
    return getPackageType(fileUrl);
  }
};
const namespaceQuery = "tsx-namespace=";
const getNamespace = (url) => {
  const index = url.indexOf(namespaceQuery);
  if (index === -1) {
    return;
  }
  const charBefore = url[index - 1];
  if (charBefore !== "?" && charBefore !== "&") {
    return;
  }
  const startIndex = index + namespaceQuery.length;
  const endIndex = url.indexOf("&", startIndex);
  return endIndex === -1 ? url.slice(startIndex) : url.slice(startIndex, endIndex);
};

const contextAttributesProperty = isFeatureSupported(importAttributes) ? "importAttributes" : "importAssertions";
const load = async (url, context, nextLoad) => {
  if (!data.active) {
    return nextLoad(url, context);
  }
  const urlNamespace = getNamespace(url);
  if (data.namespace && data.namespace !== urlNamespace) {
    return nextLoad(url, context);
  }
  if (data.port) {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.delete("tsx-namespace");
    data.port.postMessage({
      type: "load",
      url: parsedUrl.toString()
    });
  }
  if (parent.send) {
    parent.send({
      type: "dependency",
      path: url
    });
  }
  if (isJsonPattern.test(url)) {
    if (!context[contextAttributesProperty]) {
      context[contextAttributesProperty] = {};
    }
    context[contextAttributesProperty].type = "json";
  }
  const loaded = await nextLoad(url, context);
  const filePath = url.startsWith(fileUrlPrefix) ? fileURLToPath(url) : url;
  if (loaded.format === "commonjs" && isFeatureSupported(esmLoadReadFile) && loaded.responseURL?.startsWith("file:") && !filePath.endsWith(".cjs")) {
    const code2 = await readFile(new URL(url), "utf8");
    if (!filePath.endsWith(".js") || isESM(code2)) {
      const transformed = transformSync(
        code2,
        filePath,
        {
          tsconfigRaw: fileMatcher?.(filePath)
        }
      );
      const filePathWithNamespace = urlNamespace ? `${filePath}?namespace=${encodeURIComponent(urlNamespace)}` : filePath;
      loaded.responseURL = `data:text/javascript,${encodeURIComponent(transformed.code)}?filePath=${encodeURIComponent(filePathWithNamespace)}`;
      return loaded;
    }
  }
  if (!loaded.source) {
    return loaded;
  }
  const code = loaded.source.toString();
  if (
    // Support named imports in JSON modules
    loaded.format === "json" || tsExtensionsPattern.test(url)
  ) {
    const transformed = await transform(
      code,
      filePath,
      {
        tsconfigRaw: path.isAbsolute(filePath) ? fileMatcher?.(filePath) : void 0
      }
    );
    return {
      format: "module",
      source: inlineSourceMap(transformed)
    };
  }
  if (loaded.format === "module") {
    const dynamicImportTransformed = transformDynamicImport(filePath, code);
    if (dynamicImportTransformed) {
      loaded.source = inlineSourceMap(dynamicImportTransformed);
    }
  }
  return loaded;
};

const getMissingPathFromNotFound = (nodeError) => {
  if (nodeError.url) {
    return nodeError.url;
  }
  const isExportPath = nodeError.message.match(/^Cannot find module '([^']+)'/);
  if (isExportPath) {
    const [, exportPath] = isExportPath;
    return exportPath;
  }
  const isPackagePath = nodeError.message.match(/^Cannot find package '([^']+)'/);
  if (isPackagePath) {
    const [, packagePath] = isPackagePath;
    if (!path.isAbsolute(packagePath)) {
      return;
    }
    const packageUrl = pathToFileURL(packagePath);
    if (packageUrl.pathname.endsWith("/")) {
      packageUrl.pathname += "package.json";
    }
    if (packageUrl.pathname.endsWith("/package.json")) {
      const packageJson = readJsonFile(packageUrl);
      if (packageJson?.main) {
        return new URL(packageJson.main, packageUrl).toString();
      }
    } else {
      return packageUrl.toString();
    }
  }
};
const resolveExtensions = async (url, context, nextResolve, throwError) => {
  const tryPaths = mapTsExtensions(url);
  if (!tryPaths) {
    return;
  }
  let caughtError;
  for (const tsPath of tryPaths) {
    try {
      return await nextResolve(tsPath, context);
    } catch (error) {
      const { code } = error;
      if (code !== "ERR_MODULE_NOT_FOUND" && code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") {
        throw error;
      }
      caughtError = error;
    }
  }
  if (throwError) {
    throw caughtError;
  }
};
const resolveBase = async (specifier, context, nextResolve) => {
  if ((specifier.startsWith(fileUrlPrefix) || isRelativePath(specifier)) && (tsExtensionsPattern.test(context.parentURL) || allowJs)) {
    const resolved = await resolveExtensions(specifier, context, nextResolve);
    if (resolved) {
      return resolved;
    }
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error instanceof Error) {
      const nodeError = error;
      if (nodeError.code === "ERR_MODULE_NOT_FOUND") {
        const errorPath = getMissingPathFromNotFound(nodeError);
        if (errorPath) {
          const resolved = await resolveExtensions(errorPath, context, nextResolve);
          if (resolved) {
            return resolved;
          }
        }
      }
    }
    throw error;
  }
};
const resolveDirectory = async (specifier, context, nextResolve) => {
  if (specifier === "." || specifier === ".." || specifier.endsWith("/..")) {
    specifier += "/";
  }
  if (isDirectoryPattern.test(specifier)) {
    const urlParsed = new URL(specifier, context.parentURL);
    urlParsed.pathname = path.join(urlParsed.pathname, "index");
    return await resolveExtensions(
      urlParsed.toString(),
      context,
      nextResolve,
      true
    );
  }
  try {
    return await resolveBase(specifier, context, nextResolve);
  } catch (error) {
    if (error instanceof Error) {
      const nodeError = error;
      if (nodeError.code === "ERR_UNSUPPORTED_DIR_IMPORT") {
        const errorPath = getMissingPathFromNotFound(nodeError);
        if (errorPath) {
          try {
            return await resolveExtensions(
              `${errorPath}/index`,
              context,
              nextResolve,
              true
            );
          } catch (_error) {
            const __error = _error;
            const { message } = __error;
            __error.message = __error.message.replace(`${"/index".replace("/", path.sep)}'`, "'");
            __error.stack = __error.stack.replace(message, __error.message);
            throw __error;
          }
        }
      }
    }
    throw error;
  }
};
const resolveTsPaths = async (specifier, context, nextResolve) => {
  if (
    // Bare specifier
    !requestAcceptsQuery(specifier) && tsconfigPathsMatcher && !context.parentURL?.includes("/node_modules/")
  ) {
    const possiblePaths = tsconfigPathsMatcher(specifier);
    for (const possiblePath of possiblePaths) {
      try {
        return await resolveDirectory(
          pathToFileURL(possiblePath).toString(),
          context,
          nextResolve
        );
      } catch {
      }
    }
  }
  return resolveDirectory(specifier, context, nextResolve);
};
const tsxProtocol = "tsx://";
const resolve = async (specifier, context, nextResolve) => {
  if (!data.active || specifier.startsWith("node:")) {
    return nextResolve(specifier, context);
  }
  let requestNamespace = getNamespace(specifier) ?? // Inherit namespace from parent
  (context.parentURL && getNamespace(context.parentURL));
  if (data.namespace) {
    let tsImportRequest;
    if (specifier.startsWith(tsxProtocol)) {
      try {
        tsImportRequest = JSON.parse(specifier.slice(tsxProtocol.length));
      } catch {
      }
      if (tsImportRequest?.namespace) {
        requestNamespace = tsImportRequest.namespace;
      }
    }
    if (data.namespace !== requestNamespace) {
      return nextResolve(specifier, context);
    }
    if (tsImportRequest) {
      specifier = tsImportRequest.specifier;
      context.parentURL = tsImportRequest.parentURL;
    }
  }
  const [cleanSpecifier, query] = specifier.split("?");
  const resolved = await resolveTsPaths(
    cleanSpecifier,
    context,
    nextResolve
  );
  if (resolved.format === "builtin") {
    return resolved;
  }
  if (!resolved.format && resolved.url.startsWith(fileUrlPrefix)) {
    resolved.format = await getFormatFromFileUrl(resolved.url);
  }
  if (query) {
    resolved.url += `?${query}`;
  }
  if (requestNamespace && !resolved.url.includes(namespaceQuery)) {
    resolved.url += (resolved.url.includes("?") ? "&" : "?") + namespaceQuery + requestNamespace;
  }
  return resolved;
};

if (isFeatureSupported(moduleRegister) && isMainThread) {
  register();
}

export { globalPreload, initialize, load, resolve };
