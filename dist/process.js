// ../process-utils/src/host-process.ts
import parse from "cross-spawn/lib/parse.js";
import {
  spawn as nodeSpawn,
  fork as nodeFork,
  execFile as nodeExecFile
} from "node:child_process";
import crossSpawn from "cross-spawn";

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
    (entry) => entry.toUpperCase() === key.toUpperCase()
  ) ?? key];
}
function mergePath(...paths) {
  const seen = /* @__PURE__ */ new Set();
  return paths.flatMap((value) => (value ?? "").split(delimiter)).filter((entry) => {
    if (!entry) return false;
    const key = process.platform === "win32" ? entry.replace(/[\\/]+$/u, "").toLowerCase() : entry;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join(delimiter);
}
function onDiskName(file) {
  if (process.platform !== "win32") return file;
  try {
    const name = basename(file).toLowerCase();
    const entry = readdirSync(dirname(file)).find(
      (candidate) => candidate.toLowerCase() === name
    );
    return entry === void 0 ? file : join(dirname(file), entry);
  } catch {
    return file;
  }
}
function runProbe(command, args, env) {
  return new Promise((resolve) => {
    let stdout = "";
    let settled = false;
    let timer;
    const finish = (status) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ status, stdout });
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

// ../process-utils/src/host-process.ts
function observe(child) {
  child.once("error", (error) => hostToolchain.invalidateFailure(error));
  child.once("exit", (code) => hostToolchain.invalidateFailure(code));
  return child;
}
function spawnHostProcess(command, args = [], options = {}) {
  const launch = options.shell ? { command, args: [...args], env: hostToolchain.environment(options.env) } : hostToolchain.command(command, args, options);
  const spawn2 = options.shell ? nodeSpawn : crossSpawn;
  return observe(
    spawn2(launch.command, launch.args, {
      ...options,
      env: launch.env,
      windowsHide: options.windowsHide ?? true
    })
  );
}
function forkHostProcess(modulePath, args = [], options = {}) {
  const env = hostToolchain.environment(options.env);
  const execPath = options.execPath === void 0 || options.execPath === process.execPath ? hostToolchain.node({ env, cwd: options.cwd }) : options.execPath;
  return observe(nodeFork(modulePath, args, { ...options, env, execPath }));
}
function prepareExecFile(command, args, options) {
  const launch = hostToolchain.command(command, args, options);
  const parsed = process.platform === "win32" && hostToolchain.resolve(launch.command, {
    env: launch.env,
    cwd: options.cwd
  }) === null ? { command: launch.command, args: launch.args, options } : parse(launch.command, launch.args, { ...options, env: launch.env });
  return {
    command: parsed.command,
    args: parsed.args,
    options: {
      ...options,
      ...parsed.options,
      env: launch.env,
      windowsHide: options.windowsHide ?? true
    }
  };
}
function execHostFileCallback(command, args, options, callback) {
  const launch = prepareExecFile(command, args, options);
  return observe(
    nodeExecFile(
      launch.command,
      launch.args,
      { ...launch.options, encoding: options.encoding ?? "utf8" },
      callback
    )
  );
}
function settleExecFile(start) {
  let resolve;
  let reject;
  const promise = new Promise(
    (resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    }
  );
  const child = start((error, stdout, stderr) => {
    if (error) reject(Object.assign(error, { stdout, stderr }));
    else resolve({ stdout, stderr });
  });
  return Object.assign(promise, { child });
}
function execHostFile(command, args = [], options = {}) {
  return settleExecFile(
    (callback) => execHostFileCallback(command, args, options, callback)
  );
}

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
export {
  execHostFile as experimental_execHostFile,
  execHostFileCallback as experimental_execHostFileCallback,
  forkHostProcess as experimental_forkHostProcess,
  hostToolchain as experimental_hostToolchain,
  spawnHostProcess as experimental_spawnHostProcess
};
