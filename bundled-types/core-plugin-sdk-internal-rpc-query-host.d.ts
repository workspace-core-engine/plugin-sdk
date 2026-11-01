// Portable type declarations for `@workspace-core/plugin-sdk`. Unpublished BB
// workspace contracts are flattened; public subpaths may reuse the
// package root without requiring any other @core/* package.
//
// Confused by the API, or need a symbol that isn't here? Clone the BB repo
// and read the real source: https://github.com/get-bb/bb

import { QueryClient } from '@tanstack/react-query';

interface JsonObject {
    [key: string]: JsonValue;
}
type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

interface ContractTagDeclarations<Input, Output> {
    tags?(input: Input, output: Output): readonly string[];
    keyTags?(key: string, value: Output extends Readonly<Record<string, infer Value>> ? Value : unknown): readonly string[];
    invalidates?(input: Input, output: Output): readonly string[];
}

/** A JSON-safe path segment reported by a Standard Schema validation issue. */
type PluginRpcIssuePathSegment = string | number;
/** Validator-neutral validation detail carried by an RPC error envelope. */
interface PluginRpcValidationIssue {
    message: string;
    path?: PluginRpcIssuePathSegment[];
}
declare const rpcErrorCodes: readonly ["forbidden", "not_found", "conflict", "invalid", "invalid_json", "invalid_input", "handler_error", "invalid_output", "non_json_result", "unknown_method", "transport_error", "invalid_response", "unknown_error"];
/** RPC categories may grow. Handle unknown_error as a fallback for newer server codes. */
type PluginRpcErrorCode = (typeof rpcErrorCodes)[number];
/** A client RPC failure. Unknown server codes become unknown_error and remain in serverCode. */
declare class experimental_PluginRpcCallError extends Error {
    /** Recognizes errors across the packed SDK's separately bundled entries. */
    static [Symbol.hasInstance](value: unknown): boolean;
    readonly code: PluginRpcErrorCode;
    readonly issues?: PluginRpcValidationIssue[];
    readonly status?: number;
    readonly serverCode?: string;
    constructor(args: PluginRpcError & {
        status?: number;
        serverCode?: string;
    });
    /** Normalize failures at the RPC boundary; preserves an existing client error. */
    static from(error: unknown, fallback?: PluginRpcErrorCode): experimental_PluginRpcCallError;
}
/** Structured RPC failure returned as `{ ok: false, error }`. */
interface PluginRpcError {
    code: PluginRpcErrorCode;
    message: string;
    issues?: PluginRpcValidationIssue[];
}
/**
 * The validator-neutral subset of Standard Schema v1 used by plugin contracts.
 * Zod 4 schemas implement this interface directly; other validators can do
 * the same without becoming part of BB's public protocol.
 */
interface StandardSchemaV1<Input = unknown, Output = Input> {
    readonly "~standard": {
        readonly version: 1;
        readonly vendor: string;
        readonly validate: (value: unknown) => StandardSchemaV1Result<Output> | Promise<StandardSchemaV1Result<Output>>;
        readonly jsonSchema?: {
            readonly input: (options: {
                target: string;
            }) => Record<string, unknown>;
            readonly output: (options: {
                target: string;
            }) => Record<string, unknown>;
        };
        readonly types?: {
            readonly input: Input;
            readonly output: Output;
        };
    };
}
type StandardSchemaV1Result<Output> = {
    readonly value: Output;
    readonly issues?: undefined;
} | {
    readonly issues: readonly StandardSchemaV1Issue[];
};
interface StandardSchemaV1Issue {
    readonly message: string;
    readonly path?: PropertyKey | readonly (PropertyKey | {
        readonly key: PropertyKey;
    })[];
}
type StandardSchemaV1InferInput<Schema extends StandardSchemaV1> = NonNullable<Schema["~standard"]["types"]>["input"];
type StandardSchemaV1InferOutput<Schema extends StandardSchemaV1> = NonNullable<Schema["~standard"]["types"]>["output"];
interface PluginRpcMethodContract<InputSchema extends StandardSchemaV1 = StandardSchemaV1, OutputSchema extends StandardSchemaV1 = StandardSchemaV1> extends ContractTagDeclarations<StandardSchemaV1InferOutput<InputSchema>, StandardSchemaV1InferOutput<OutputSchema>> {
    readonly experimental_description?: string;
    /**
     * Host contracts only. When true and the daemon's response has not arrived
     * within half of the call's transport timeout, bb cancels the call and sends
     * it once more, the retry core uses for its own read-only daemon commands.
     * Declare it only for reads that are safe to run twice.
     */
    readonly experimental_retryable?: boolean;
    /**
     * When true, a person with the read-only `viewer` role may call this method.
     * Every other method refuses viewers with `forbidden`. Declare it only on
     * methods that change nothing and reveal only what a viewer may already see.
     */
    readonly experimental_viewer?: boolean;
    readonly input: InputSchema;
    readonly output: OutputSchema;
}
type PluginRpcContract = Readonly<Record<string, PluginRpcMethodContract>>;
/** Methods callable with only keys and returning one value per string key. */
type ExperimentalRpcKeyedMethod<Contract extends PluginRpcContract> = {
    [Method in keyof Contract & string]: {
        keys: string[];
    } extends StandardSchemaV1InferInput<Contract[Method]["input"]> ? StandardSchemaV1InferOutput<Contract[Method]["input"]> extends {
        keys: string[];
    } ? string extends keyof PluginRpcResult<Contract[Method]> ? Method : never : never : never;
}[keyof Contract & string];
/** One keyed method's inferred row value. */
type ExperimentalRpcKeyedValue<Method extends PluginRpcMethodContract> = PluginRpcResult<Method> extends Record<string, infer Value> ? Value : never;
type PluginRpcCallInput<Method extends PluginRpcMethodContract> = StandardSchemaV1InferInput<Method["input"]>;
type PluginRpcCallArgs<Method extends PluginRpcMethodContract> = null extends PluginRpcCallInput<Method> ? [input?: PluginRpcCallInput<Method>] : [input: PluginRpcCallInput<Method>];
type PluginRpcResult<Method extends PluginRpcMethodContract> = StandardSchemaV1InferOutput<Method["output"]>;

/**
 * BB live reads are fresh for two seconds, with no polling when freshness expires.
 * Focus does not refetch while BB's realtime connection is healthy. While
 * disconnected, focus/browser-online events recheck stale active reads; BB
 * reconnect invalidates all plugin reads regardless of freshness. Page hiding
 * cancels active attempts; resuming restarts those cancelled reads.
 * Invalidations refresh immediately. Network/abort failures retry twice at
 * 250 ms; HTTP failures, including refusals, do not retry. Writes never retry
 * automatically.
 */
interface ExperimentalRpcQueryState<T> {
    /** Latest successful value plus shared predictions; retained during refresh and refresh errors. Plain reads are undefined before first success; keyed reads expose loaded rows (initially an empty record) through select. */
    data: T | undefined;
    /** Last completed read failure, or null. Success clears it; retrying a first load clears the old error while loading. Refresh errors preserve data. */
    error: experimental_PluginRpcCallError | null;
    /** An enabled read is fetching data it has never loaded. For keyed reads this includes missing requested rows; empty/disabled keyed reads are not loading. */
    isLoading: boolean;
    /** A read attempt is active, including background refreshes. Keyed consumers share this activity for their method; offline-paused reads are not fetching. */
    isFetching: boolean;
    /** Force a read regardless of freshness and wait for its attempt/retries. Keyed reads refresh the method's subscribed keys. Failures update error and retain data; this promise resolves rather than rejecting. */
    refetch(): Promise<void>;
}
interface ExperimentalRpcKeyedQueryState<T, Selection = Record<string, T>> extends ExperimentalRpcQueryState<Selection> {
}
interface ExperimentalRpcQueryOptions<Contract extends PluginRpcContract, Method extends keyof Contract & string> {
    contract: Contract;
    pluginId?: string;
    method: Method;
    input: StandardSchemaV1InferInput<Contract[Method]["input"]>;
    enabled?: boolean;
}
/**
 * Predict loaded reads with pure, synchronous update callbacks. Callbacks passed
 * to `update` and `updateKey` may run many times as pending predictions replay
 * over a new confirmed base or another prediction rolls back. Return a new
 * value without mutating `current` or captured inputs, performing side effects,
 * or generating IDs, timestamps, or random values. Generate any such values
 * once before calling `mutate` and include them in the mutation input.
 */
interface ExperimentalRpcOptimisticCache<Contract extends PluginRpcContract> {
    update<Method extends keyof Contract & string>(method: Method, input: StandardSchemaV1InferInput<Contract[Method]["input"]>, update: (current: PluginRpcResult<Contract[Method]>) => PluginRpcResult<Contract[Method]>): void;
    updateKey<Method extends ExperimentalRpcKeyedMethod<Contract>>(method: Method, key: string, update: (current: PluginRpcResult<Contract[Method]> extends Record<string, infer Value> ? Value : never) => PluginRpcResult<Contract[Method]> extends Record<string, infer Value> ? Value : never): void;
}
interface ExperimentalRpcMutationOptions<Contract extends PluginRpcContract, Method extends keyof Contract & string> {
    contract: Contract;
    pluginId?: string;
    method: Method;
    /** Predict loaded reads synchronously; shared predictions survive accepted writes whose refresh fails. */
    optimistic?(input: StandardSchemaV1InferInput<Contract[Method]["input"]>, cache: ExperimentalRpcOptimisticCache<Contract>): void;
}

interface RpcQueryHost {
    pluginId: string | null;
    queryClient: QueryClient;
    call(pluginId: string, method: string, input: JsonValue): Promise<unknown>;
    subscribe(pluginId: string): () => void;
    watch?(pluginId: string, method: string, read: {
        input: JsonValue;
    } | {
        key: string;
    }): () => void;
}

declare function createRpcQueryHooks(useHost: () => RpcQueryHost): {
    experimental_useRpcQuery: <Contract extends PluginRpcContract, Method extends keyof Contract & string>(options: ExperimentalRpcQueryOptions<Contract, Method>) => ExperimentalRpcQueryState<PluginRpcResult<Contract[Method]>>;
    experimental_useRpcKeyedQuery: <Contract extends PluginRpcContract, Method extends ExperimentalRpcKeyedMethod<Contract>, Selection = Record<string, ExperimentalRpcKeyedValue<Contract[Method]>>>(options: {
        contract: Contract;
        pluginId?: string;
        method: Method;
        keys: readonly string[];
        enabled?: boolean;
        select?(data: Record<string, ExperimentalRpcKeyedValue<Contract[Method]>>): Selection;
    }) => ExperimentalRpcKeyedQueryState<ExperimentalRpcKeyedValue<Contract[Method]>, Selection>;
    experimental_useRpcMutation: <Contract extends PluginRpcContract = Readonly<Record<string, PluginRpcMethodContract<StandardSchemaV1<unknown, unknown>, StandardSchemaV1<unknown, unknown>>>>, Method extends keyof Contract & string = keyof Contract & string>(options: ExperimentalRpcMutationOptions<Contract, Method>) => {
        error: experimental_PluginRpcCallError | null;
        mutate: (...args: PluginRpcCallArgs<Contract[Method]>) => Promise<PluginRpcResult<Contract[Method]>>;
        pendingInputs: StandardSchemaV1InferInput<Contract[Method]["input"]>[];
        isPending: boolean;
        reset: () => void;
    };
    experimental_useRpcRefresh: () => {
        isRefreshing: boolean;
        refresh: () => void;
    };
};

export { createRpcQueryHooks };
export type { RpcQueryHost };
