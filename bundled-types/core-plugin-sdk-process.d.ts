// Portable type declarations for `@workspace-core/plugin-sdk`. Unpublished BB
// workspace contracts are flattened; public subpaths may reuse the
// package root without requiring any other @core/* package.
//
// Confused by the API, or need a symbol that isn't here? Clone the BB repo
// and read the real source: https://github.com/get-bb/bb

import { ExecFileOptionsWithStringEncoding, ChildProcess, ExecFileException, ForkOptions, SpawnOptionsWithoutStdio, ChildProcessWithoutNullStreams, SpawnOptionsWithStdioTuple, StdioPipe, ChildProcessByStdio, StdioNull, SpawnOptions } from 'node:child_process';
import { Writable, Readable } from 'node:stream';

interface HostCommand {
    command: string;
    args: string[];
    env: NodeJS.ProcessEnv;
}
interface HostCommandOptions {
    cwd?: string | URL;
    env?: NodeJS.ProcessEnv;
}
declare class HostToolchain {
    private readonly baseEnv;
    private readonly runtimePath;
    private shellEnv;
    private readonly inheritedPath;
    private readonly misses;
    private nodePath;
    private refreshing;
    private refreshedAt;
    constructor(baseEnv?: NodeJS.ProcessEnv, runtimePath?: string);
    refresh(): Promise<void>;
    invalidateFailure(errorOrCode: unknown): void;
    private searchPath;
    environment(env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
    private lookup;
    resolve(command: string, options?: HostCommandOptions): string | null;
    node(options?: HostCommandOptions): string;
    bundledNpmCli(command?: "npm" | "npx"): string;
    npmCli(command?: "npm" | "npx", options?: HostCommandOptions): {
        node: string;
        cli: string;
    } | null;
    command(command: string, args?: readonly string[], options?: HostCommandOptions): HostCommand;
}
declare const hostToolchain: HostToolchain;

declare function spawnHostProcess(command: string, args?: readonly string[], options?: SpawnOptionsWithoutStdio): ChildProcessWithoutNullStreams;
declare function spawnHostProcess(command: string, args: readonly string[], options: SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioPipe>): ChildProcessByStdio<Writable, Readable, Readable>;
declare function spawnHostProcess(command: string, args: readonly string[], options: SpawnOptionsWithStdioTuple<StdioNull, StdioPipe, StdioPipe>): ChildProcessByStdio<null, Readable, Readable>;
declare function spawnHostProcess(command: string, args: readonly string[], options: SpawnOptionsWithStdioTuple<StdioNull, StdioPipe, StdioNull>): ChildProcessByStdio<null, Readable, null>;
declare function spawnHostProcess(command: string, args: readonly string[], options: SpawnOptionsWithStdioTuple<StdioPipe, StdioNull, StdioNull>): ChildProcessByStdio<Writable, null, null>;
declare function spawnHostProcess(command: string, args: readonly string[], options: SpawnOptions): ChildProcess;
declare function forkHostProcess(modulePath: string | URL, args?: readonly string[], options?: ForkOptions): ChildProcess;
declare function execHostFileCallback(command: string, args: readonly string[], options: ExecFileOptionsWithStringEncoding, callback: (error: ExecFileException | null, stdout: string, stderr: string) => void): ChildProcess;
declare function execHostFile(command: string, args?: readonly string[], options?: ExecFileOptionsWithStringEncoding): Promise<{
    stdout: string;
    stderr: string;
}> & {
    child: ChildProcess;
};

export { execHostFile as experimental_execHostFile, execHostFileCallback as experimental_execHostFileCallback, forkHostProcess as experimental_forkHostProcess, hostToolchain as experimental_hostToolchain, spawnHostProcess as experimental_spawnHostProcess };
