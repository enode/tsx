import Module from 'node:module';
import { MessageChannel } from 'node:worker_threads';
import { f as fileUrlPrefix, a as interopCjsExports } from './register-BaEVGEKQ.mjs';
import { pathToFileURL } from 'node:url';

const createScopedImport = (namespace) => (specifier, parent) => {
  if (!parent) {
    throw new Error("The current file path (import.meta.url) must be provided in the second argument of tsImport()");
  }
  const parentURL = parent.startsWith(fileUrlPrefix) ? parent : pathToFileURL(parent).toString();
  return import(`tsx://${JSON.stringify({
    specifier,
    parentURL,
    namespace
  })}`);
};

let cjsInteropApplied = false;
const register = (options) => {
  if (!Module.register) {
    throw new Error(`This version of Node.js (${process.version}) does not support module.register(). Please upgrade to Node v18.19 or v20.6 and above.`);
  }
  if (!cjsInteropApplied) {
    const { _resolveFilename } = Module;
    Module._resolveFilename = (request, ...restOfArgs) => _resolveFilename(
      interopCjsExports(request),
      ...restOfArgs
    );
    cjsInteropApplied = true;
  }
  const { sourceMapsEnabled } = process;
  process.setSourceMapsEnabled(true);
  const { port1, port2 } = new MessageChannel();
  Module.register(
    // Load new copy of loader so it can be registered multiple times
    `./esm/index.mjs?${Date.now()}`,
    {
      parentURL: import.meta.url,
      data: {
        port: port2,
        namespace: options?.namespace,
        tsconfig: options?.tsconfig
      },
      transferList: [port2]
    }
  );
  const onImport = options?.onImport;
  const importHandler = onImport && ((message) => {
    if (message.type === "load") {
      onImport(message.url);
    }
  });
  if (importHandler) {
    port1.on("message", importHandler);
    port1.unref();
  }
  const unregister = () => {
    if (sourceMapsEnabled === false) {
      process.setSourceMapsEnabled(false);
    }
    if (importHandler) {
      port1.off("message", importHandler);
    }
    port1.postMessage("deactivate");
    return new Promise((resolve) => {
      const onDeactivated = (message) => {
        if (message.type === "deactivated") {
          resolve();
          port1.off("message", onDeactivated);
        }
      };
      port1.on("message", onDeactivated);
    });
  };
  if (options?.namespace) {
    unregister.import = createScopedImport(options.namespace);
    unregister.unregister = unregister;
  }
  return unregister;
};

export { register as r };
