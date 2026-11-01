// Portable type declarations for `@workspace-core/plugin-sdk`. Unpublished BB
// workspace contracts are flattened; public subpaths may reuse the
// package root without requiring any other @core/* package.
//
// Confused by the API, or need a symbol that isn't here? Clone the BB repo
// and read the real source: https://github.com/get-bb/bb

import { StandardSchemaV1 as StandardSchemaV1$1, StandardSchemaV1InferOutput as StandardSchemaV1InferOutput$1, PluginMachineValidateDecision, JsonValue as JsonValue$2, PluginEnvironmentProviderRequirements as PluginEnvironmentProviderRequirements$1, PluginEnvironmentValidateDecision, BbPluginApi, PluginSettingValue as PluginSettingValue$1, PluginSharedPortTunnelIdentity, ExperimentalPluginProviderEnvContext, ExperimentalPluginProviderEnvEntry, PluginRowPresentation, PluginAgentToolContext, PluginAgentToolResult, PluginCliCommandInfo, PluginCliContext, PluginCliResult, PluginHttpAuthMode, PluginHttpHandler, PluginMentionTrigger, PluginMentionSearchContext, PluginMentionItem, PluginMentionProviderRegistration, ExperimentalPluginRpcCaller, PluginCliExecutionResult, PluginThreadEventName, PluginThreadEventPayloads, PluginAgentConfigurationContext, ExperimentalPluginProviderEnvHealthContext, ExperimentalPluginProviderEnvHealth, PluginSettingDescriptors, ExperimentalPluginWebSocketHandler, PluginAgentConfiguration, PluginHookName, PluginHookHandler, PluginAiServiceDeclaration, InternalDoNotUsePluginNextTunnelConfig, InternalDoNotUsePluginHostNextTunnelStatus, PluginInteractionRequest, MessageDispatchHookContext } from '@workspace-core/plugin-sdk';
import { z } from 'zod';

type PluginMachineProviderResource = Exclude<JsonValue$2, null>;
type PluginMachineProviderInputsSchema = StandardSchemaV1$1 | undefined;
type InputsValue$1<S> = S extends StandardSchemaV1$1 ? StandardSchemaV1InferOutput$1<S> : null;
interface PluginMachineProviderProgress {
    step(text: string): void;
    log(text: string): void;
}
type PluginMachineProviderAvailability = {
    status: "available";
} | {
    status: "setup-required";
    message: string;
} | {
    status: "unavailable";
    message: string;
};
type PluginMachineProviderValidateContext<S extends PluginMachineProviderInputsSchema = PluginMachineProviderInputsSchema> = {
    inputs: InputsValue$1<S>;
};
interface PluginMachineProviderLifecycleContext {
    checkpoint(resource: PluginMachineProviderResource): Promise<void>;
    report: PluginMachineProviderProgress;
    signal: AbortSignal;
}
type PluginMachineProviderCreateContext<S extends PluginMachineProviderInputsSchema = PluginMachineProviderInputsSchema> = PluginMachineProviderValidateContext<S> & PluginMachineProviderLifecycleContext & {
    key: string;
    attempt: number;
};
type PluginMachineProviderCreateResult = {
    status: "created";
    name: string;
    resource: PluginMachineProviderResource;
} | {
    status: "failed";
    message: string;
};
type PluginMachineProviderResourceLifecycleContext = PluginMachineProviderLifecycleContext & {
    hostId: string;
    resource: PluginMachineProviderResource;
};
type PluginMachineProviderRemoveContext = Omit<PluginMachineProviderResourceLifecycleContext, "checkpoint">;
interface PluginMachineProviderResourceResult {
    resource: PluginMachineProviderResource;
}
type PluginMachineProviderRemoveResult = {
    status: "removed";
} | {
    status: "failed";
    message: string;
};
interface PluginMachineProviderDefinition<S extends PluginMachineProviderInputsSchema = PluginMachineProviderInputsSchema> {
    id: string;
    displayName: string;
    /** One line telling a user what choosing this provider gets them, shown wherever a machine is added. */
    description: string;
    /** Provider glyph, declared icon, or plugin-relative icon path. */
    icon: string;
    ephemeral?: boolean;
    /** Persisted and readable by every plugin. Store secret references, never secrets. */
    inputs?: S;
    availability?(): PluginMachineProviderAvailability | Promise<PluginMachineProviderAvailability>;
    validate?(context: PluginMachineProviderValidateContext<S>): PluginMachineValidateDecision | Promise<PluginMachineValidateDecision>;
    create(context: PluginMachineProviderCreateContext<S>): Promise<PluginMachineProviderCreateResult>;
    /** Reconcile and remove an uncertain allocation by durable key without creating or bootstrapping. Return failed while allocation intent remains unresolved. */
    reconcileCleanup(context: {
        key: string;
        report: PluginMachineProviderProgress;
        signal: AbortSignal;
    }): Promise<PluginMachineProviderRemoveResult>;
    /** Idempotent: preserve saved state when compute is already stopped; save and stop any remaining compute, including during reconciliation of a suspended machine. */
    suspend?(context: PluginMachineProviderResourceLifecycleContext): Promise<PluginMachineProviderResourceResult>;
    /** Idempotent: reuse existing running compute instead of allocating a duplicate. */
    resume?(context: PluginMachineProviderResourceLifecycleContext): Promise<PluginMachineProviderResourceResult>;
    remove(context: PluginMachineProviderRemoveContext): Promise<PluginMachineProviderRemoveResult>;
}

/** Input-form entry: a path, or a path with options. */
declare const providerNativeRootInputSchema: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    ancestors: z.ZodOptional<z.ZodBoolean>;
    namePrefix: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
    recursive: z.ZodOptional<z.ZodBoolean>;
    skipIfManifest: z.ZodOptional<z.ZodString>;
}, z.core.$strict>]>;
/**
 * One provider-native root as a plugin declares it: a path, or a path with
 * options. `recursive`: the agent scans nested skill directories. `ancestors`
 * (project roots only): scan the same relative directory in every ancestor of
 * the workspace up to the repository root. `namePrefix`: prepended to every
 * name under the root, a vendor plugin's `plugin-name:`; a prefixed root is
 * listed as a plugin root. `skipIfManifest`: a vendor-plugin marker file to
 * skip by.
 */
type ProviderNativeRootInput = z.infer<typeof providerNativeRootInputSchema>;
/**
 * Normalized roots: relative to the host home (`user`) or to the workspace
 * (`project`). The daemon parses this off the wire; the server produces it
 * from a declaration.
 */
declare const providerNativeRootsSchema: z.ZodObject<{
    project: z.ZodArray<z.ZodObject<{
        ancestors: z.ZodBoolean;
        namePrefix: z.ZodString;
        path: z.ZodString;
        recursive: z.ZodBoolean;
        skipIfManifest: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    user: z.ZodArray<z.ZodObject<{
        ancestors: z.ZodBoolean;
        namePrefix: z.ZodString;
        path: z.ZodString;
        recursive: z.ZodBoolean;
        skipIfManifest: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
type ProviderNativeRoots = z.infer<typeof providerNativeRootsSchema>;
/**
 * Provider-native roots as a plugin's frozen declaration holds them: relative
 * to the target host's home (`user`) or to the workspace (`project`). Paths
 * are relative without dot segments, unique per side, at most 32 per side. A
 * root only one host can name — a moved config directory, a settings entry —
 * is the resolver's answer (`resolveNativeRoots`), never a declared root.
 */
interface ProviderNativeRootsInputLike {
    readonly user?: readonly ProviderNativeRootInput[];
    readonly project?: readonly ProviderNativeRootInput[];
}

interface JsonObject {
    [key: string]: JsonValue$1;
}
type JsonValue$1 = string | number | boolean | null | JsonValue$1[] | JsonObject;

declare const environmentSchema: z.ZodObject<{
    baseBranch: z.ZodNullable<z.ZodString>;
    branchName: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodNumber;
    defaultBranch: z.ZodNullable<z.ZodString>;
    environmentProviderId: z.ZodNullable<z.ZodString>;
    environmentProviderInstanceKey: z.ZodNullable<z.ZodString>;
    environmentProviderSelection: z.ZodNullable<z.ZodObject<{
        inputs: z.ZodNullable<z.ZodType<JsonValue$1, unknown, z.core.$ZodTypeInternals<JsonValue$1, unknown>>>;
        machine: z.ZodDiscriminatedUnion<[z.ZodObject<{
            hostId: z.ZodString;
            type: z.ZodLiteral<"existing">;
        }, z.core.$strip>, z.ZodObject<{
            inputs: z.ZodNullable<z.ZodType<JsonValue$1, unknown, z.core.$ZodTypeInternals<JsonValue$1, unknown>>>;
            machineProviderId: z.ZodString;
            type: z.ZodLiteral<"new">;
        }, z.core.$strip>], "type">;
    }, z.core.$strip>>;
    hostId: z.ZodString;
    hostLifecycle: z.ZodEnum<{
        "cleanup-failed": "cleanup-failed";
        active: "active";
        removed: "removed";
        removing: "removing";
    }>;
    id: z.ZodString;
    isGitRepo: z.ZodBoolean;
    isWorktree: z.ZodBoolean;
    lifecycle: z.ZodObject<{
        phase: z.ZodEnum<{
            active: "active";
            destroyed: "destroyed";
            retiring: "retiring";
            teardown: "teardown";
        }>;
        retireAt: z.ZodNullable<z.ZodNumber>;
        teardown: z.ZodNullable<z.ZodObject<{
            attempt: z.ZodNumber;
            message: z.ZodOptional<z.ZodString>;
            status: z.ZodEnum<{
                failed: "failed";
                removed: "removed";
                running: "running";
            }>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    managed: z.ZodBoolean;
    mergeBaseBranch: z.ZodNullable<z.ZodString>;
    name: z.ZodNullable<z.ZodString>;
    path: z.ZodNullable<z.ZodString>;
    projectId: z.ZodString;
    status: z.ZodEnum<{
        creating: "creating";
        destroyed: "destroyed";
        error: "error";
        provisioning: "provisioning";
        ready: "ready";
    }>;
    updatedAt: z.ZodNumber;
    workspaceProvisionType: z.ZodNullable<z.ZodEnum<{
        "managed-worktree": "managed-worktree";
        personal: "personal";
        unmanaged: "unmanaged";
    }>>;
}, z.core.$strip>;
type Environment = z.infer<typeof environmentSchema>;

declare const hostSchema: z.ZodObject<{
    createdAt: z.ZodNumber;
    id: z.ZodString;
    lastRejectedProtocolVersion: z.ZodNullable<z.ZodNumber>;
    lastSeenAt: z.ZodNullable<z.ZodNumber>;
    lifecycle: z.ZodObject<{
        message: z.ZodNullable<z.ZodString>;
        pendingLog: z.ZodString;
        phase: z.ZodEnum<{
            active: "active";
            creating: "creating";
            destroyed: "destroyed";
            removing: "removing";
            resuming: "resuming";
            suspended: "suspended";
            suspending: "suspending";
        }>;
        suspendedAt: z.ZodNullable<z.ZodNumber>;
        teardown: z.ZodNullable<z.ZodObject<{
            attempt: z.ZodNumber;
            status: z.ZodEnum<{
                failed: "failed";
                removed: "removed";
                running: "running";
            }>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    machineProviderId: z.ZodNullable<z.ZodString>;
    maxPermissionMode: z.ZodEnum<{
        "accept-edits": "accept-edits";
        auto: "auto";
        full: "full";
    }>;
    name: z.ZodString;
    status: z.ZodEnum<{
        connected: "connected";
        disconnected: "disconnected";
    }>;
    type: z.ZodEnum<{
        ephemeral: "ephemeral";
        persistent: "persistent";
    }>;
    updatedAt: z.ZodNumber;
}, z.core.$strip>;
type Host = z.infer<typeof hostSchema>;

declare const projectSchema: z.ZodObject<{
    createdAt: z.ZodNumber;
    gitRemoteUrl: z.ZodNullable<z.ZodString>;
    id: z.ZodString;
    kind: z.ZodEnum<{
        personal: "personal";
        standard: "standard";
    }>;
    name: z.ZodString;
    updatedAt: z.ZodNumber;
}, z.core.$strip>;
type Project = z.infer<typeof projectSchema>;

declare const PROVIDER_FORK_VALUES: readonly ["none", "tip", "checkpoint"];
type ProviderFork = (typeof PROVIDER_FORK_VALUES)[number];

interface ContractTagDeclarations<Input, Output> {
    tags?(input: Input, output: Output): readonly string[];
    keyTags?(key: string, value: Output extends Readonly<Record<string, infer Value>> ? Value : unknown): readonly string[];
    invalidates?(input: Input, output: Output): readonly string[];
}

declare const threadResponseSchema: z.ZodObject<{
    activeBackgroundAgentCount: z.ZodNumber;
    archivedAt: z.ZodNullable<z.ZodNumber>;
    canEditMessages: z.ZodBoolean;
    canRestoreEnvironment: z.ZodBoolean;
    canSpawnChild: z.ZodBoolean;
    createdAt: z.ZodNumber;
    deletedAt: z.ZodNullable<z.ZodNumber>;
    environmentId: z.ZodNullable<z.ZodString>;
    id: z.ZodString;
    lastReadAt: z.ZodNullable<z.ZodNumber>;
    latestAttentionAt: z.ZodNumber;
    lifecycleOwnerThreadId: z.ZodNullable<z.ZodString>;
    originKind: z.ZodNullable<z.ZodEnum<{
        fork: "fork";
    }>>;
    originPluginId: z.ZodNullable<z.ZodString>;
    parentNotifications: z.ZodEnum<{
        auto: "auto";
        off: "off";
        stuck: "stuck";
    }>;
    parentThreadId: z.ZodNullable<z.ZodString>;
    pinnedAt: z.ZodNullable<z.ZodNumber>;
    projectId: z.ZodString;
    providerId: z.ZodString;
    queuedMessageCount: z.ZodNumber;
    runtime: z.ZodObject<{
        displayStatus: z.ZodEnum<{
            "waiting-for-host": "waiting-for-host";
            active: "active";
            error: "error";
            idle: "idle";
            pending: "pending";
            provisioning: "provisioning";
            starting: "starting";
            stopping: "stopping";
        }>;
    }, z.core.$strip>;
    sectionId: z.ZodNullable<z.ZodString>;
    sourceThreadId: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        active: "active";
        error: "error";
        idle: "idle";
        pending: "pending";
        starting: "starting";
        stopping: "stopping";
    }>;
    title: z.ZodNullable<z.ZodString>;
    titleFallback: z.ZodNullable<z.ZodString>;
    updatedAt: z.ZodNumber;
    visibility: z.ZodEnum<{
        hidden: "hidden";
        visible: "visible";
    }>;
}, z.core.$strip>;
type ThreadResponse$1 = z.infer<typeof threadResponseSchema>;

type PluginEnvironmentProviderInputsSchema = StandardSchemaV1$1 | undefined;
type Fact<R, K extends PropertyKey, T> = R extends Record<K, true> ? T : T | null;
type Checkout<R> = R extends {
    projectCheckout: true;
} | {
    gitCheckout: true;
} ? {
    path: string;
    experimental_ownsPath: boolean;
} : {
    path: string;
    experimental_ownsPath: boolean;
} | null;
type InputsValue<S> = S extends StandardSchemaV1$1 ? StandardSchemaV1InferOutput$1<S> : null;
/** Attempt-scoped updates; core persists each update before this call returns. */
interface PluginEnvironmentProviderProgress {
    step(text: string): void;
    log(text: string): void;
}
interface PluginEnvironmentProviderValidateContext<R extends PluginEnvironmentProviderRequirements$1 = PluginEnvironmentProviderRequirements$1, S extends PluginEnvironmentProviderInputsSchema = PluginEnvironmentProviderInputsSchema> {
    project: Project;
    host: Host;
    projectCheckout: Checkout<R>;
    gitRemote: Fact<R, "gitRemote", string>;
    inputs: InputsValue<S>;
}
interface PluginEnvironmentProviderAvailabilityContext {
    project: Project;
    host: Host;
    projectCheckout: {
        path: string;
    } | null;
    gitRemote: string | null;
}
type PluginEnvironmentProviderAvailability = {
    status: "available";
} | {
    status: "setup-required";
    message: string;
} | {
    status: "unavailable";
    message: string;
};
interface PluginEnvironmentProviderCreateContext<R extends PluginEnvironmentProviderRequirements$1 = PluginEnvironmentProviderRequirements$1, S extends PluginEnvironmentProviderInputsSchema = PluginEnvironmentProviderInputsSchema> extends PluginEnvironmentProviderValidateContext<R, S> {
    thread: ThreadResponse$1;
    suggestedBranchName: string;
    attempt: number;
    pathKey: string;
    experimental_claimPath(path: string): Promise<boolean>;
    report: PluginEnvironmentProviderProgress;
    signal: AbortSignal;
}
/** Rebuilds a thread's destroyed environment; `inputs` are the ones it was created with. */
interface PluginEnvironmentProviderRestoreContext<R extends PluginEnvironmentProviderRequirements$1 = PluginEnvironmentProviderRequirements$1, S extends PluginEnvironmentProviderInputsSchema = PluginEnvironmentProviderInputsSchema> extends PluginEnvironmentProviderValidateContext<R, S> {
    thread: ThreadResponse$1;
    attempt: number;
    pathKey: string;
    experimental_claimPath(path: string): Promise<boolean>;
    /** Resource is private to this provider; null after completed removal. */
    previous: {
        environment: Environment;
        resource: JsonValue$2 | null;
    };
    report: PluginEnvironmentProviderProgress;
    signal: AbortSignal;
}
type PluginEnvironmentProviderCreateResult = {
    status: "created";
    path: string;
    ownsPath: boolean;
    /** Ref the workspace's changes are compared against. Null clears the value recorded on a reused environment; omit to keep it. */
    mergeBaseBranch?: string | null;
    resource?: JsonValue$2;
} | {
    status: "failed";
    message: string;
};
interface PluginEnvironmentProviderRemoveContext {
    environment: Environment | null;
    hostId: string | null;
    path: string | null;
    pathKey: string;
    resource: JsonValue$2 | null;
    attempt: number;
    report: PluginEnvironmentProviderProgress;
    signal: AbortSignal;
}
type PluginEnvironmentProviderRemoveResult = {
    status: "removed";
} | {
    status: "failed";
    message: string;
};
/** Core normalizes omitted policy members once at registration. */
interface PluginEnvironmentProviderPolicy {
    /** Default five minutes; null keeps the environment indefinitely. */
    retireGraceMs: number | null;
    /** Default per-thread; replacement environments use a fresh key to avoid dead paths. */
    pathKeys: "per-attempt" | "per-thread";
}
/** Resource operations only. Core owns durable launches, retries and retirement. */
interface PluginEnvironmentProviderDefinition<R extends PluginEnvironmentProviderRequirements$1 = PluginEnvironmentProviderRequirements$1, S extends PluginEnvironmentProviderInputsSchema = PluginEnvironmentProviderInputsSchema> {
    id: string;
    displayName: string;
    /** Short explanation shown in environment choices. */
    description: string;
    /** Host glyph, plugin-relative icon path, or this plugin’s declared namespaced icon. */
    icon: string;
    requires?: R;
    inputs?: S;
    policy?: Partial<PluginEnvironmentProviderPolicy>;
    /** Experimental per-machine availability, probed in the background for pickers and again at thread creation: see docs/api_to_audit.md. */
    availability?(context: PluginEnvironmentProviderAvailabilityContext): PluginEnvironmentProviderAvailability | Promise<PluginEnvironmentProviderAvailability>;
    validate?(context: PluginEnvironmentProviderValidateContext<R, S>): PluginEnvironmentValidateDecision | Promise<PluginEnvironmentValidateDecision>;
    /** Pure path selection from parsed inputs. Core reuses a recorded environment on the selected host before calling create; null requests normal creation. */
    experimental_existingPath?(inputs: InputsValue<S>): string | null;
    create(context: PluginEnvironmentProviderCreateContext<R, S>): Promise<PluginEnvironmentProviderCreateResult>;
    /** Experimental: rebuild a destroyed environment when its thread asks for it back. Without it, core never rebuilds this provider's destroyed environments: see docs/api_to_audit.md. */
    restore?(context: PluginEnvironmentProviderRestoreContext<R, S>): Promise<PluginEnvironmentProviderCreateResult>;
    remove(context: PluginEnvironmentProviderRemoveContext): Promise<PluginEnvironmentProviderRemoveResult>;
}

interface MachineExecutorRequest {
    command: string[];
    timeoutMs: number;
    signal: AbortSignal;
    stdin: string;
    onOutput: (chunk: string) => void;
}
interface MachineExecutor {
    exec(request: MachineExecutorRequest): Promise<{
        exitCode: number;
    }>;
}
interface MachineBootstrapRequest {
    key: string;
    executor: MachineExecutor;
    report: PluginMachineProviderProgress;
    signal: AbortSignal;
}
interface MachineBootstrapApi {
    bootstrap(request: MachineBootstrapRequest): Promise<{
        hostId: string;
    }>;
}

/**
 * A value that survives a JSON round trip without coercion or data loss.
 *
 * Host boundaries still validate values at runtime because TypeScript cannot
 * exclude non-finite numbers and plugin bundles can bypass static types.
 */
type JsonValue = string | number | boolean | null | JsonValue[] | {
    [key: string]: JsonValue;
};

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

type PluginSettingValue = string | number | boolean;
/**
 * The facts this provider consumes, in one declaration. Every member is
 * something core can evaluate before the thread exists and supply to
 * `create`, so it is also the whole of what decides where the provider is
 * offered, and the picker needs to know no provider by name. Every member
 * defaults to false.
 *
 * - `projectCheckout` — the provider works from this project's directory on
 *   that machine, git or not, so core refuses a machine with no checkout of
 *   the project at create time and `context.projectCheckout` is non-null.
 * - `gitCheckout` — that directory must also be a git repository with at
 *   least one commit. Core inspects the selected machine and rejects an
 *   invalid selection before creating the thread. Implies `projectCheckout`.
 * - `gitRemote` — the provider clones the project itself, so an explicit
 *   selection is rejected when the project has no git remote.
 * - `projectless` — this provider serves only threads that have no project,
 *   so it is offered for those and nowhere else. It cannot be combined with
 *   `projectCheckout`, `gitCheckout` or `gitRemote`, which need a project.
 */
interface PluginEnvironmentProviderRequirements {
    projectCheckout?: boolean;
    gitCheckout?: boolean;
    gitRemote?: boolean;
    projectless?: boolean;
}
/**
 * Resource operations for one place a thread can run. Core persists progress,
 * retries, cancellation and retirement. Operations must be idempotent for the
 * supplied pathKey. Provider ids are unique across running plugins.
 */
type PluginEnvironmentProviderDeclaration<Requires extends PluginEnvironmentProviderRequirements = PluginEnvironmentProviderRequirements, Inputs extends PluginEnvironmentProviderInputsSchema = PluginEnvironmentProviderInputsSchema> = PluginEnvironmentProviderDefinition<Requires, Inputs>;
type PluginMachineProviderDeclaration<Inputs extends PluginMachineProviderInputsSchema = PluginMachineProviderInputsSchema> = PluginMachineProviderDefinition<Inputs>;
interface ServerAccessGrant {
    id: string;
    serverUrl: string;
    headers?: Record<string, string>;
}
interface ServerAccessProviderDeclaration {
    id: string;
    displayName: string;
    description: string;
    availability(): (PluginMachineProviderAvailability & {
        serverUrl?: string;
    }) | Promise<PluginMachineProviderAvailability & {
        serverUrl?: string;
    }>;
    acquire(context: {
        key: string;
        hostId: string;
        signal: AbortSignal;
    }): Promise<ServerAccessGrant | {
        status: "failed";
        message: string;
    }>;
    release(context: {
        key: string;
        hostId: string;
        /** Null when acquisition was interrupted before a grant was returned. Reconcile using key and hostId. */
        grantId: string | null;
    }): Promise<void>;
}
/**
 * Permission modes a provider can run a session in — BB's own permission
 * vocabulary, ordered least ("accept-edits") to most ("full") privileged.
 */
type PluginProviderPermissionMode = "accept-edits" | "auto" | "full";
/**
 * Coarse reasoning-effort ladder entries, ordered lowest to highest. The
 * declared ladder is a fallback only: precise per-model reasoning sets come
 * from the provider's model list at runtime.
 */
type PluginProviderReasoningLevel = "high" | "low" | "max" | "medium" | "none" | "ultra" | "ultracode" | "xhigh";
/**
 * Composer actions a provider supports, by name only. The skills
 * slash-command typeahead is universal — BB injects skills into every
 * provider — so it is implicit and never declared, and the composer owns the
 * trigger syntax (`/plan `, `/goal `) rather than each declaration repeating
 * it.
 */
type PluginProviderComposerAction = "goal" | "plan";
/**
 * Pre-session capability facts about a provider. A capability earns a field
 * here only when it passes BOTH tests: (1) a consumer outside the provider's
 * own plugin needs the fact, and (2) the fact is needed before / without a
 * live session (picker rendering, route gating, cross-plugin tool
 * composition — including with the host offline). Every boolean is a
 * provider-native fact — the provider implements the feature; the flag only
 * tells external consumers it exists. Session-behavior facts remain handshake
 * capabilities reported by the running bridge. Sessionless maintenance
 * methods are declared here so callers can decide whether to probe without
 * starting the bridge first.
 */
interface PluginProviderCapabilities {
    /** The provider accepts a fast/priority service-tier choice — shows the
     * service-tier toggle in the picker. */
    supportsServiceTier: boolean;
    /** The provider ships its own native ask-user-question tool — the
     * ask-user-question plugin skips registering its duplicate. */
    supportsNativeUserQuestion: boolean;
    /**
     * How completely the provider can clone a session: `"none"` (not at all),
     * `"tip"` (only the current end, so thread fork works but edit-past-message
     * rewind cannot), or `"checkpoint"` (recreate the session at an earlier
     * point, which rewind needs). Gates the fork and edit-past-message
     * affordances. The bridge reports the same fact at `initialize`, where it
     * may narrow this declaration but never widen it.
     */
    fork: ProviderFork;
    /** The provider accepts an explicit context-compaction request — gates the
     * compact affordance. */
    supportsManualCompaction: boolean;
    /** The provider keeps its own thread archive, so BB mirrors archive and
     * unarchive onto it instead of tracking the state only in bb's own rows. */
    supportsThreadArchive: boolean;
    /** The provider stores a thread name of its own, so BB forwards renames to
     * it. */
    supportsThreadRename: boolean;
    /** Permission modes the provider can actually run in. Non-empty, no
     * duplicates. */
    permissionModes: readonly PluginProviderPermissionMode[];
    /** The provider's coarse fallback reasoning ladder (see
     * {@link PluginProviderReasoningLevel}). Non-empty, no duplicates. */
    reasoningLevels: readonly PluginProviderReasoningLevel[];
}
/**
 * Provider copy core surfaces render from per-provider tables today (usage
 * banners, sign-in hints, the mobile picker, the agent guide). Declared once
 * here so no core surface keys copy on a provider id. Mirrors
 * `providerStringsSchema` in `@core/domain`, which is the client projection.
 */
interface PluginProviderStrings {
    /** How to sign in on the host ("Run `claude` on the machine to sign in."). */
    signInHint: string;
    /** Shown when a session's credentials expired. */
    expiredHint: string;
    /** Where to install the agent. */
    installUrl: string;
    /** Brand prefix stripped from model display names ("Claude "). */
    brandPrefix?: string;
    /** Plan-mode banner copy for providers that declare the `plan` action. */
    planModeCopy?: string;
    /** Per-theme tint for the provider icon. */
    iconTint?: {
        light: string;
        dark: string;
    };
}
/**
 * One selectable option for a picker — a service tier or a reasoning level.
 * `id` is the wire value the bridge receives; `label` is what the picker
 * shows. Declared lists are the cold-cache fallback; `model/list` is precise
 * per model.
 */
interface PluginProviderOptionDescriptor {
    id: string;
    label: string;
    description?: string;
    /** Host glyph name (`"Zap"`) or declared icon (`"<pluginId>/<name>"`, an
     * entry of this plugin's `bb.branding.experimental_icons`; any other plugin
     * id or an undeclared name fails the load) shown beside a selected service
     * tier. Host glyphs draw filled. Ignored for reasoning levels. Defaults to
     * `"Zap"`. */
    experimental_icon?: string;
}
/**
 * Payload schemas for one extension kind this provider emits, keyed by the
 * kind's local name (the server prefixes the plugin id to form the
 * namespaced `"<pluginId>/<name>"`). `item` validates `item.open` payloads
 * with `type: "extension"`, `state` validates `extension.state` payloads;
 * each is optional so a kind can be item-only or state-only. Schemas are
 * Standard Schema v1 validators (zod 4 schemas qualify).
 */
interface PluginProviderExtensionKindDeclaration {
    item?: StandardSchemaV1;
    state?: StandardSchemaV1;
}
/**
 * Per-command context handed to
 * {@link PluginProviderDeclaration.deriveProviderOptions}. The
 * server builds one for every session and turn command it dispatches on a
 * thread of this provider.
 */
interface PluginProviderOptionsContext {
    threadId: string;
    projectId: string;
    /** The resolved model id for this command. */
    model: string;
    /** BB's permission mode for this command (already clamped to the host). */
    permissionMode: PluginProviderPermissionMode;
    /**
     * `"plan"` when the prompt entered plan mode through this provider's
     * declared `plan` composer action. Absent for an ordinary prompt — plan
     * mode is a BB prompt mode, so the bridge maps it onto whatever the agent
     * calls it natively.
     */
    promptMode?: "plan";
    /**
     * This plugin's own settings values (`bb.settings.define`), read at call
     * time. Secret settings are omitted — provider options ride the daemon
     * wire and are persisted with the session, so a secret must never be
     * derived into them.
     */
    settings: Readonly<Record<string, PluginSettingValue | undefined>>;
}
/** See {@link PluginProviderDeclaration.models}. */
type PluginProviderModelCatalogScope = "host" | "workspace";
/** See {@link PluginProviderDeclaration.completedTurnDisplay}. */
type PluginProviderCompletedTurnDisplay = "collapse" | "flat";
/**
 * One cold-cache fallback model. The provider's live `model/list` result is
 * the only real model source; this list stands in only while no probe has
 * completed, or when a probe fails transiently, so the picker is not empty.
 * `id` is the wire model id the bridge receives.
 */
interface PluginProviderFallbackModel {
    id: string;
    /** Picker display name ("Opus 5 (1M)"). */
    displayName: string;
    description: string;
    /** Reasoning levels this model supports, lowest to highest. Non-empty.
     * `reasoningEffort` is a standard ladder entry or any provider-specific id
     * the bridge accepts back as `reasoningLevel`; `label` names a
     * provider-specific id in the picker. */
    supportedReasoningEfforts: readonly {
        reasoningEffort: PluginProviderReasoningLevel | (string & {});
        label?: string;
        description: string;
    }[];
    /** Must be one of `supportedReasoningEfforts`. */
    defaultReasoningEffort: PluginProviderReasoningLevel | (string & {});
    /** Exactly one entry in the list is the default. */
    isDefault: boolean;
}
/**
 * Which sessionless maintenance requests a provider bridge implements. The
 * server skips the requests a provider does not declare, and clients omit
 * the matching surfaces, without starting the bridge first.
 */
interface PluginProviderMaintenance {
    /** `provider/health`: host-local readiness, never a network health check. */
    health?: boolean;
    /** `provider/usage`: subscription usage windows. False means usage settings
     * omit the provider. A shared bridge that declares true may still report
     * usage unavailable for one provider id or return no windows. */
    usage?: boolean;
    /** `provider/installation/status` and `provider/installation/run`:
     * host-local installation management. */
    installation?: boolean;
}
/** Provider-native roots as a plugin declares them, one list per side. */
type PluginProviderNativeRoots = ProviderNativeRootsInputLike;
/**
 * One provider this plugin contributes to BB's provider registry.
 *
 * Ids are stable public identifiers — thread rows and routes reference them —
 * and are collision-rejected: a declaration whose id matches another plugin's
 * live registration is refused; the first registration wins and no id is
 * reserved ahead of time. Registrations are replaced wholesale on plugin
 * reload, like every other plugin surface.
 *
 * A declaration owns the provider's static metadata and bridge options. The
 * executable implementation is the plugin's own provider bridge: the
 * `experimental_providerBridge` export of the `bb.host` artifact the manifest
 * names (`PROVIDER_BRIDGE_EXPORT_NAME` in the bridge kit), built into the
 * artifact BB ships to hosts. Declaring a provider in a plugin with no
 * `bb.host` entry is refused, because the picker entry would exist and no
 * turn on it could ever run; a `bb.host` entry whose artifact failed to
 * build still stages the declaration so the provider is listed as
 * unavailable.
 */
interface PluginProviderDeclaration {
    /** Stable provider id: 2–64 characters of lowercase letters, digits, and
     * "-", starting with a letter or digit. Existing ids must never change —
     * threads persist them. */
    id: string;
    /** Picker display name: 1–80 characters, non-blank. */
    displayName: string;
    /**
     * Optional grouping key (same grammar as `id`) for providers that share a
     * family — the ACP agents, for example — so clients can group them without
     * parsing a prefix out of the id. Grouping only: no policy keys on it.
     */
    family?: string;
    /**
     * Optional picker icon: a named host glyph (`"Zap"`) or a plugin-relative
     * path starting with `"./"` (`"./icons/agent.svg"`) — the two forms
     * `bb.branding.icon` takes — or, unlike `bb.branding.icon`, one of this
     * plugin's declared icons by its namespaced glyph (`"<pluginId>/<name>"`,
     * an entry of the manifest's `bb.branding.experimental_icons` map; the
     * plugin id must be this plugin's and the name must be declared, else the
     * plugin fails to load). Paths follow the manifest entry-path escape rules
     * — no leading "/", no ".." segments, no backslashes.
     */
    icon?: string;
    /**
     * Provider-owned static options passed opaquely to this plugin's bridge on
     * every sessionless and session request. Core validates that the value is
     * JSON, but does not interpret its keys. This is intended for immutable
     * launch metadata shared by every host (for example an ACP command spec),
     * not user or machine configuration.
     */
    experimental_bridgeOptions?: Readonly<Record<string, JsonValue>>;
    /**
     * Whether the provider is always listed or only listed on hosts where its
     * bridge reports it installed. Defaults to `"always"`.
     */
    experimental_visibility?: "always" | "installed";
    /**
     * The sessionless maintenance requests the provider's bridge implements
     * (docs/provider-plugin-api.md §1). Each defaults to false when omitted.
     */
    maintenance?: PluginProviderMaintenance;
    /** Pre-session capability facts (see the declaration tests on
     * {@link PluginProviderCapabilities}). */
    capabilities: PluginProviderCapabilities;
    /** Composer actions this provider supports. No duplicates; may be empty
     * (the universal skills typeahead is implicit). */
    composerActions: readonly PluginProviderComposerAction[];
    /**
     * How the thread timeline shows this provider's turns once they finish.
     * `"collapse"` (the default) folds a finished turn's work into one
     * "Worked for" row and leaves the final answer visible. `"flat"` keeps
     * every row of a finished turn visible, as it was while the turn ran. This
     * is only the provider's default: the user can choose either display for
     * each provider in Settings → Providers or with
     * `bb settings completed-turns`, and that choice wins.
     */
    completedTurnDisplay?: PluginProviderCompletedTurnDisplay;
    /** Provider copy for core surfaces ({@link PluginProviderStrings}). */
    strings?: PluginProviderStrings;
    /** Service tiers this provider accepts, as picker options. Non-empty when
     * present, unique ids. Ids are open: `"default"` is the provider's standard
     * tier and every other id is passed to the bridge as `serviceTier`. A
     * `model/list` entry narrows the list with `supportedServiceTiers`. The
     * coarse `capabilities.supportsServiceTier` stays until WS2a stabilizes. */
    serviceTiers?: readonly PluginProviderOptionDescriptor[];
    /** Reasoning levels as picker options with labels, beside the coarse
     * `capabilities.reasoningLevels` ladder (ids only). Non-empty when present,
     * unique ids. WS2a merges the two. */
    reasoningLevels?: readonly PluginProviderOptionDescriptor[];
    /** Extension kinds this provider's bridge may emit, keyed by local name
     * (`[a-z0-9-]+`). The server validates extension payloads against these
     * schemas at ingest and persists a `provider/unhandled` on a miss. */
    extensionKinds?: Readonly<Record<string, PluginProviderExtensionKindDeclaration>>;
    /**
     * Cold-cache fallback models ({@link PluginProviderFallbackModel}). The
     * server offers them only while a model probe has not completed or failed
     * transiently; the live `model/list` result always replaces them. Ids must
     * be unique and exactly one entry must be the default.
     */
    models?: {
        /**
         * Optional: a provider that only declares a catalog `scope` needs no
         * fallback list, and an omitted list reads as no fallbacks at all.
         */
        fallback?: readonly PluginProviderFallbackModel[];
        /**
         * How far one `model/list` answer travels. `"host"` means the catalog is
         * the same everywhere on a machine — the bridge answers from account or
         * agent state and ignores the workspace path — so bb probes once per host
         * and reuses the answer for every environment on it. `"workspace"` (the
         * default) means project configuration can change the answer, so bb
         * probes per workspace and sends the path.
         *
         * Declaring `"host"` wrongly is a stale catalog in a workspace that
         * configured its own models; declaring `"workspace"` wrongly costs a
         * redundant probe. The default is therefore the safe one.
         */
        scope?: PluginProviderModelCatalogScope;
    };
    /**
     * Daemon environment variables this provider's bridge may read. Provider
     * processes are spawned with every inherited `BB_*` variable stripped, so a
     * bridge that honors an operator override (a CLI path, say) names it here
     * and the daemon forwards exactly those variables. Names are
     * `[A-Z_][A-Z0-9_]*`, at most 32.
     */
    env?: {
        passthrough: readonly string[];
    };
    /**
     * Directories this provider's agent reads its own skills from, relative to
     * the target host's home directory (`user`) or to the workspace
     * (`project`). An agent with skills of its own — an ACP agent pointed at
     * `.cursor/skills`, say — names them here so bb can list them beside its
     * own; core never guesses a provider's skill layout. Paths are relative
     * and may not contain dot segments; each side holds at most 32 roots. One
     * declaration is global, so a directory only one host can name (an agent's
     * settings-configured skills directory, say) is not declared here but
     * resolved on that host (`experimental_resolvesNativeRoots`).
     */
    experimental_nativeSkillRoots?: PluginProviderNativeRoots;
    /**
     * Directories this provider's agent reads its own slash commands from —
     * flat directories of `*.md` prompt files (`.claude/commands`, say) — in
     * the same two-sided shape as `experimental_nativeSkillRoots`. bb offers
     * them in the composer beside the agent's skills.
     */
    experimental_nativeCommandRoots?: PluginProviderNativeRoots;
    /**
     * This plugin's `bb.host` entry implements
     * `experimental_nativeRootsHostContract` (`@workspace-core/plugin-sdk/host`): core
     * calls `resolveNativeRoots({ cwd })` on the workspace host when it lists
     * commands or skills, and scans what comes back beside the declared roots.
     * This is where a provider's host-only knowledge goes — a config-moved
     * directory, an installed vendor plugin, a config-file entry — including
     * project-scoped entries, which a global declaration cannot carry.
     */
    experimental_resolvesNativeRoots?: boolean;
    /**
     * Derive this provider's opaque per-command options. Called synchronously
     * by the server for every session and turn command on a thread of this
     * provider, with the command's {@link PluginProviderOptionsContext}; the
     * returned JSON object reaches this plugin's bridge as
     * `options.providerOptions`, merged over `experimental_bridgeOptions`. Core
     * never interprets its keys — this is where a provider's own knobs (memory,
     * native subagents, a native plan flag) travel instead of on the shared
     * execution contract. A throw fails the command with the plugin named, so
     * a buggy hook cannot silently run a turn with default knobs. Must be fast:
     * it sits on the turn-submit path.
     */
    deriveProviderOptions?: (context: PluginProviderOptionsContext) => Readonly<Record<string, JsonValue>>;
}

/**
 * Validate one `bb.providers.register` declaration. Plugin
 * sources are untyped at runtime, so every field is checked; the production
 * host and the fake host both call this, so they accept and reject provider
 * declarations identically. Throws a descriptive error on the first problem;
 * returns a normalized, deeply frozen copy carrying only contract fields.
 */
/**
 * A declaration that has been through {@link validatePluginProviderDeclaration}.
 *
 * The validator fills the defaults it owns, so a consumer reads one explicit
 * value rather than re-deciding what an absent field means. Only the fields
 * the validator GUARANTEES are narrowed here; everything else keeps the
 * author-facing shape.
 */
type NormalizedPluginProviderDeclaration = Omit<PluginProviderDeclaration, "experimental_nativeCommandRoots" | "experimental_nativeSkillRoots" | "experimental_resolvesNativeRoots"> & {
    readonly experimental_nativeSkillRoots?: ProviderNativeRoots;
    readonly experimental_nativeCommandRoots?: ProviderNativeRoots;
    readonly experimental_resolvesNativeRoots: boolean;
    readonly completedTurnDisplay: PluginProviderCompletedTurnDisplay;
    readonly maintenance: {
        readonly health: boolean;
        readonly usage: boolean;
        readonly installation: boolean;
    };
    readonly models: {
        readonly fallback?: readonly PluginProviderFallbackModel[];
        readonly scope: PluginProviderModelCatalogScope;
    };
};
declare function readRpcPublicationOptions(value: unknown): {
    experimental_discoverable: boolean;
    experimental_description: string | null;
};
declare function publishRpcMethod(method: string, contract: PluginRpcMethodContract, options: ReturnType<typeof readRpcPublicationOptions>): {
    method: string;
    registrationDescription: string | null;
    methodDescription: string | null;
    inputSchema: Record<string, JsonValue$1>;
    outputSchema: Record<string, JsonValue$1>;
} | null;
declare const ENVIRONMENT_PROVIDER_REQUIREMENT_NAMES: readonly ["projectCheckout", "gitCheckout", "gitRemote", "projectless"];
type NormalizedPluginEnvironmentProviderRequirements = {
    [K in (typeof ENVIRONMENT_PROVIDER_REQUIREMENT_NAMES)[number]]: boolean;
};
declare const environmentCompositionSchema: z.ZodObject<{
    description: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string | null, string | undefined>>;
    displayName: z.ZodString;
    environmentProviderId: z.ZodString;
    icon: z.ZodPipe<z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>, z.ZodTransform<string | null, string | undefined>>;
    id: z.ZodString;
    machineProviderId: z.ZodString;
}, z.core.$strict>;
type NormalizedPluginEnvironmentComposition = z.infer<typeof environmentCompositionSchema>;
interface NormalizedPluginEnvironmentProvider {
    id: string;
    displayName: string;
    description: string | null;
    icon: string | null;
    requires: NormalizedPluginEnvironmentProviderRequirements;
    inputs: StandardSchemaV1 | null;
    inputsJsonSchema: JsonValue | null;
    availability: NonNullable<PluginEnvironmentProviderDeclaration["availability"]> | null;
    validate: NonNullable<PluginEnvironmentProviderDeclaration["validate"]> | null;
    experimental_existingPath: NonNullable<PluginEnvironmentProviderDeclaration["experimental_existingPath"]> | null;
    create: PluginEnvironmentProviderDeclaration["create"];
    restore: NonNullable<PluginEnvironmentProviderDeclaration["restore"]> | null;
    remove: PluginEnvironmentProviderDeclaration["remove"];
    policy: PluginEnvironmentProviderPolicy;
}
interface NormalizedPluginMachineProvider {
    id: string;
    displayName: string;
    description: string;
    icon: string;
    ephemeral: boolean;
    inputs: StandardSchemaV1 | null;
    inputsJsonSchema: JsonValue | null;
    availability: NonNullable<PluginMachineProviderDeclaration["availability"]> | null;
    validate: NonNullable<PluginMachineProviderDeclaration["validate"]> | null;
    reconcileCleanup: PluginMachineProviderDeclaration["reconcileCleanup"];
    create: PluginMachineProviderDeclaration["create"];
    suspend: NonNullable<PluginMachineProviderDeclaration["suspend"]> | null;
    resume: NonNullable<PluginMachineProviderDeclaration["resume"]> | null;
    remove: PluginMachineProviderDeclaration["remove"];
}

type BbSdk = BbPluginApi["sdk"];
/** One recorded `bb.sdk` call. `path` is dot-joined, e.g. "threads.spawn". */
interface FakeSdkCall {
    path: string;
    args: unknown[];
}
/**
 * A stub keeps the real method's parameter types but may return anything —
 * tests usually only build the fields the plugin reads, not the full wire
 * response.
 */
type LooseStub<F> = F extends (...args: infer A) => unknown ? (...args: A) => unknown : never;
/**
 * Stub implementations keyed like `BbSdk`: an object per area with a subset
 * of its methods, or a function for the root-level members (`on`).
 */
type FakeSdkOverrideTree<T> = {
    [K in keyof T]?: T[K] extends (...args: never[]) => unknown ? LooseStub<T[K]> : FakeSdkOverrideTree<T[K]>;
};
type FakeSdkOverrides = FakeSdkOverrideTree<BbSdk>;
interface FakeSdkHarness {
    /**
     * Every `bb.sdk` call in order, including ones whose stub threw. Calls
     * rejected by argument validation are not recorded.
     */
    readonly calls: FakeSdkCall[];
    /** Argument lists of the calls to one dot-joined path. */
    callsTo(path: string): unknown[][];
    /** Add or replace one method's implementation after creation. */
    stub(path: string, implementation: (...args: never[]) => unknown): void;
}
/**
 * Recordable `bb.sdk` stand-in for {@link createFakePluginHost}. Calls are
 * recorded after the plugin-bound normalization the server applies, so
 * assertions see what the server would receive. Arguments the real SDK
 * rejects before sending, such as invalid `pluginMetadata`, return a rejected
 * promise and are not recorded. Calls without a stubbed implementation throw
 * with a message naming the exact path to stub.
 */
declare function createFakeSdk(options: {
    pluginId: string;
    overrides?: FakeSdkOverrides;
}): {
    sdk: BbSdk;
    harness: FakeSdkHarness;
};

/**
 * `createFakePluginHost` — an in-process stand-in for the BB server's plugin
 * runtime (apps/server/src/services/plugins/plugin-api.ts), for unit-testing
 * a plugin's `server.ts` without a server. `bb` satisfies {@link BbPluginApi};
 * `harness` drives and inspects it.
 *
 * Faithful where a plugin can observe it: registration name validation and
 * error messages, the kv 256KB cap, append-only database migrations, settings
 * read/update semantics (including onChange), schema-validated rpc/cli
 * invocation shapes (strict JSON boundaries, exit-code normalization), `threads.spawn`
 * attribution, atomic reload, and dispose order (services aborted, hooks LIFO,
 * database closed, stale handles throw). New tests can keep host inputs,
 * assertions, and shutdown explicit through `harness.behavior`,
 * `harness.inspection`, and `harness.lifecycle`; direct members remain aliases.
 *
 * Deliberately different from the real host:
 * - storage is process-local: kv in a Map, `storage.database()` one shared
 *   better-sqlite3 handle in a temp directory (same data across calls, like
 *   the host's shared file), secret settings alongside plain values (no files).
 * - `bb.sdk` is always bound (no listen gate) and every unstubbed method
 *   throws instead of hitting a server.
 * - http auth modes are recorded but not enforced — signature checks and
 *   token handling inside handlers still run.
 * - background services/schedules never run on timers; `harness.runService`
 *   and `harness.runSchedule` invoke them deterministically.
 */
/** Same shape (and name) the real host throws for stale API handles. */
declare class PluginContextStaleError extends Error {
    constructor(pluginId: string);
}
type FakeLogLevel = "debug" | "error" | "info" | "warn";
interface FakeLogEntry {
    level: FakeLogLevel;
    message: string;
}
interface FakeHttpRouteRecord {
    method: string;
    path: string;
    auth: PluginHttpAuthMode;
    handler: PluginHttpHandler;
}
interface ExperimentalFakeWebSocketRouteRecord {
    path: string;
    auth: PluginHttpAuthMode;
    handler: ExperimentalPluginWebSocketHandler;
}
interface ExperimentalFakeWebSocketSession {
    readonly sent: readonly (string | Uint8Array)[];
    readonly closeCalls: readonly {
        code: number | null;
        reason: string | null;
    }[];
    readonly readyState: number;
    receive(data: string | Uint8Array): Promise<void>;
    close(code?: number, reason?: string): Promise<void>;
    error(error: Error): Promise<void>;
}
interface FakeScheduleRecord {
    name: string;
    cron: string;
    fn: () => void | Promise<void>;
}
interface FakeServiceRecord {
    name: string;
    start: (signal: AbortSignal) => void | Promise<void>;
}
interface FakeCliRecord {
    name: string;
    summary: string;
    commands: PluginCliCommandInfo[];
    run: (argv: string[], ctx: PluginCliContext) => PluginCliResult | Promise<PluginCliResult>;
}
interface FakeAgentToolRecord {
    name: string;
    description: string;
    instructions: string | null;
    /**
     * The plugin's declared row presentation, null when it declared none.
     * Parsed by the shared `parsePluginRowPresentation`, so the record
     * holds exactly what the production host stores and a presentation bb
     * rejects is rejected here with the same message.
     */
    presentation: PluginRowPresentation | null;
    /** JSON-schema object the host would send providers. */
    inputSchema: unknown;
    parse(input: unknown): {
        ok: true;
        value: unknown;
    } | {
        ok: false;
        error: string;
    };
    execute(params: unknown, ctx: PluginAgentToolContext): PluginAgentToolResult | Promise<PluginAgentToolResult>;
}
interface FakeMentionProviderRecord {
    id: string;
    label: string;
    triggers: readonly PluginMentionTrigger[];
    search: (ctx: PluginMentionSearchContext) => PluginMentionItem[] | Promise<PluginMentionItem[]>;
    resolve: PluginMentionProviderRegistration["resolve"];
}
interface FakeRealtimeSignal {
    channel: string;
    /** JSON-round-tripped, like the WS broadcast; `undefined` → `null`. */
    payload: unknown;
}
interface ExperimentalFakeHostRpcCall {
    method: string;
    input: unknown;
    hostId: string;
    signal?: AbortSignal;
}
/** Everything the plugin registered, exposed raw for assertions. */
interface FakePluginRegistrations {
    settingsDescriptors: PluginSettingDescriptors;
    httpRoutes: FakeHttpRouteRecord[];
    websocketRoutes: ExperimentalFakeWebSocketRouteRecord[];
    experimental_publishedRpcMethods: Array<NonNullable<ReturnType<typeof publishRpcMethod>>>;
    rpcMethods: string[];
    services: FakeServiceRecord[];
    schedules: FakeScheduleRecord[];
    cli: FakeCliRecord | null;
    agentTools: FakeAgentToolRecord[];
    /** Provider from bb.agents.configure, or null when none registered. */
    agentConfigurationProvider: ((context: PluginAgentConfigurationContext) => PluginAgentConfiguration) | null;
    /** Provider from contributeInstructions, or null when none registered. */
    instructionProvider: ((ctx: {
        threadId: string;
        projectId: string;
    }) => string | null) | null;
    threadEventHandlers: Record<PluginThreadEventName, number>;
    /** The handler registered per hook by `bb.experimental_hooks.on`. */
    hooks: {
        [K in PluginHookName]: PluginHookHandler<K> | null;
    };
    environmentCompositions: ReadonlyMap<string, NormalizedPluginEnvironmentComposition>;
    environmentProviders: ReadonlyMap<string, NormalizedPluginEnvironmentProvider>;
    machineProviders: ReadonlyMap<string, NormalizedPluginMachineProvider>;
    serverAccessProviders: ReadonlyMap<string, ServerAccessProviderDeclaration>;
    mentionProviders: FakeMentionProviderRecord[];
    /** Live provider registrations from `bb.providers.register`
     * (normalized declarations, registration order; dispose removes). */
    providerRegistrations: NormalizedPluginProviderDeclaration[];
    providerEnvResolvers: ReadonlyMap<string, (context: ExperimentalPluginProviderEnvContext) => Promise<readonly ExperimentalPluginProviderEnvEntry[]> | readonly ExperimentalPluginProviderEnvEntry[]>;
    providerEnvHealthResolvers: ReadonlyMap<string, (context: ExperimentalPluginProviderEnvHealthContext) => ExperimentalPluginProviderEnvHealth | null | Promise<ExperimentalPluginProviderEnvHealth | null>>;
    /** Live AI-service registrations from `experimental_aiServices.register`
     * (normalized declarations, registration order; dispose removes). */
    aiServiceRegistrations: PluginAiServiceDeclaration[];
}
/** One handle opened through `bb.server.internal_DO_NOT_USE_openTunnelIngress`. */
interface InternalDoNotUseFakeTunnelIngress {
    readonly audience: string;
    readonly baseUrl: string;
    /** True once the plugin closed the handle or the host disposed it. */
    readonly closed: boolean;
}
/** Read-only state for assertions after a plugin registers or handles work. */
interface FakePluginInspectionState {
    readonly pluginId: string;
    /** Every `bb.log` line, in order. */
    readonly logEntries: FakeLogEntry[];
    /** Every `bb.realtime.publish`, payload normalized like the wire. */
    experimental_onRpcInvalidation(listener: () => void): () => void;
    readonly experimental_rpcInvalidations: (readonly string[] | null)[];
    readonly realtimeSignals: FakeRealtimeSignal[];
    /** Every `bb.status.needsConfiguration` message, in order. */
    readonly needsConfigurationMessages: string[];
    /**
     * How many times the plugin called
     * `bb.experimental_hooks.recheck()` — the wake it asks core for when a
     * condition its own waits depend on has changed.
     */
    readonly recheckCount: number;
    /** Recorded `bb.sdk` calls + stub control. */
    readonly sdk: FakeSdkHarness;
    readonly registrations: FakePluginRegistrations;
    /** Every `bb.server.internal_DO_NOT_USE_openTunnelIngress` handle, in order. */
    readonly internal_DO_NOT_USE_tunnelIngresses: readonly InternalDoNotUseFakeTunnelIngress[];
    readonly sharedPortDeclarations: Array<{
        hostId: string;
        ports: number[];
    }>;
    /** The last `bb.hosts.internal_DO_NOT_USE_setNextTunnels` config, or null. */
    readonly internal_DO_NOT_USE_nextTunnelConfig: InternalDoNotUsePluginNextTunnelConfig | null;
    /**
     * Replace what `bb.hosts.internal_DO_NOT_USE_nextTunnelStatuses` returns and call
     * every `internal_DO_NOT_USE_onNextTunnelStatusChange` listener.
     */
    internal_DO_NOT_USE_setNextTunnelStatuses(statuses: readonly InternalDoNotUsePluginHostNextTunnelStatus[]): void;
    /** Calls made through bb.hosts.experimental_client, after input validation. */
    readonly experimental_hostRpcCalls: readonly ExperimentalFakeHostRpcCall[];
    readonly pendingInteractions: readonly (PluginInteractionRequest & {
        id: string;
    })[];
}
/** Deterministic inputs that stand in for behavior normally driven by BB. */
interface FakePluginBehaviorDrivers {
    /** Deliver an unexpected host-worker exit to every registered client. */
    experimental_emitHostWorkerExit(hostId: string): Promise<void>;
    /** Deliver a host signal through its registered payload schema. */
    experimental_emitHostSignal(hostId: string, signal: string, payload: unknown): Promise<void>;
    submitInteraction(id: string, value: JsonValue$2): void;
    cancelInteraction(id: string): void;
    /**
     * Apply a settings update the way the host's settings save does:
     * validate against the declared descriptors (`null` unsets), store, and
     * fire `onChange` listeners when effective values changed. Throws on
     * unknown keys or wrong value types.
     */
    setSettings(values: Record<string, PluginSettingValue$1 | null>): Promise<void>;
    /**
     * Invoke a registered rpc method with host semantics: input/output schemas,
     * strict JSON result normalization, and structured failure codes. Rejects
     * with the same message/code/issues the frontend client surfaces. The
     * handler sees `options.experimental_caller` as its caller, `{ kind:
     * "client" }` by default; pass `{ kind: "plugin", pluginId }` to act as
     * another plugin calling through `bb.sdk.plugins.callRpc`.
     */
    callRpc(method: string, input?: unknown, options?: {
        experimental_caller?: ExperimentalPluginRpcCaller;
    }): Promise<unknown>;
    /**
     * Start a client watch of one read, as the first client of a watched read
     * does: runs the method's `experimental_whileWatched` producer. The returned
     * function ends the watch and aborts the producer's signal; disposing the
     * plugin aborts every watch still running.
     */
    experimental_watchRpc(method: string, read: {
        input: JsonValue$2;
    } | {
        key: string;
    }): () => void;
    /**
     * Invoke the plugin's CLI command with host semantics: the result's
     * exitCode must be a number, stdout/stderr default to "", and a throwing
     * run() becomes `{ exitCode: 1, stderr: "bb <name> failed: …" }`.
     */
    runCli(argv: string[], ctx?: PluginCliContext): Promise<PluginCliExecutionResult>;
    /**
     * Dispatch a request to a registered `bb.http` route (exact method+path
     * match, like the host's V1 router) through a real Hono context. Auth
     * modes are not enforced. A throwing handler yields the host's 500
     * `{ ok: false, error: "plugin route failed: …" }` response.
     */
    fetchHttp(method: string, path: string, init?: RequestInit): Promise<Response>;
    /** Open and drive an exact-match `bb.http.experimental_websocket` route. */
    experimental_openWebSocket(path: string, init?: RequestInit): Promise<ExperimentalFakeWebSocketSession>;
    /**
     * Start a registered background service once, deterministically. `done`
     * settles when `start` returns; abort `controller` to signal shutdown.
     * A thrown NeedsConfigurationError (matched by name, like the host) is
     * recorded via needsConfiguration and resolves `done`; other errors
     * reject it.
     */
    runService(name: string): {
        controller: AbortController;
        done: Promise<void>;
    };
    /** Run a registered schedule's function once (no timers, no cron sweep). */
    runSchedule(name: string): Promise<void>;
    /**
     * Deliver a thread lifecycle event to every `bb.events.on` handler. Handlers run
     * sequentially; errors are caught and logged like the host's
     * fire-and-forget dispatch, and returned for assertions.
     */
    emitThreadEvent<E extends PluginThreadEventName>(event: E, payload: PluginThreadEventPayloads[E]): Promise<{
        errors: unknown[];
    }>;
    /**
     * Call a registered agent tool the way a provider tool-call would:
     * arguments go through the tool's parse step (zod-validated for zod
     * registrations; a parse failure throws), then execute. `ctx` fields
     * default to "thread-test"/"project-test" and a fresh signal.
     */
    callAgentTool(name: string, input: unknown, ctx?: Partial<PluginAgentToolContext>): Promise<PluginAgentToolResult>;
    /** Evaluate `bb.agents.configure` with production validation/fail-closed
     * semantics. With no callback, every registered tool/declared test skill is
     * selected. The callback receives a copy of `context` whose `pluginMetadata`
     * is a validated, deep-frozen clone; invalid metadata rejects instead of
     * reaching the callback. Callback failures are logged and return empty
     * selections. */
    resolveAgentConfiguration(context: PluginAgentConfigurationContext): Promise<{
        tools: FakeAgentToolRecord[];
        skills: string[];
        instructions: string | null;
    }>;
    resolveProviderEnv(providerId: string, context: ExperimentalPluginProviderEnvContext): Promise<ExperimentalPluginProviderEnvEntry[]>;
    resolveProviderEnvHealth(providerId: string, context: ExperimentalPluginProviderEnvHealthContext): Promise<ExperimentalPluginProviderEnvHealth | null>;
}
/** Reload/shutdown controls, kept separate from behavior and inspection. */
interface FakePluginLifecycleControls {
    /**
     * Load a replacement against the same persisted settings, kv, and database.
     * The current host remains live when the factory throws; on success its
     * services/hooks are disposed and the returned host becomes current.
     */
    reload(factory: (bb: BbPluginApi) => void | Promise<void>): Promise<FakePluginHost>;
    /**
     * Dispose like a host reload/disable: abort services started via
     * runService, run onDispose hooks LIFO (isolated), close database handles,
     * then poison the `bb` handle (further use throws
     * PluginContextStaleError). Idempotent.
     */
    dispose(): Promise<void>;
    /**
     * Run every handler registered with `bb.onInstall`, in
     * registration order, as bb does right after a fresh install. A handler
     * that throws is logged at warn level and the rest still run.
     */
    install(): Promise<void>;
}
/**
 * Complete fake-host harness. Direct members are retained for compatibility;
 * the named views make intent explicit in new tests.
 */
interface FakePluginHarness extends FakePluginInspectionState, FakePluginBehaviorDrivers, FakePluginLifecycleControls {
    readonly behavior: FakePluginBehaviorDrivers;
    readonly inspection: FakePluginInspectionState;
    readonly lifecycle: FakePluginLifecycleControls;
}
interface CreateFakePluginHostOptions {
    machineBootstrap?: MachineBootstrapApi;
    machineResource?: (hostId: string) => Promise<JsonValue$2 | null>;
    /** Defaults to "test-plugin". */
    pluginId?: string;
    /** Answer for `bb.server.experimental_personCanSeeThread`. Defaults to always true. */
    personCanSeeThread?: (userId: string, threadId: string) => boolean | Promise<boolean>;
    /**
     * Value served by `bb.server.experimental_appUrl`. Defaults to `null`.
     */
    appUrl?: string | null;
    /**
     * Value served by `bb.server.loopbackBaseUrl` (always bound here, like
     * `bb.sdk`). Defaults to "http://127.0.0.1:38886".
     */
    loopbackBaseUrl?: string;
    /**
     * Value served by `bb.server.experimental_dataDir`. Defaults to
     * "/tmp/bb-fake-data-dir".
     */
    dataDir?: string;
    /**
     * Pre-seeded stored settings values (as if saved before this load) —
     * including secret ones, which the fake keeps in memory instead of
     * files. Values with the wrong type for their descriptor fall back to
     * the descriptor default on read, like the host.
     */
    settings?: Record<string, PluginSettingValue$1>;
    /** Initial `bb.sdk` stubs; extend later via `harness.sdk.stub`. */
    sdk?: FakeSdkOverrides;
    /** Static manifest skill ids available to configure() in this fake host. */
    agentSkillIds?: readonly string[];
    /** Read-only identities returned by bb.hosts.ensureSharedPortTunnel. */
    sharedPortTunnelIdentities?: Record<string, PluginSharedPortTunnelIdentity>;
    /**
     * Whether the plugin's manifest declares a `bb.host` entry. Production
     * refuses `bb.providers.register` without one (the provider would have no
     * bridge to run on); the fake applies the same rule. Defaults to true.
     */
    experimental_hostEntry?: boolean;
    /**
     * The icon names the plugin's manifest declares under
     * `bb.branding.experimental_icons`. Production refuses a provider `icon`
     * or a tool `presentation.icon.glyph` that is a namespaced glyph
     * (`"<pluginId>/<name>"`) naming another plugin or a name not declared
     * there; the fake applies the same rule against this list. Defaults to
     * none declared, so every namespaced glyph is refused until the test
     * names the icons the manifest would.
     */
    experimental_declaredIconNames?: readonly string[];
    /**
     * Stand-in for the other plugins' provider environment contributions
     * `bb.providers.internal_DO_NOT_USE_resolveAiTaskEnv` resolves. Defaults to
     * none.
     */
    internal_DO_NOT_USE_aiTaskEnv?: (args: {
        providerId: string;
        context: ExperimentalPluginProviderEnvContext;
    }) => readonly ExperimentalPluginProviderEnvEntry[] | Promise<readonly ExperimentalPluginProviderEnvEntry[]>;
    /** Deterministic stand-in for the targeted daemon host entry. */
    experimental_callHostRpc?: (call: ExperimentalFakeHostRpcCall) => unknown | Promise<unknown>;
}
interface FakePluginHost {
    bb: BbPluginApi;
    harness: FakePluginHarness;
}
declare function createFakePluginHost(options?: CreateFakePluginHostOptions): FakePluginHost;

type HostResponse = Awaited<ReturnType<BbPluginApi["sdk"]["hosts"]["list"]>>[number];
type ThreadResponse = PluginThreadEventPayloads["thread.created"]["thread"];
type QueueEntry = PluginThreadEventPayloads["message.queued"]["entry"];
type TurnFailedEvent = PluginThreadEventPayloads["turn.failed"];
type PluginAgentConfigurationContextOverrides = {
    pluginMetadata?: PluginAgentConfigurationContext["pluginMetadata"];
    thread?: Partial<PluginAgentConfigurationContext["thread"]>;
    project?: Partial<PluginAgentConfigurationContext["project"]>;
    environment?: Partial<PluginAgentConfigurationContext["environment"]>;
    host?: Partial<PluginAgentConfigurationContext["host"]>;
    provider?: Omit<Partial<PluginAgentConfigurationContext["provider"]>, "capabilities"> & {
        capabilities?: Partial<PluginAgentConfigurationContext["provider"]["capabilities"]>;
    };
    origin?: Partial<PluginAgentConfigurationContext["origin"]>;
};
type MessageDispatchHookContextOverrides = Omit<Partial<MessageDispatchHookContext>, "environment" | "executionSources" | "host" | "input" | "project" | "queuedMessages" | "requestedExecution" | "thread"> & {
    thread?: Partial<MessageDispatchHookContext["thread"]>;
    project?: Partial<MessageDispatchHookContext["project"]>;
    environment?: Partial<NonNullable<MessageDispatchHookContext["environment"]>> | null;
    host?: Partial<NonNullable<MessageDispatchHookContext["host"]>> | null;
    input?: Partial<MessageDispatchHookContext["input"]>;
    requestedExecution?: Partial<MessageDispatchHookContext["requestedExecution"]>;
    executionSources?: Partial<MessageDispatchHookContext["executionSources"]>;
    queuedMessages?: Partial<MessageDispatchHookContext["queuedMessages"][number]>[];
};
/**
 * A complete, deterministic host response for faking `bb.sdk.hosts.list()`
 * and environment-provider contexts. Override only the fields the test cares
 * about. If the contract grows a required field, this builder fails
 * typecheck — update the default here.
 */
declare function makeHostResponse(overrides?: Partial<HostResponse>): HostResponse;
/**
 * A complete, deterministic `ThreadResponse` for thread lifecycle event
 * payloads (`harness.emitThreadEvent`). Defaults are the minimal idle
 * thread; override the fields the test cares about. If the contract grows a
 * required field, this builder fails typecheck — update the default here.
 */
declare function makeThreadResponse(overrides?: Partial<ThreadResponse>): ThreadResponse;
/**
 * A complete, deterministic context for conditional agent configuration.
 * Defaults describe a standard project on an unmanaged local environment;
 * override the fields the test cares about. If the contract grows a required
 * field, this builder fails typecheck — update the default here.
 */
declare function makePluginAgentConfigurationContext(overrides?: PluginAgentConfigurationContextOverrides): PluginAgentConfigurationContext;
/**
 * A complete, deterministic context for the `message.dispatch` hook. Defaults
 * describe a first inline dispatch before an environment or host is selected;
 * override the fields the test cares about. If the contract grows a required
 * field, this builder fails typecheck — update the default here.
 */
declare function makeMessageDispatchHookContext(overrides?: MessageDispatchHookContextOverrides): MessageDispatchHookContext;
/**
 * A complete, deterministic queued row for the `message.*` event payloads
 * and for faking `sdk.threads.queuedMessages.list`. Defaults are a live inline
 * row on this plugin's wait; override what the test is about. If the
 * contract grows a required field, this builder fails typecheck — update the
 * default here.
 */
declare function makeQueueEntry(overrides?: Partial<QueueEntry>): QueueEntry;
/**
 * A complete, deterministic `turn.failed` payload. Defaults are a first attempt
 * that failed inside a provider turn with neither structured error info nor
 * rate limits — the shape a retry policy must handle before it handles the
 * interesting ones. If the contract grows a required field, this builder fails
 * typecheck — update the default here.
 */
declare function makeTurnFailedEvent(overrides?: Partial<TurnFailedEvent>): TurnFailedEvent;

interface PublicSdkOnlyScanOptions {
    /**
     * Public packages the plugin depends on beyond the SDK (a config-file
     * parser, say), matched against the whole specifier. Plugin code and tests
     * alike may import them.
     */
    allow?: readonly RegExp[];
}
interface PublicSdkOnlyViolation {
    /** The importing file, relative to the package root. */
    file: string;
    /** The import specifier, or the argument text of a dynamic one. */
    specifier: string;
    reason: "dynamic-specifier" | "outside-allowlist" | "outside-package" | "private-package";
}
interface PublicSdkOnlyScan {
    /** Every source file scanned, relative to the package root, in walk order. */
    files: string[];
    violations: PublicSdkOnlyViolation[];
    /** `@core/*` names in the package.json dependencies and devDependencies. */
    privateDependencies: string[];
}
/**
 * Scan a plugin package for imports outside the public SDK. `packageRoot`
 * is the directory holding its package.json; every `.ts`/`.tsx`/`.js`
 * file below it except `node_modules` and `dist` is read.
 */
declare function scanPublicSdkOnly(packageRoot: string, options?: PublicSdkOnlyScanOptions): PublicSdkOnlyScan;

export { PluginContextStaleError, createFakePluginHost, createFakeSdk, scanPublicSdkOnly as experimental_scanPublicSdkOnly, makeHostResponse, makeMessageDispatchHookContext, makePluginAgentConfigurationContext, makeQueueEntry, makeThreadResponse, makeTurnFailedEvent };
export type { CreateFakePluginHostOptions, ExperimentalFakeHostRpcCall, FakeAgentToolRecord, FakeCliRecord, FakeHttpRouteRecord, FakeLogEntry, FakeLogLevel, FakeMentionProviderRecord, FakePluginBehaviorDrivers, FakePluginHarness, FakePluginHost, FakePluginInspectionState, FakePluginLifecycleControls, FakePluginRegistrations, FakeRealtimeSignal, FakeScheduleRecord, FakeSdkCall, FakeSdkHarness, FakeSdkOverrides, FakeServiceRecord, InternalDoNotUseFakeTunnelIngress, PublicSdkOnlyScan, PublicSdkOnlyScanOptions, PublicSdkOnlyViolation };
