import { createRequire as __createRequire } from "node:module";
import { dirname as __pathDirname } from "node:path";
import { fileURLToPath as __fileURLToPath } from "node:url";
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __pathDirname(__filename);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/windows.js
var require_windows = __commonJS({
  "../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/windows.js"(exports, module) {
    module.exports = isexe;
    isexe.sync = sync;
    var fs2 = __require("fs");
    function checkPathExt(path2, options) {
      var pathext = options.pathExt !== void 0 ? options.pathExt : process.env.PATHEXT;
      if (!pathext) {
        return true;
      }
      pathext = pathext.split(";");
      if (pathext.indexOf("") !== -1) {
        return true;
      }
      for (var i = 0; i < pathext.length; i++) {
        var p = pathext[i].toLowerCase();
        if (p && path2.substr(-p.length).toLowerCase() === p) {
          return true;
        }
      }
      return false;
    }
    function checkStat(stat, path2, options) {
      if (!stat.isSymbolicLink() && !stat.isFile()) {
        return false;
      }
      return checkPathExt(path2, options);
    }
    function isexe(path2, options, cb) {
      fs2.stat(path2, function(er, stat) {
        cb(er, er ? false : checkStat(stat, path2, options));
      });
    }
    function sync(path2, options) {
      return checkStat(fs2.statSync(path2), path2, options);
    }
  }
});

// ../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/mode.js
var require_mode = __commonJS({
  "../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/mode.js"(exports, module) {
    module.exports = isexe;
    isexe.sync = sync;
    var fs2 = __require("fs");
    function isexe(path2, options, cb) {
      fs2.stat(path2, function(er, stat) {
        cb(er, er ? false : checkStat(stat, options));
      });
    }
    function sync(path2, options) {
      return checkStat(fs2.statSync(path2), options);
    }
    function checkStat(stat, options) {
      return stat.isFile() && checkMode(stat, options);
    }
    function checkMode(stat, options) {
      var mod = stat.mode;
      var uid = stat.uid;
      var gid = stat.gid;
      var myUid = options.uid !== void 0 ? options.uid : process.getuid && process.getuid();
      var myGid = options.gid !== void 0 ? options.gid : process.getgid && process.getgid();
      var u = parseInt("100", 8);
      var g = parseInt("010", 8);
      var o = parseInt("001", 8);
      var ug = u | g;
      var ret = mod & o || mod & g && gid === myGid || mod & u && uid === myUid || mod & ug && myUid === 0;
      return ret;
    }
  }
});

// ../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/index.js
var require_isexe = __commonJS({
  "../../node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/index.js"(exports, module) {
    var fs2 = __require("fs");
    var core;
    if (process.platform === "win32" || global.TESTING_WINDOWS) {
      core = require_windows();
    } else {
      core = require_mode();
    }
    module.exports = isexe;
    isexe.sync = sync;
    function isexe(path2, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = {};
      }
      if (!cb) {
        if (typeof Promise !== "function") {
          throw new TypeError("callback not provided");
        }
        return new Promise(function(resolve2, reject) {
          isexe(path2, options || {}, function(er, is) {
            if (er) {
              reject(er);
            } else {
              resolve2(is);
            }
          });
        });
      }
      core(path2, options || {}, function(er, is) {
        if (er) {
          if (er.code === "EACCES" || options && options.ignoreErrors) {
            er = null;
            is = false;
          }
        }
        cb(er, is);
      });
    }
    function sync(path2, options) {
      try {
        return core.sync(path2, options || {});
      } catch (er) {
        if (options && options.ignoreErrors || er.code === "EACCES") {
          return false;
        } else {
          throw er;
        }
      }
    }
  }
});

// ../../node_modules/.pnpm/which@2.0.2/node_modules/which/which.js
var require_which = __commonJS({
  "../../node_modules/.pnpm/which@2.0.2/node_modules/which/which.js"(exports, module) {
    var isWindows2 = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
    var path2 = __require("path");
    var COLON = isWindows2 ? ";" : ":";
    var isexe = require_isexe();
    var getNotFoundError = (cmd) => Object.assign(new Error(`not found: ${cmd}`), { code: "ENOENT" });
    var getPathInfo = (cmd, opt) => {
      const colon = opt.colon || COLON;
      const pathEnv = cmd.match(/\//) || isWindows2 && cmd.match(/\\/) ? [""] : [
        // windows always checks the cwd first
        ...isWindows2 ? [process.cwd()] : [],
        ...(opt.path || process.env.PATH || /* istanbul ignore next: very unusual */
        "").split(colon)
      ];
      const pathExtExe = isWindows2 ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
      const pathExt = isWindows2 ? pathExtExe.split(colon) : [""];
      if (isWindows2) {
        if (cmd.indexOf(".") !== -1 && pathExt[0] !== "")
          pathExt.unshift("");
      }
      return {
        pathEnv,
        pathExt,
        pathExtExe
      };
    };
    var which = (cmd, opt, cb) => {
      if (typeof opt === "function") {
        cb = opt;
        opt = {};
      }
      if (!opt)
        opt = {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      const step = (i) => new Promise((resolve2, reject) => {
        if (i === pathEnv.length)
          return opt.all && found.length ? resolve2(found) : reject(getNotFoundError(cmd));
        const ppRaw = pathEnv[i];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path2.join(pathPart, cmd);
        const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
        resolve2(subStep(p, i, 0));
      });
      const subStep = (p, i, ii) => new Promise((resolve2, reject) => {
        if (ii === pathExt.length)
          return resolve2(step(i + 1));
        const ext = pathExt[ii];
        isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
          if (!er && is) {
            if (opt.all)
              found.push(p + ext);
            else
              return resolve2(p + ext);
          }
          return resolve2(subStep(p, i, ii + 1));
        });
      });
      return cb ? step(0).then((res) => cb(null, res), cb) : step(0);
    };
    var whichSync = (cmd, opt) => {
      opt = opt || {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      for (let i = 0; i < pathEnv.length; i++) {
        const ppRaw = pathEnv[i];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path2.join(pathPart, cmd);
        const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
        for (let j = 0; j < pathExt.length; j++) {
          const cur = p + pathExt[j];
          try {
            const is = isexe.sync(cur, { pathExt: pathExtExe });
            if (is) {
              if (opt.all)
                found.push(cur);
              else
                return cur;
            }
          } catch (ex) {
          }
        }
      }
      if (opt.all && found.length)
        return found;
      if (opt.nothrow)
        return null;
      throw getNotFoundError(cmd);
    };
    module.exports = which;
    which.sync = whichSync;
  }
});

// ../../node_modules/.pnpm/path-key@3.1.1/node_modules/path-key/index.js
var require_path_key = __commonJS({
  "../../node_modules/.pnpm/path-key@3.1.1/node_modules/path-key/index.js"(exports, module) {
    "use strict";
    var pathKey = (options = {}) => {
      const environment = options.env || process.env;
      const platform = options.platform || process.platform;
      if (platform !== "win32") {
        return "PATH";
      }
      return Object.keys(environment).reverse().find((key) => key.toUpperCase() === "PATH") || "Path";
    };
    module.exports = pathKey;
    module.exports.default = pathKey;
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/resolveCommand.js
var require_resolveCommand = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/resolveCommand.js"(exports, module) {
    "use strict";
    var path2 = __require("path");
    var which = require_which();
    var getPathKey = require_path_key();
    function resolveCommandAttempt(parsed, withoutPathExt) {
      const env = parsed.options.env || process.env;
      const cwd = process.cwd();
      const hasCustomCwd = parsed.options.cwd != null;
      const shouldSwitchCwd = hasCustomCwd && process.chdir !== void 0 && !process.chdir.disabled;
      if (shouldSwitchCwd) {
        try {
          process.chdir(parsed.options.cwd);
        } catch (err) {
        }
      }
      let resolved;
      try {
        resolved = which.sync(parsed.command, {
          path: env[getPathKey({ env })],
          pathExt: withoutPathExt ? path2.delimiter : void 0
        });
      } catch (e) {
      } finally {
        if (shouldSwitchCwd) {
          process.chdir(cwd);
        }
      }
      if (resolved) {
        resolved = path2.resolve(hasCustomCwd ? parsed.options.cwd : "", resolved);
      }
      return resolved;
    }
    function resolveCommand(parsed) {
      return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
    }
    module.exports = resolveCommand;
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/escape.js
var require_escape = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/escape.js"(exports, module) {
    "use strict";
    var metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
    function escapeCommand(arg) {
      arg = arg.replace(metaCharsRegExp, "^$1");
      return arg;
    }
    function escapeArgument(arg, doubleEscapeMetaChars) {
      arg = `${arg}`;
      arg = arg.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
      arg = arg.replace(/(?=(\\+?)?)\1$/, "$1$1");
      arg = `"${arg}"`;
      arg = arg.replace(metaCharsRegExp, "^$1");
      if (doubleEscapeMetaChars) {
        arg = arg.replace(metaCharsRegExp, "^$1");
      }
      return arg;
    }
    module.exports.command = escapeCommand;
    module.exports.argument = escapeArgument;
  }
});

// ../../node_modules/.pnpm/shebang-regex@3.0.0/node_modules/shebang-regex/index.js
var require_shebang_regex = __commonJS({
  "../../node_modules/.pnpm/shebang-regex@3.0.0/node_modules/shebang-regex/index.js"(exports, module) {
    "use strict";
    module.exports = /^#!(.*)/;
  }
});

// ../../node_modules/.pnpm/shebang-command@2.0.0/node_modules/shebang-command/index.js
var require_shebang_command = __commonJS({
  "../../node_modules/.pnpm/shebang-command@2.0.0/node_modules/shebang-command/index.js"(exports, module) {
    "use strict";
    var shebangRegex = require_shebang_regex();
    module.exports = (string = "") => {
      const match = string.match(shebangRegex);
      if (!match) {
        return null;
      }
      const [path2, argument] = match[0].replace(/#! ?/, "").split(" ");
      const binary = path2.split("/").pop();
      if (binary === "env") {
        return argument;
      }
      return argument ? `${binary} ${argument}` : binary;
    };
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/readShebang.js
var require_readShebang = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/readShebang.js"(exports, module) {
    "use strict";
    var fs2 = __require("fs");
    var shebangCommand = require_shebang_command();
    function readShebang(command) {
      const size = 150;
      const buffer = Buffer.alloc(size);
      let fd;
      try {
        fd = fs2.openSync(command, "r");
        fs2.readSync(fd, buffer, 0, size, 0);
        fs2.closeSync(fd);
      } catch (e) {
      }
      return shebangCommand(buffer.toString());
    }
    module.exports = readShebang;
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/parse.js
var require_parse = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/parse.js"(exports, module) {
    "use strict";
    var path2 = __require("path");
    var resolveCommand = require_resolveCommand();
    var escape = require_escape();
    var readShebang = require_readShebang();
    var isWin = process.platform === "win32";
    var isExecutableRegExp = /\.(?:com|exe)$/i;
    var isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
    function detectShebang(parsed) {
      parsed.file = resolveCommand(parsed);
      const shebang = parsed.file && readShebang(parsed.file);
      if (shebang) {
        parsed.args.unshift(parsed.file);
        parsed.command = shebang;
        return resolveCommand(parsed);
      }
      return parsed.file;
    }
    function parseNonShell(parsed) {
      if (!isWin) {
        return parsed;
      }
      const commandFile = detectShebang(parsed);
      const needsShell = !isExecutableRegExp.test(commandFile);
      if (parsed.options.forceShell || needsShell) {
        const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);
        parsed.command = path2.normalize(parsed.command);
        parsed.command = escape.command(parsed.command);
        parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));
        const shellCommand = [parsed.command].concat(parsed.args).join(" ");
        parsed.args = ["/d", "/s", "/c", `"${shellCommand}"`];
        parsed.command = process.env.comspec || "cmd.exe";
        parsed.options.windowsVerbatimArguments = true;
      }
      return parsed;
    }
    function parse2(command, args, options) {
      if (args && !Array.isArray(args)) {
        options = args;
        args = null;
      }
      args = args ? args.slice(0) : [];
      options = Object.assign({}, options);
      const parsed = {
        command,
        args,
        options,
        file: void 0,
        original: {
          command,
          args
        }
      };
      return options.shell ? parsed : parseNonShell(parsed);
    }
    module.exports = parse2;
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/enoent.js
var require_enoent = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/enoent.js"(exports, module) {
    "use strict";
    var isWin = process.platform === "win32";
    function notFoundError(original, syscall) {
      return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
        code: "ENOENT",
        errno: "ENOENT",
        syscall: `${syscall} ${original.command}`,
        path: original.command,
        spawnargs: original.args
      });
    }
    function hookChildProcess(cp, parsed) {
      if (!isWin) {
        return;
      }
      const originalEmit = cp.emit;
      cp.emit = function(name, arg1) {
        if (name === "exit") {
          const err = verifyENOENT(arg1, parsed);
          if (err) {
            return originalEmit.call(cp, "error", err);
          }
        }
        return originalEmit.apply(cp, arguments);
      };
    }
    function verifyENOENT(status, parsed) {
      if (isWin && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, "spawn");
      }
      return null;
    }
    function verifyENOENTSync(status, parsed) {
      if (isWin && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, "spawnSync");
      }
      return null;
    }
    module.exports = {
      hookChildProcess,
      verifyENOENT,
      verifyENOENTSync,
      notFoundError
    };
  }
});

// ../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/index.js
var require_cross_spawn = __commonJS({
  "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/index.js"(exports, module) {
    "use strict";
    var cp = __require("child_process");
    var parse2 = require_parse();
    var enoent = require_enoent();
    function spawn2(command, args, options) {
      const parsed = parse2(command, args, options);
      const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
      enoent.hookChildProcess(spawned, parsed);
      return spawned;
    }
    function spawnSync2(command, args, options) {
      const parsed = parse2(command, args, options);
      const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
      result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);
      return result;
    }
    module.exports = spawn2;
    module.exports.spawn = spawn2;
    module.exports.sync = spawnSync2;
    module.exports._parse = parse2;
    module.exports._enoent = enoent;
  }
});

// ../provider-bridge-protocol/src/bridge-worker-entry.ts
import { rmSync } from "node:fs";
import { isAbsolute as isAbsolute2 } from "node:path";
import { pathToFileURL } from "node:url";

// ../process-utils/src/host-process.ts
var import_parse = __toESM(require_parse(), 1);
var import_cross_spawn = __toESM(require_cross_spawn(), 1);

// ../process-utils/src/host-toolchain.ts
import { spawn, spawnSync } from "node:child_process";
import {
  accessSync,
  constants,
  existsSync,
  readdirSync,
  realpathSync,
  statSync
} from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import {
  basename,
  delimiter,
  dirname,
  extname,
  isAbsolute,
  join
} from "node:path";
import { fileURLToPath } from "node:url";

// ../../node_modules/.pnpm/which-command@0.1.0/node_modules/which-command/index.js
import fs from "node:fs";
import path from "node:path";
import process2 from "node:process";
var isWindows = process2.platform === "win32";
var separatorPattern = isWindows ? new RegExp("[\\/\\\\]", "v") : new RegExp("\\/", "v");
var defaultPathExt = ".COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC";
function resolveOptions(command, options) {
  if (typeof command !== "string" || command.length === 0) {
    throw new TypeError("Expected a non-empty string.");
  }
  const {
    cwd = process2.cwd(),
    // On Windows, `process.env.PATH` can be undefined in some contexts (for example, worker threads), where it's only exposed as `Path`.
    path: searchPath = process2.env.PATH ?? (isWindows ? process2.env.Path : void 0) ?? "",
    // `||` (not `??`) so an empty `PATHEXT` falls back to the default instead of disabling all lookup on Windows.
    pathExt = process2.env.PATHEXT || defaultPathExt
  } = options;
  return { cwd, searchPath, pathExt };
}
function windowsExtensions(command, pathExt) {
  const extensions = pathExt.split(path.delimiter).filter(Boolean);
  const commandExtension = path.extname(command).toLowerCase();
  if (commandExtension !== "" && extensions.some((extension) => extension.toLowerCase() === commandExtension)) {
    return ["", ...extensions];
  }
  return extensions;
}
function* candidatePaths(command, { cwd, searchPath, pathExt }) {
  const extensions = isWindows ? windowsExtensions(command, pathExt) : [""];
  if (separatorPattern.test(command)) {
    const base = path.resolve(cwd, command);
    for (const extension of extensions) {
      yield base + extension;
    }
    return;
  }
  const directories = [
    // Windows searches the current directory before `PATH`.
    ...isWindows ? [cwd] : [],
    ...searchPath.split(path.delimiter)
  ];
  for (const directory of directories) {
    const unquoted = isWindows && directory.length > 1 && directory.startsWith('"') && directory.endsWith('"') ? directory.slice(1, -1) : directory;
    if (unquoted === "") {
      continue;
    }
    const base = path.resolve(cwd, unquoted, command);
    for (const extension of extensions) {
      yield base + extension;
    }
  }
}
function isExecutableSync(filePath) {
  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch (error) {
    return isWindows && error.code === "EACCES";
  }
  if (!stats.isFile()) {
    return false;
  }
  if (isWindows) {
    return true;
  }
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
function whichCommandSync(command, options = {}) {
  const resolved = resolveOptions(command, options);
  for (const candidate of candidatePaths(command, resolved)) {
    if (isExecutableSync(candidate)) {
      return candidate;
    }
  }
  return void 0;
}

// ../process-utils/src/host-toolchain.ts
var NETWORK_KEYS = [
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "no_proxy",
  "NODE_EXTRA_CA_CERTS",
  "SSL_CERT_FILE",
  "SSL_CERT_DIR"
];
var SHELL_START = "__CORE_SHELL_ENV_START__";
var SHELL_END = "__CORE_SHELL_ENV_END__";
var PROBE_TIMEOUT_MS = 3e3;
var PROBE_OUTPUT_MAX_CHARS = 1024 * 1024;
function executable(file) {
  try {
    accessSync(
      file,
      process.platform === "win32" ? constants.F_OK : constants.X_OK
    );
    return statSync(file).isFile();
  } catch {
    return false;
  }
}
function envValue(env, key) {
  if (process.platform !== "win32") return env[key];
  return env[Object.keys(env).find(
    (entry2) => entry2.toUpperCase() === key.toUpperCase()
  ) ?? key];
}
function mergePath(...paths) {
  const seen = /* @__PURE__ */ new Set();
  return paths.flatMap((value) => (value ?? "").split(delimiter)).filter((entry2) => {
    if (!entry2) return false;
    const key = process.platform === "win32" ? entry2.replace(/[\\/]+$/u, "").toLowerCase() : entry2;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join(delimiter);
}
function onDiskName(file) {
  if (process.platform !== "win32") return file;
  try {
    const name = basename(file).toLowerCase();
    const entry2 = readdirSync(dirname(file)).find(
      (candidate) => candidate.toLowerCase() === name
    );
    return entry2 === void 0 ? file : join(dirname(file), entry2);
  } catch {
    return file;
  }
}
function runProbe(command, args, env) {
  return new Promise((resolve2) => {
    let stdout = "";
    let settled = false;
    let timer;
    const finish = (status) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve2({ status, stdout });
    };
    let child;
    try {
      child = spawn(command, args, {
        cwd: homedir(),
        env,
        stdio: ["ignore", "pipe", "ignore"],
        windowsHide: true
      });
    } catch {
      finish(null);
      return;
    }
    timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(null);
    }, PROBE_TIMEOUT_MS);
    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk) => {
      if (stdout.length < PROBE_OUTPUT_MAX_CHARS) stdout += chunk;
    });
    child.once("error", () => finish(null));
    child.once("close", (code) => finish(code));
  });
}
async function readShellEnvironment(env, retainPrevious) {
  if (process.platform === "win32") {
    const registry2 = join(
      envValue(env, "SystemRoot") ?? "C:\\Windows",
      "System32",
      "reg.exe"
    );
    const values = { ...env };
    const paths = [];
    for (const key of [
      "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment",
      "HKCU\\Environment"
    ]) {
      const result = await runProbe(registry2, ["query", key], env);
      if (result.status !== 0) continue;
      for (const match of result.stdout.matchAll(
        /^ {4}(.+?) {4}REG_[A-Z_]+ {4}(.*)$/gmu
      )) {
        const name = match[1]?.trim();
        if (!name) continue;
        const value = (match[2] ?? "").trim();
        if (name.toUpperCase() === "PATH") paths.push(value);
        else {
          const existing = Object.keys(values).find(
            (key2) => key2.toUpperCase() === name.toUpperCase()
          );
          values[existing ?? name] = value;
        }
      }
    }
    const expand = (value) => {
      for (let depth = 0; depth < 10; depth += 1) {
        const expanded = value.replace(
          /%([^%;\\/]+)%/gu,
          (reference, variable) => envValue(values, variable) ?? reference
        );
        if (expanded === value) break;
        value = expanded;
      }
      return value;
    };
    return paths.length === 0 ? null : { PATH: mergePath(...paths.map(expand), envValue(env, "PATH")) };
  }
  const shell = env.SHELL?.trim() || (process.platform === "darwin" ? "/bin/zsh" : "/bin/sh");
  const command = `printf '%s\\n' ${SHELL_START}; /usr/bin/env; printf '%s\\n' ${SHELL_END}`;
  const shellArgs = ["sh", "dash"].includes(basename(shell)) ? ["-lc"] : ["-ilc", "-lc"];
  for (const arg of shellArgs) {
    const result = await runProbe(shell, [arg, command], env);
    if (result.status !== 0) {
      if (retainPrevious) return null;
      continue;
    }
    const start = result.stdout.indexOf(`${SHELL_START}
`);
    const end = result.stdout.indexOf(`
${SHELL_END}`, start);
    if (start < 0 || end < 0) {
      if (retainPrevious) return null;
      continue;
    }
    const values = {};
    for (const line of result.stdout.slice(start + SHELL_START.length + 1, end).split("\n")) {
      const separator = line.indexOf("=");
      const key = line.slice(0, separator);
      if (key === "PATH" || NETWORK_KEYS.includes(key))
        values[key] = line.slice(separator + 1);
    }
    if (values.PATH) return values;
  }
  return null;
}
var HostToolchain = class {
  constructor(baseEnv = process.env, runtimePath = process.execPath) {
    this.baseEnv = baseEnv;
    this.runtimePath = runtimePath;
    this.inheritedPath = envValue(baseEnv, "PATH");
    this.nodePath = runtimePath;
  }
  baseEnv;
  runtimePath;
  shellEnv = {};
  inheritedPath;
  misses = /* @__PURE__ */ new Set();
  nodePath;
  refreshing = null;
  refreshedAt = 0;
  refresh() {
    if (this.refreshing !== null) return this.refreshing;
    this.misses.clear();
    this.refreshedAt = Date.now();
    const retainPrevious = this.shellEnv.PATH !== void 0;
    this.refreshing = readShellEnvironment(this.baseEnv, retainPrevious).then((env) => {
      if (env !== null) this.shellEnv = env;
    }).finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }
  invalidateFailure(errorOrCode) {
    const code = typeof errorOrCode === "object" && errorOrCode !== null && "code" in errorOrCode ? errorOrCode.code : errorOrCode;
    if (code === "ENOENT" || code === 127) void this.refresh();
  }
  searchPath(env) {
    const inherited = envValue(env, "PATH");
    const home = envValue(env, process.platform === "win32" ? "USERPROFILE" : "HOME") ?? homedir();
    const fallbacks = [
      join(home, ".local", "bin"),
      join(home, ".local", "share", "mise", "shims"),
      join(home, ".asdf", "shims"),
      join(home, ".asdf", "bin"),
      join(home, ".volta", "bin")
    ];
    if (process.platform === "darwin") fallbacks.push("/opt/homebrew/bin");
    if (process.platform !== "win32")
      fallbacks.push("/usr/local/bin", "/usr/bin", "/bin");
    const [first, second] = inherited === void 0 || inherited === this.inheritedPath ? [this.shellEnv.PATH, inherited] : [inherited, this.shellEnv.PATH];
    return mergePath(
      first,
      second,
      executable(this.nodePath) && /^node(?:\.exe)?$/iu.test(basename(this.nodePath)) ? dirname(this.nodePath) : void 0,
      ...fallbacks
    );
  }
  environment(env = this.baseEnv) {
    const path2 = this.searchPath(env);
    const result = { ...env };
    if (process.platform === "win32") {
      for (const key of Object.keys(result))
        if (key !== "PATH" && key.toUpperCase() === "PATH") delete result[key];
    }
    if (path2 !== "") result.PATH = path2;
    const callerKeys = new Set(
      Object.keys(env).filter((key) => env[key] !== void 0).map((key) => key.toUpperCase())
    );
    for (const key of NETWORK_KEYS)
      if (!callerKeys.has(key.toUpperCase()) && this.shellEnv[key] !== void 0)
        result[key] = this.shellEnv[key];
    return result;
  }
  lookup(command, options) {
    const env = this.environment(options.env);
    const cwd = options.cwd instanceof URL ? fileURLToPath(options.cwd) : options.cwd ?? process.cwd();
    if (command === "bb") {
      for (const candidate of [
        env.CORE_CLI_LAUNCHER,
        env.CORE_CLI,
        env.CORE_CLI_DIR ? join(env.CORE_CLI_DIR, "bb") : void 0
      ]) {
        if (candidate?.trim() && isAbsolute(candidate.trim()) && executable(candidate.trim()))
          return candidate.trim();
      }
    }
    const extension = extname(command);
    const pathExt = envValue(env, "PATHEXT");
    const path2 = envValue(env, "PATH") ?? "";
    const lookupOptions = {
      cwd,
      path: path2,
      pathExt: extension ? `${extension};${pathExt ?? ".EXE;.COM;.CMD;.BAT"}` : pathExt
    };
    const found = command === "bb" ? path2.split(delimiter).filter(isAbsolute).map(
      (directory) => whichCommandSync(join(directory, command), lookupOptions)
    ).find(Boolean) : whichCommandSync(command, lookupOptions);
    return found ? onDiskName(found) : null;
  }
  resolve(command, options = {}) {
    const found = this.lookup(command, options);
    if (found !== null) return found;
    const key = `${command}\0${String(options.cwd ?? "")}\0${envValue(options.env ?? this.baseEnv, "PATH") ?? ""}`;
    const sinceRefresh = Date.now() - this.refreshedAt;
    if (!(this.misses.has(key) && sinceRefresh < 3e4) && (this.misses.size === 0 || sinceRefresh >= 1e3))
      void this.refresh();
    this.misses.add(key);
    return null;
  }
  node(options = {}) {
    if (executable(this.nodePath)) return this.nodePath;
    const stableHomebrew = this.runtimePath.replace(
      /\/Cellar\/([^/]+)\/[^/]+\//u,
      "/opt/$1/"
    );
    const candidates = [
      stableHomebrew,
      process.argv0,
      this.lookup(process.platform === "win32" ? "node.exe" : "node", options)
    ];
    for (const candidate of candidates) {
      if (!candidate || !isAbsolute(candidate) || !executable(candidate))
        continue;
      const probe = spawnSync(
        candidate,
        [
          "-p",
          "JSON.stringify({path:process.execPath,abi:process.versions.modules,electron:!!process.versions.electron})"
        ],
        {
          env: this.environment(options.env),
          cwd: options.cwd,
          encoding: "utf8",
          timeout: PROBE_TIMEOUT_MS,
          killSignal: "SIGKILL",
          windowsHide: true
        }
      );
      if (probe.status !== 0) continue;
      try {
        const runtime = JSON.parse(probe.stdout.trim());
        if (typeof runtime !== "object" || runtime === null || !("path" in runtime) || typeof runtime.path !== "string" || !("abi" in runtime) || runtime.abi !== process.versions.modules || !("electron" in runtime) || runtime.electron !== Boolean(process.versions.electron))
          continue;
        if (isAbsolute(runtime.path) && executable(runtime.path)) {
          this.nodePath = runtime.path;
          return runtime.path;
        }
      } catch {
      }
    }
    throw Object.assign(
      new Error(
        "The Node runtime was removed and no replacement was found. Reinstall Node or restart bb with an available runtime."
      ),
      { code: "ENOENT" }
    );
  }
  bundledNpmCli(command = "npm") {
    const require2 = createRequire(import.meta.url);
    return join(
      dirname(require2.resolve("npm/package.json")),
      "bin",
      `${command}-cli.js`
    );
  }
  npmCli(command = "npm", options = {}) {
    const bin = `${command}-cli.js`;
    const runtime = process.versions.electron ? null : this.node(options);
    const candidates = [];
    if (runtime !== null)
      for (const cli of [
        join(dirname(runtime), "..", "lib", "node_modules", "npm", "bin", bin),
        join(dirname(runtime), "node_modules", "npm", "bin", bin)
      ])
        candidates.push({ node: runtime, cli });
    const installed = this.resolve(command, options);
    if (installed) {
      try {
        const cli = realpathSync(installed);
        const npmRoot = dirname(dirname(cli));
        const node = [
          join(npmRoot, "..", "..", "..", "bin", "node"),
          join(npmRoot, "..", "..", "node.exe"),
          join(dirname(installed), "node")
        ].find(executable);
        if (basename(cli) === bin && node !== void 0)
          candidates.push({ node: realpathSync(node), cli });
      } catch {
      }
    }
    if (runtime !== null) {
      try {
        candidates.push({ node: runtime, cli: this.bundledNpmCli(command) });
      } catch {
      }
    }
    return candidates.find((candidate) => existsSync(candidate.cli)) ?? null;
  }
  command(command, args = [], options = {}) {
    const file = command === this.runtimePath ? this.node(options) : this.resolve(command, options) ?? command;
    const env = this.environment(options.env);
    if (/(?:^|[\\/])(?:npm|npx)-cli\.js$/u.test(args[0] ?? "")) {
      env.PATH = mergePath(dirname(file), env.PATH);
    }
    return { command: file, args: [...args], env };
  }
};
var toolchainKey = /* @__PURE__ */ Symbol.for("@core/process-utils/host-toolchain");
var shared = globalThis;
var hostToolchain = shared[toolchainKey] ??= new HostToolchain();

// ../process-utils/src/vcs-process-scheduler.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { availableParallelism } from "node:os";
var ranks = { interactive: 0, status: 1, background: 2 };
function localProcessCapacities(parallelism) {
  const total = Math.min(6, Math.max(4, parallelism - 2));
  return [total, total - 1, total - 2];
}
var capacities = {
  local: localProcessCapacities(availableParallelism()),
  network: [4, 3, 2]
};
var githubCapacity = 2;
var agingMs = 15e3;
var networkGitSubcommands = /* @__PURE__ */ new Set([
  "fetch",
  "pull",
  "push",
  "clone",
  "ls-remote"
]);
var gitGlobalOptionsWithValue = /* @__PURE__ */ new Set([
  "-C",
  "-c",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--config-env"
]);
function isNetworkGitCommand(args) {
  let index = 0;
  while (index < args.length && args[index].startsWith("-")) {
    index += gitGlobalOptionsWithValue.has(args[index]) ? 2 : 1;
  }
  const subcommand = args[index];
  if (subcommand === void 0) return false;
  if (networkGitSubcommands.has(subcommand)) return true;
  const action = args.slice(index + 1).find((arg) => !arg.startsWith("-"));
  return (subcommand === "submodule" || subcommand === "remote") && action === "update";
}
var VcsProcessScheduler = class {
  priority = new AsyncLocalStorage();
  admitted = new AsyncLocalStorage();
  active = { local: 0, network: 0 };
  githubActive = 0;
  queue = [];
  timer;
  acquire(command, args, options) {
    const pool = command === "gh" || isNetworkGitCommand(args) ? "network" : "local";
    const slots = options.slots ?? 1;
    if (!Number.isInteger(slots) || slots < 1 || slots > capacities[pool][ranks.background]) {
      return Promise.reject(new Error("Invalid VCS process slot count"));
    }
    if (options.signal?.aborted) {
      return Promise.reject(this.abortError(options.signal));
    }
    return new Promise((grant, reject) => {
      const waiter = {
        command,
        pool,
        priority: options.priority ?? this.priority.getStore() ?? "status",
        slots,
        queuedAt: performance.now(),
        signal: options.signal,
        grant,
        onAbort: () => {
          const index = this.queue.indexOf(waiter);
          if (index === -1) return;
          this.queue.splice(index, 1);
          reject(this.abortError(options.signal));
          this.drain();
        }
      };
      this.queue.push(waiter);
      options.signal?.addEventListener("abort", waiter.onAbort, { once: true });
      this.drain();
    });
  }
  abortError(signal) {
    return Object.assign(
      new Error("The operation was aborted", { cause: signal?.reason }),
      {
        name: "AbortError",
        code: "ABORT_ERR"
      }
    );
  }
  rank(waiter) {
    return Math.max(
      0,
      ranks[waiter.priority] - Math.floor((performance.now() - waiter.queuedAt) / agingMs)
    );
  }
  drain() {
    clearTimeout(this.timer);
    this.queue.sort(
      (a, b) => this.rank(a) - this.rank(b) || a.queuedAt - b.queuedAt
    );
    const blocked = /* @__PURE__ */ new Set();
    for (let index = 0; index < this.queue.length; ) {
      const waiter = this.queue[index];
      if (blocked.has(waiter.pool) || waiter.command === "gh" && this.githubActive + waiter.slots > githubCapacity) {
        index += 1;
        continue;
      }
      if (this.active[waiter.pool] + waiter.slots > capacities[waiter.pool][this.rank(waiter)]) {
        blocked.add(waiter.pool);
        index += 1;
        continue;
      }
      this.queue.splice(index, 1);
      waiter.signal?.removeEventListener("abort", waiter.onAbort);
      this.active[waiter.pool] += waiter.slots;
      if (waiter.command === "gh") this.githubActive += waiter.slots;
      let released = false;
      waiter.grant(() => {
        if (released) return;
        released = true;
        this.active[waiter.pool] -= waiter.slots;
        if (waiter.command === "gh") this.githubActive -= waiter.slots;
        this.drain();
      });
    }
    if (this.queue.length > 0) {
      const delay = Math.min(
        ...this.queue.map(
          (waiter) => agingMs - (performance.now() - waiter.queuedAt) % agingMs
        )
      );
      this.timer = setTimeout(() => this.drain(), delay);
    }
  }
};
var registry = globalThis;
var scheduler = registry.__bbVcsProcessScheduler ??= new VcsProcessScheduler();

// ../process-utils/src/plugin-process-paths.ts
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join as join2 } from "node:path";
function safePluginSegment(pluginId2) {
  return encodeURIComponent(pluginId2);
}
async function createPluginProcessTempDir(args) {
  return mkdtemp(
    join2(tmpdir(), `${args.prefix}-${safePluginSegment(args.pluginId)}-`)
  );
}

// ../provider-bridge-protocol/src/bridge-kit/bounded-line-reader.ts
import { StringDecoder } from "node:string_decoder";
var MAX_JSON_RPC_LINE_BYTES = 64 * 1024 * 1024;
function readBoundedLines(args) {
  const maxLineBytes = args.maxLineBytes ?? MAX_JSON_RPC_LINE_BYTES;
  const decoder = new StringDecoder("utf8");
  let pending = "";
  let discarding = false;
  let discardedBytes = 0;
  args.input.on("data", (chunk) => {
    const text = typeof chunk === "string" ? chunk : decoder.write(chunk);
    let start = 0;
    for (; ; ) {
      const newlineIndex = text.indexOf("\n", start);
      if (newlineIndex === -1) {
        break;
      }
      if (discarding) {
        discarding = false;
        args.onOverflow(discardedBytes);
        discardedBytes = 0;
      } else {
        emit(pending + text.slice(start, newlineIndex));
      }
      pending = "";
      start = newlineIndex + 1;
    }
    const tail = text.slice(start);
    if (discarding) {
      discardedBytes += Buffer.byteLength(tail);
      return;
    }
    pending += tail;
    if (Buffer.byteLength(pending) > maxLineBytes) {
      discarding = true;
      discardedBytes = Buffer.byteLength(pending);
      pending = "";
    }
  });
  args.input.on("end", () => {
    if (!discarding && pending.length > 0) {
      emit(pending);
    }
    pending = "";
    args.onClose?.();
  });
  function emit(line) {
    args.onLine(line.endsWith("\r") ? line.slice(0, -1) : line);
  }
}

// ../provider-bridge-protocol/src/bridge-kit/bridge-recorder.ts
import { closeSync, mkdirSync, openSync, writeSync } from "node:fs";
import { join as join3, resolve } from "node:path";
import { StringDecoder as StringDecoder2 } from "node:string_decoder";
var PROVIDER_BRIDGE_RECORD_DIR_ENV = "CORE_PROVIDER_BRIDGE_RECORD_DIR";
var BRIDGE_RECORDING_PROCESS_SCOPE = "_process";
function bridgeRecordingFileName(direction) {
  return `${direction}.ndjson`;
}
function createRecordingLineSplitter(onLine, maxLineBytes = MAX_JSON_RPC_LINE_BYTES) {
  const decoder = new StringDecoder2("utf8");
  let pending = "";
  let discarding = false;
  return {
    push(chunk) {
      const text = typeof chunk === "string" ? chunk : decoder.write(Buffer.from(chunk));
      let start = 0;
      for (; ; ) {
        const newlineIndex = text.indexOf("\n", start);
        if (newlineIndex === -1) {
          break;
        }
        if (!discarding) {
          const line = pending + text.slice(start, newlineIndex);
          onLine(line.endsWith("\r") ? line.slice(0, -1) : line);
        }
        discarding = false;
        pending = "";
        start = newlineIndex + 1;
      }
      if (discarding) {
        return;
      }
      pending += text.slice(start);
      if (Buffer.byteLength(pending) > maxLineBytes) {
        discarding = true;
        pending = "";
      }
    }
  };
}
function safeScopeSegment(threadId) {
  if (threadId === null || threadId === "") {
    return BRIDGE_RECORDING_PROCESS_SCOPE;
  }
  const sanitized = threadId.replace(/[^A-Za-z0-9_.-]+/g, "-");
  return sanitized === "" || sanitized.startsWith("_") ? `t-${sanitized}` : sanitized;
}
function parseRuntimeLine(line) {
  let parsed;
  try {
    parsed = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const record = parsed;
  const id = typeof record.id === "string" || typeof record.id === "number" ? record.id : void 0;
  const method = typeof record.method === "string" ? record.method : void 0;
  const params = record.params;
  const threadId = typeof params === "object" && params !== null && typeof params.threadId === "string" ? params.threadId : void 0;
  return { id, method, threadId };
}
function pendingKey(id) {
  return `${typeof id}:${String(id)}`;
}
function createBridgeRecorder(args) {
  const dir = resolve(args.dir);
  const fds = /* @__PURE__ */ new Map();
  const runtimeRequestThreads = /* @__PURE__ */ new Map();
  const bridgeRequestThreads = /* @__PURE__ */ new Map();
  const run = Date.now();
  let seq = 0;
  let closed = false;
  function fdFor(scope, direction) {
    const key = `${scope}\0${direction}`;
    const existing = fds.get(key);
    if (existing !== void 0) {
      return existing;
    }
    const scopeDir = join3(dir, scope);
    mkdirSync(scopeDir, { recursive: true });
    const fd = openSync(
      join3(scopeDir, bridgeRecordingFileName(direction)),
      "a"
    );
    fds.set(key, fd);
    return fd;
  }
  function record(recordArgs) {
    if (closed) {
      return;
    }
    seq += 1;
    const entry2 = {
      ts: Date.now(),
      run,
      seq,
      dir: recordArgs.direction,
      line: recordArgs.line
    };
    try {
      writeSync(
        fdFor(safeScopeSegment(recordArgs.threadId), recordArgs.direction),
        `${JSON.stringify(entry2)}
`
      );
    } catch (error) {
      process.stderr.write(
        `provider bridge recorder: failed to append to ${dir}: ${error instanceof Error ? error.message : String(error)}
`
      );
    }
  }
  function recordRuntimeLine(direction, line) {
    const parsed = parseRuntimeLine(line);
    let threadId = parsed?.threadId ?? null;
    if (parsed !== null && parsed.id !== void 0) {
      const key = pendingKey(parsed.id);
      if (parsed.method !== void 0) {
        (direction === "runtime\u2192bridge" ? runtimeRequestThreads : bridgeRequestThreads).set(key, threadId);
      } else {
        const pending = direction === "runtime\u2192bridge" ? bridgeRequestThreads : runtimeRequestThreads;
        const owner = pending.get(key);
        if (owner !== void 0) {
          pending.delete(key);
          threadId = owner;
        }
      }
    }
    record({ direction, line, threadId });
  }
  function recordChildIo(child, scope) {
    const { stdin, stdout } = child;
    if (stdout) {
      const splitter = createRecordingLineSplitter(
        (line) => record({
          direction: "provider\u2192bridge",
          line,
          threadId: scope.threadId
        })
      );
      stdout.on("data", (chunk) => splitter.push(chunk));
    }
    if (stdin) {
      const splitter = createRecordingLineSplitter(
        (line) => record({
          direction: "bridge\u2192provider",
          line,
          threadId: scope.threadId
        })
      );
      const originalWrite = stdin.write.bind(stdin);
      stdin.write = ((chunk, ...rest) => {
        splitter.push(chunk);
        return originalWrite(
          chunk,
          ...rest
        );
      });
    }
  }
  return {
    record,
    recordRuntimeLine,
    recordChildIo,
    close() {
      closed = true;
      for (const fd of fds.values()) {
        try {
          closeSync(fd);
        } catch {
        }
      }
      fds.clear();
    }
  };
}
var RECORDER_GLOBAL_KEY = /* @__PURE__ */ Symbol.for("bb.providerBridgeRecorder");
function globalSlot() {
  const holder = globalThis;
  const existing = holder[RECORDER_GLOBAL_KEY];
  if (existing !== void 0) {
    return existing;
  }
  const slot = { recorder: null, resolved: false };
  holder[RECORDER_GLOBAL_KEY] = slot;
  return slot;
}
function getBridgeRecorder() {
  const slot = globalSlot();
  if (!slot.resolved) {
    slot.resolved = true;
    const dir = process.env[PROVIDER_BRIDGE_RECORD_DIR_ENV];
    if (dir !== void 0 && dir.trim() !== "") {
      slot.recorder = createBridgeRecorder({ dir: dir.trim() });
    }
  }
  return slot.recorder;
}

// ../provider-bridge-protocol/src/bridge-kit/provider-bridge-entry.ts
var PROVIDER_BRIDGE_EXPORT_NAME = "experimental_providerBridge";
function parseProviderBridgeEntry(value) {
  if (typeof value !== "object" || value === null) {
    return {
      entry: null,
      problem: `exports no "${PROVIDER_BRIDGE_EXPORT_NAME}"`
    };
  }
  const candidate = value;
  if (candidate.experimental_apiVersion !== 1) {
    return {
      entry: null,
      problem: `exports "${PROVIDER_BRIDGE_EXPORT_NAME}" with unsupported apiVersion ${String(candidate.experimental_apiVersion)} (expected 1) \u2014 build it with experimental_defineProviderBridge()`
    };
  }
  if (typeof candidate.handleLine !== "function") {
    return {
      entry: null,
      problem: `exports "${PROVIDER_BRIDGE_EXPORT_NAME}" without a handleLine function`
    };
  }
  return { entry: candidate, problem: null };
}

// ../provider-bridge-protocol/src/bridge-worker-entry.ts
var [bridgeModulePath, pluginId, dataDir] = process.argv.slice(2);
function fail(message) {
  process.stderr.write(`${message}
`);
  process.exit(1);
}
if (bridgeModulePath === void 0 || !isAbsolute2(bridgeModulePath) || pluginId === void 0 || pluginId === "" || dataDir === void 0 || !isAbsolute2(dataDir)) {
  fail(
    "provider bridge bootstrap usage: <bridgeModulePath> <pluginId> <pluginDataDir> (absolute paths)"
  );
}
var tempDir = await createPluginProcessTempDir({
  pluginId,
  prefix: "bb-provider-bridge"
});
var removedTempDir = false;
function removeTempDir() {
  if (removedTempDir) return;
  removedTempDir = true;
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
  }
}
process.once("exit", removeTempDir);
var recorder = getBridgeRecorder();
if (recorder !== null) {
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const outbound = createRecordingLineSplitter(
    (line) => recorder.recordRuntimeLine("bridge\u2192runtime", line)
  );
  process.stdout.write = ((chunk, ...rest) => {
    outbound.push(chunk);
    return originalStdoutWrite(
      chunk,
      ...rest
    );
  });
  process.once("exit", () => recorder.close());
}
var entry;
try {
  const imported = await import(pathToFileURL(bridgeModulePath).href);
  const parsed = parseProviderBridgeEntry(
    typeof imported === "object" && imported !== null ? Reflect.get(imported, PROVIDER_BRIDGE_EXPORT_NAME) : void 0
  );
  if (parsed.entry === null) {
    fail(
      `plugin "${pluginId}" cannot run as a provider bridge: its host artifact ${parsed.problem} (${bridgeModulePath})`
    );
  }
  entry = parsed.entry;
} catch (error) {
  removeTempDir();
  fail(
    `plugin "${pluginId}" failed to load its provider bridge: ${error instanceof Error ? error.message : String(error)}`
  );
}
entry.start?.({ pluginId, dataDir, tempDir });
if (entry.onSigterm) {
  process.once("SIGTERM", entry.onSigterm);
}
if (entry.onSigint) {
  process.once("SIGINT", entry.onSigint);
}
readBoundedLines({
  input: process.stdin,
  onLine: recorder === null ? entry.handleLine : (line) => {
    recorder.recordRuntimeLine("runtime\u2192bridge", line);
    entry.handleLine(line);
  },
  onOverflow: (bytes) => {
    process.stderr.write(
      `Discarded an oversized JSON-RPC line from the runtime (${bytes} bytes).
`
    );
  },
  onClose: () => {
    removeTempDir();
    entry.onClose?.();
  }
});
