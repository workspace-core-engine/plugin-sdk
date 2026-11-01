// Portable type declarations for `@workspace-core/plugin-sdk`. Unpublished BB
// workspace contracts are flattened; public subpaths may reuse the
// package root without requiring any other @core/* package.
//
// Confused by the API, or need a symbol that isn't here? Clone the BB repo
// and read the real source: https://github.com/get-bb/bb

import { z } from 'zod';
import { StandardSchemaV1 as StandardSchemaV1$1, PluginEnvironmentProviderRequirements as PluginEnvironmentProviderRequirements$1, StandardSchemaV1InferOutput as StandardSchemaV1InferOutput$1, PluginEnvironmentValidateDecision, JsonValue as JsonValue$2, PluginMachineValidateDecision } from '@workspace-core/plugin-sdk';
import Database from 'better-sqlite3';

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

declare const reasoningLevelSchema: z.ZodString;
type ReasoningLevel = z.infer<typeof reasoningLevelSchema>;
declare const serviceTierSchema: z.ZodString;
type ServiceTier = z.infer<typeof serviceTierSchema>;
declare const permissionModeSchema: z.ZodEnum<{
    "accept-edits": "accept-edits";
    auto: "auto";
    full: "full";
}>;
type PermissionMode = z.infer<typeof permissionModeSchema>;
declare const promptInputSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    mentions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        end: z.ZodNumber;
        resource: z.ZodPreprocess<z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"thread">;
            label: z.ZodString;
            projectId: z.ZodOptional<z.ZodString>;
            threadId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"project">;
            label: z.ZodString;
            projectId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"section">;
            label: z.ZodString;
            sectionId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            entryKind: z.ZodEnum<{
                directory: "directory";
                file: "file";
            }>;
            kind: z.ZodLiteral<"path">;
            label: z.ZodString;
            path: z.ZodString;
            source: z.ZodEnum<{
                "thread-storage": "thread-storage";
                workspace: "workspace";
            }>;
        }, z.core.$strip>, z.ZodObject<{
            argumentHint: z.ZodNullable<z.ZodString>;
            kind: z.ZodLiteral<"command">;
            label: z.ZodString;
            name: z.ZodString;
            origin: z.ZodEnum<{
                builtin: "builtin";
                project: "project";
                user: "user";
            }>;
            source: z.ZodEnum<{
                command: "command";
                skill: "skill";
            }>;
            trigger: z.ZodEnum<{
                "/": "/";
                $: "$";
            }>;
        }, z.core.$strip>, z.ZodObject<{
            icon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            itemId: z.ZodString;
            kind: z.ZodLiteral<"plugin">;
            label: z.ZodString;
            pluginId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"attachment">;
            label: z.ZodString;
            path: z.ZodString;
        }, z.core.$strip>], "kind">, unknown>;
        start: z.ZodNumber;
    }, z.core.$strip>>>;
    text: z.ZodString;
    type: z.ZodLiteral<"text">;
    visibility: z.ZodOptional<z.ZodEnum<{
        "agent-only": "agent-only";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"image">;
    url: z.ZodString;
    visibility: z.ZodOptional<z.ZodEnum<{
        "agent-only": "agent-only";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    hostId: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
    sourceProjectId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"localImage">;
    visibility: z.ZodOptional<z.ZodEnum<{
        "agent-only": "agent-only";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    hostId: z.ZodOptional<z.ZodString>;
    mimeType: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
    sizeBytes: z.ZodOptional<z.ZodNumber>;
    sourceProjectId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"localFile">;
    visibility: z.ZodOptional<z.ZodEnum<{
        "agent-only": "agent-only";
    }>>;
}, z.core.$strip>], "type">;
type PromptInput = z.infer<typeof promptInputSchema>;
declare const callerExecutionInputSourceSchema: z.ZodEnum<{
    "client-preference": "client-preference";
    explicit: "explicit";
}>;
type CallerExecutionInputSource = z.infer<typeof callerExecutionInputSourceSchema>;

declare const PROVIDER_FORK_VALUES: readonly ["none", "tip", "checkpoint"];
type ProviderFork = (typeof PROVIDER_FORK_VALUES)[number];

declare const threadTurnInitiatorSchema: z.ZodEnum<{
    agent: "agent";
    system: "system";
    user: "user";
}>;
type ThreadTurnInitiator = z.infer<typeof threadTurnInitiatorSchema>;

declare const threadCreateOriginSchema: z.ZodEnum<{
    app: "app";
    cli: "cli";
    plugin: "plugin";
    sdk: "sdk";
}>;
type ThreadCreateOrigin = z.infer<typeof threadCreateOriginSchema>;

declare const threadQueuedMessageSchema: z.ZodObject<{
    content: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        mentions: z.ZodDefault<z.ZodArray<z.ZodObject<{
            end: z.ZodNumber;
            resource: z.ZodPreprocess<z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"thread">;
                label: z.ZodString;
                projectId: z.ZodOptional<z.ZodString>;
                threadId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"project">;
                label: z.ZodString;
                projectId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"section">;
                label: z.ZodString;
                sectionId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                entryKind: z.ZodEnum<{
                    directory: "directory";
                    file: "file";
                }>;
                kind: z.ZodLiteral<"path">;
                label: z.ZodString;
                path: z.ZodString;
                source: z.ZodEnum<{
                    "thread-storage": "thread-storage";
                    workspace: "workspace";
                }>;
            }, z.core.$strip>, z.ZodObject<{
                argumentHint: z.ZodNullable<z.ZodString>;
                kind: z.ZodLiteral<"command">;
                label: z.ZodString;
                name: z.ZodString;
                origin: z.ZodEnum<{
                    builtin: "builtin";
                    project: "project";
                    user: "user";
                }>;
                source: z.ZodEnum<{
                    command: "command";
                    skill: "skill";
                }>;
                trigger: z.ZodEnum<{
                    "/": "/";
                    $: "$";
                }>;
            }, z.core.$strip>, z.ZodObject<{
                icon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                itemId: z.ZodString;
                kind: z.ZodLiteral<"plugin">;
                label: z.ZodString;
                pluginId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"attachment">;
                label: z.ZodString;
                path: z.ZodString;
            }, z.core.$strip>], "kind">, unknown>;
            start: z.ZodNumber;
        }, z.core.$strip>>>;
        text: z.ZodString;
        type: z.ZodLiteral<"text">;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"image">;
        url: z.ZodString;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        hostId: z.ZodOptional<z.ZodString>;
        path: z.ZodString;
        sourceProjectId: z.ZodOptional<z.ZodString>;
        type: z.ZodLiteral<"localImage">;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        hostId: z.ZodOptional<z.ZodString>;
        mimeType: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        path: z.ZodString;
        sizeBytes: z.ZodOptional<z.ZodNumber>;
        sourceProjectId: z.ZodOptional<z.ZodString>;
        type: z.ZodLiteral<"localFile">;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>], "type">>;
    createdAt: z.ZodNumber;
    editable: z.ZodBoolean;
    failureReason: z.ZodNullable<z.ZodString>;
    groupWithNext: z.ZodBoolean;
    id: z.ZodString;
    initiator: z.ZodEnum<{
        agent: "agent";
        system: "system";
        user: "user";
    }>;
    model: z.ZodString;
    origin: z.ZodNullable<z.ZodEnum<{
        app: "app";
        cli: "cli";
        plugin: "plugin";
        sdk: "sdk";
    }>>;
    originPluginId: z.ZodNullable<z.ZodString>;
    payload: z.ZodDiscriminatedUnion<[z.ZodObject<{
        kind: z.ZodLiteral<"inline">;
    }, z.core.$strip>, z.ZodObject<{
        attempt: z.ZodNumber;
        kind: z.ZodLiteral<"retry">;
        reason: z.ZodString;
        retryOfTurnRequestId: z.ZodString;
    }, z.core.$strip>], "kind">;
    permissionMode: z.ZodEnum<{
        "accept-edits": "accept-edits";
        auto: "auto";
        full: "full";
    }>;
    reasoningLevel: z.ZodString;
    sendAt: z.ZodNullable<z.ZodNumber>;
    senderThreadId: z.ZodNullable<z.ZodString>;
    serviceTier: z.ZodString;
    state: z.ZodEnum<{
        claimed: "claimed";
        failed_exhausted: "failed_exhausted";
        failed_retrying: "failed_retrying";
        queued: "queued";
        scheduled: "scheduled";
        waiting: "waiting";
    }>;
    threadId: z.ZodString;
    updatedAt: z.ZodNumber;
    waitingOn: z.ZodNullable<z.ZodDiscriminatedUnion<[z.ZodObject<{
        kind: z.ZodLiteral<"time">;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"thread-busy">;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"stopping">;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"turn-starting">;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"provisioning">;
    }, z.core.$strip>, z.ZodObject<{
        hostName: z.ZodString;
        kind: z.ZodLiteral<"host-offline">;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"interaction">;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"plugin">;
        pluginId: z.ZodString;
        reason: z.ZodString;
    }, z.core.$strip>], "kind">>;
}, z.core.$strip>;
type ThreadQueuedMessage = z.infer<typeof threadQueuedMessageSchema>;

interface ContractTagDeclarations<Input, Output> {
    tags?(input: Input, output: Output): readonly string[];
    keyTags?(key: string, value: Output extends Readonly<Record<string, infer Value>> ? Value : unknown): readonly string[];
    invalidates?(input: Input, output: Output): readonly string[];
}

type ExecutionInputFieldSource = CallerExecutionInputSource;
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
type ThreadResponse = z.infer<typeof threadResponseSchema>;

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
type InputsValue$1<S> = S extends StandardSchemaV1$1 ? StandardSchemaV1InferOutput$1<S> : null;
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
    inputs: InputsValue$1<S>;
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
    thread: ThreadResponse;
    suggestedBranchName: string;
    attempt: number;
    pathKey: string;
    experimental_claimPath(path: string): Promise<boolean>;
    report: PluginEnvironmentProviderProgress;
    signal: AbortSignal;
}
/** Rebuilds a thread's destroyed environment; `inputs` are the ones it was created with. */
interface PluginEnvironmentProviderRestoreContext<R extends PluginEnvironmentProviderRequirements$1 = PluginEnvironmentProviderRequirements$1, S extends PluginEnvironmentProviderInputsSchema = PluginEnvironmentProviderInputsSchema> extends PluginEnvironmentProviderValidateContext<R, S> {
    thread: ThreadResponse;
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
    experimental_existingPath?(inputs: InputsValue$1<S>): string | null;
    create(context: PluginEnvironmentProviderCreateContext<R, S>): Promise<PluginEnvironmentProviderCreateResult>;
    /** Experimental: rebuild a destroyed environment when its thread asks for it back. Without it, core never rebuilds this provider's destroyed environments: see docs/api_to_audit.md. */
    restore?(context: PluginEnvironmentProviderRestoreContext<R, S>): Promise<PluginEnvironmentProviderCreateResult>;
    remove(context: PluginEnvironmentProviderRemoveContext): Promise<PluginEnvironmentProviderRemoveResult>;
}

declare const RESERVED_CORE_CLI_COMMANDS: readonly string[];

type PluginMachineProviderResource = Exclude<JsonValue$2, null>;
type PluginMachineProviderInputsSchema = StandardSchemaV1$1 | undefined;
type InputsValue<S> = S extends StandardSchemaV1$1 ? StandardSchemaV1InferOutput$1<S> : null;
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
    inputs: InputsValue<S>;
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

/**
 * A value that survives a JSON round trip without coercion or data loss.
 *
 * Host boundaries still validate values at runtime because TypeScript cannot
 * exclude non-finite numbers and plugin bundles can bypass static types.
 */
type JsonValue = string | number | boolean | null | JsonValue[] | {
    [key: string]: JsonValue;
};

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
/**
 * Who invoked an rpc method. `plugin` means another loaded plugin (or this
 * one) called through its own `bb.sdk.plugins.callRpc`; the host verifies
 * that with a per-load token only the server knows. Every other caller — the
 * app, the `bb` CLI, agents, and bb itself — is `client`.
 */
type ExperimentalPluginRpcCallerUser = {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly role: "admin" | "member" | "owner" | "viewer";
    /** Projects this person may see when the workspace restricts members to granted projects; absent means every project. Personal is always visible. */
    readonly projectIds?: readonly string[];
    /** The same restriction with each granted project's level: "read" sees, "write" may also change. Absent means write on every project. */
    readonly projectAccess?: {
        readonly [projectId: string]: "read" | "write";
    };
};
type ExperimentalPluginRpcCaller = {
    readonly kind: "plugin";
    readonly pluginId: string;
} | {
    readonly kind: "client";
    readonly experimental_user?: ExperimentalPluginRpcCallerUser;
};
/** Second argument of every rpc handler. */
interface ExperimentalPluginRpcHandlerContext {
    readonly experimental_caller: ExperimentalPluginRpcCaller;
}

type PluginSettingDescriptor = {
    type: "string";
    label: string;
    description?: string;
    /** Stored in a 0600 file under <dataDir>/plugins/<id>/secrets/, never in the db or sent to the frontend. */
    secret?: true;
    /**
     * Render as a multi-line text field; for JSON or lists. Secrets cannot
     * be multi-line.
     */
    experimental_multiline?: boolean;
    /** Synchronously validate without transforming a proposed value. */
    experimental_schema?: StandardSchemaV1<string, string>;
    default?: string;
} | {
    type: "boolean";
    label: string;
    description?: string;
    /** Synchronously validate without transforming a proposed value. */
    experimental_schema?: StandardSchemaV1<boolean, boolean>;
    default?: boolean;
} | {
    type: "number";
    label: string;
    description?: string;
    experimental_schema?: StandardSchemaV1<number, number>;
    default?: number;
} | {
    type: "select";
    label: string;
    description?: string;
    options: string[];
    /** Display labels keyed by option value; options without one show the value itself. */
    experimental_optionLabels?: Record<string, string>;
    /** Synchronously validate without transforming a proposed value. */
    experimental_schema?: StandardSchemaV1<string, string>;
    default?: string;
} | {
    type: "project";
    label: string;
    description?: string;
    /** Synchronously validate without transforming a proposed value. */
    experimental_schema?: StandardSchemaV1<string, string>;
    default?: string;
};
type PluginSettingDescriptors = Record<string, PluginSettingDescriptor>;
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
 * Where a thread is going to run, as far as core knows at the checkpoint.
 * Before provisioning attaches an environment this is the start intent the
 * thread was created with; afterwards it is the environment itself.
 */
type PluginDispatchEnvironmentIntent = {
    kind: "environment";
    environmentId: string;
}
/** Ask a registered environment provider for the environment. */
 | {
    kind: "provider";
    environmentProviderId: string;
    machine: {
        type: "existing";
        hostId: string;
    } | {
        type: "new";
        machineProviderId: string;
        inputs: JsonValue | null;
    };
    inputs: JsonValue | null;
};
/**
 * What a `message.dispatch` hook answers.
 *
 * `proceed` lets the attempt continue. `wait` QUEUES the message as a row
 * whose `waitingOn` names this plugin and carries `reason` verbatim; the
 * row stays queued until `sendAt` comes due, capacity frees, the user sends
 * it now, or the orphan sweep clears it because this plugin is no longer
 * running. `sendAt` (epoch ms) sets the row's own `sendAt`, so core's due sweep
 * re-attempts at that instant without the plugin holding a timer of its own —
 * which is what a rate-limit window wants. `reject` refuses the attempt
 * outright: `message` is shown to the user verbatim.
 *
 * There is deliberately no "handled it myself" answer and no amendment arm —
 * a hook is a decision, never an owner or an author of the work.
 */
type MessageDispatchHookDecision = {
    action: "proceed";
} | {
    action: "wait";
    reason: string;
    sendAt?: number | null;
} | {
    action: "reject";
    message: string;
};
/**
 * The execution tuple as core resolved it before this hook ran. `model` and
 * the three option fields are null only when no default has been resolved for
 * them yet; `providerId` is always resolved.
 */
interface PluginDispatchExecution {
    providerId: string;
    model: string | null;
    reasoningLevel: ReasoningLevel | null;
    serviceTier: ServiceTier | null;
    permissionMode: PermissionMode | null;
}
/**
 * Where each execution value came from. `explicit` is a user choice,
 * `client-preference` a remembered client default, and null means core
 * resolved it from project/provider defaults. A hook that must not act against
 * a deliberate choice checks for `explicit` here.
 */
interface PluginDispatchExecutionSources {
    providerId: ExecutionInputFieldSource | null;
    model: ExecutionInputFieldSource | null;
    reasoningLevel: ExecutionInputFieldSource | null;
    serviceTier: ExecutionInputFieldSource | null;
    permissionMode: ExecutionInputFieldSource | null;
}
/**
 * The prompt this dispatch carries. `blocks` is the message itself; `text` is
 * the concatenated text of its text blocks, which is what a rules-based hook
 * actually wants to match on.
 */
interface PluginDispatchInput {
    blocks: readonly PromptInput[];
    text: string;
}
/**
 * How this attempt would reach the provider.
 *
 * `start-turn` is a dispatch that begins a turn: a thread's first message, a
 * plain send to an idle or `pending` thread, or a steer-mode message that
 * found no running turn to join. `join-turn` is an injection into a turn that
 * is already executing.
 *
 * Decision powers are identical for both — a steer is hooked exactly like a
 * send, uniformly. A hook that limits concurrency proceeds on `join-turn`: the
 * thread already holds its slot, so joining it asks for nothing new.
 */
type PluginDispatchAttemptKind = "join-turn" | "start-turn";
/**
 * What core hands a `message.dispatch` hook: the one checkpoint, run before a
 * message reaches a provider. The exception is a user's explicit Send-now on a
 * queued row, which bypasses the pass by design — it is the user overriding
 * policy, and a policy that could veto its own override would not be one.
 *
 * It runs identically whether the attempt is inline (someone just sent) or
 * from a drain (a queued row became eligible again), and whether the message
 * is a thread's first, a follow-up, a steer, or a retry of a failed turn. A
 * handler must therefore be idempotent for one logical dispatch: passes re-run
 * on every drain, on restart, and on retry.
 */
interface MessageDispatchHookContext {
    /**
     * The target thread. Never null: thread creation is unhooked — it is a cheap
     * row — so by the time the first message is decided about, the thread exists
     * in `pending`, with its provider resolved and nothing provisioned.
     */
    thread: ThreadResponse;
    project: Project;
    /** Null until an environment is chosen (a queued or not-yet-provisioned thread). */
    environment: Environment | null;
    /**
     * The machine the work will run on. Resolved from the environment when one
     * is attached, and before that from the start intent the thread was created
     * with — so a per-host policy counts a cold start against the pool it is
     * about to occupy. Null only when neither names a machine.
     */
    host: Host | null;
    /**
     * What kind of environment the thread will run in, so a policy can tell a
     * worktree on this machine from a cloud sandbox from an attached directory
     * before any of them exists. Null only for a thread with neither an
     * environment nor a start intent.
     */
    environmentIntent: PluginDispatchEnvironmentIntent | null;
    input: PluginDispatchInput;
    requestedExecution: PluginDispatchExecution;
    /** Where each execution value came from. */
    executionSources: PluginDispatchExecutionSources;
    /** Whether this attempt starts a turn or joins a running one. */
    attempt: PluginDispatchAttemptKind;
    /**
     * The author category shared by this dispatch's messages: `user`, `agent`,
     * or `system`. `mixed` means the queued messages have different categories.
     * Different agents still share the `agent` category; read `queuedMessages`
     * for each message's author. `mixed` is a hook summary, not a turn initiator.
     */
    initiator: ThreadTurnInitiator | "mixed";
    /**
     * The thread that sent every message in this dispatch: a thread id, null
     * when none of them has a sender, or the literal `"mixed"` when the rows
     * disagree. A thread-start names its requesting thread; a message a human
     * typed and a core-driven retry have no sender. Null therefore still means
     * "nobody sent this" rather than "bb could not tell", so a handler may key
     * a human-versus-agent policy on it; `queuedMessages` names each row's own
     * sender. Thread ids are prefixed, so no id collides with `"mixed"`.
     */
    senderThreadId: string | "mixed" | null;
    /**
     * All queued rows this attempt is re-trying, in dispatch order. Empty for
     * an inline attempt. Each row retains its own content, author, and origin; `input`
     * contains their combined input, and the hook decides for the whole group.
     *
     * This is how a hook tells a fresh send from a re-attempt of something it
     * already decided about — the replacement for the old
     * `isReleaseReevaluation`/`hold` pair. A hook that counts in-flight work
     * should treat the two identically; a hook that logs should not
     * double-count.
     */
    queuedMessages: ThreadQueuedMessage[];
    /**
     * Opaque JSON supplied by a plugin through the composer's
     * `submit`, paired with that plugin's id. Null for ordinary
     * submissions and queued re-attempts. Core does not persist or interpret
     * the data.
     */
    experimental_submission: {
        pluginId: string;
        data: JsonValue;
    } | null;
    /**
     * How the dispatch was requested; null for internal/core-driven sends, which
     * includes every follow-up, steer and retry. Persisted with the queued row,
     * so a drained re-attempt reads what its first attempt read. For a grouped
     * dispatch, each field is its shared value or `"mixed"` when rows differ,
     * including a value versus null. Each queued row exposes its own origin.
     */
    origin: ThreadCreateOrigin | "mixed" | null;
    originPluginId: string | "mixed" | null;
    parentThreadId: string | null;
}
/**
 * The hooks a plugin can answer, each mapping its key to the context core
 * hands the handler and the decision core acts on. `on()` and the handler type
 * derive from this map — and so does the server's hook registry — so a
 * half-added hook does not compile.
 *
 * One hook today: `message.dispatch`, THE admission checkpoint, run identically
 * for a thread's first message, a follow-up, a steer, a retry, and every
 * re-attempt a drain makes. It replaced the earlier `thread.create` +
 * `turn.submit` pair, whose split was an accident of where the code happened to
 * branch rather than a difference a plugin needed to see — the attempt's own
 * `attempt` kind carries what actually differs.
 */
interface PluginHookSignatures {
    "message.dispatch": {
        context: MessageDispatchHookContext;
        decision: MessageDispatchHookDecision;
    };
}
type PluginHookName = keyof PluginHookSignatures;
type PluginHookHandler<K extends PluginHookName> = (context: PluginHookSignatures[K]["context"]) => PluginHookSignatures[K]["decision"] | Promise<PluginHookSignatures[K]["decision"]>;
/**
 * Who may call a plugin HTTP route. "local": the app and loopback callers.
 * "token": callers presenting the plugin's HTTP token. "none": no core
 * check; hosts that gate their API (multi-user servers) still admit only
 * local callers. "experimental_public": no core check from anywhere, including
 * gated multi-user servers; the handler must authenticate every request itself.
 * WebSocket routes do not accept "experimental_public".
 */
type PluginHttpAuthMode = "experimental_public" | "local" | "none" | "token";
interface PluginCliCommandInfo {
    name: string;
    summary: string;
    usage: string;
}
/** Context forwarded from the invoking CLI when known; all fields optional. */
interface PluginCliContext {
    cwd?: string;
    /** On ix servers, a call authenticated by a chat's scoped token always carries that chat's id here, whatever the CLI sent. */
    threadId?: string;
    projectId?: string;
    /** Person the call acts as on ix multi-user servers: the chat's acting person for a scoped token, else the signed-in member. Absent for owner-level callers (owner token, loopback owner, auth off). */
    experimental_user?: ExperimentalPluginRpcCallerUser;
    /** Aborted when the invoking CLI HTTP request disconnects. */
    signal?: AbortSignal;
}
/**
 * What a submitted form leaves in the thread timeline, chosen by the plugin.
 * bb never stores the form's payload or the submitted value; it stores only
 * this description, so a plugin decides what the transcript keeps.
 */
interface PluginInteractionDescription {
    /** Row title once submitted; defaults to the presentation's completed label. */
    title?: string;
    /** Short Markdown for the expanded row. */
    detail?: string;
    /**
     * Persisted with the row and handed to this plugin's
     * `experimental_timelineRenderer` registered for `"<pluginId>/<rendererId>"`.
     * Omit anything the transcript must not keep.
     */
    payload?: JsonValue;
}
interface PluginInteractionRequest {
    threadId: string;
    rendererId: string;
    title: string;
    payload: JsonValue;
    /** Defaults to ten minutes; capped at seven days. */
    timeoutMs?: number;
    /**
     * How the form reads as a timeline row while it waits and once it settles,
     * in the same shape as a native tool's presentation. bb fills what is left
     * out: "Waiting for <title>" / "Submitted <title>" and the plugin's glyph.
     */
    presentation?: PluginRowPresentation;
    /**
     * Called once with the submitted value, before the waiting `requestInput`
     * promise resolves; never for a cancellation, which bb titles itself. Its
     * return is persisted on the row. A throw or a slow return leaves the row
     * with its completed label and nothing more.
     */
    describeSubmission?(value: JsonValue): PluginInteractionDescription | Promise<PluginInteractionDescription>;
}
interface PluginCliResult {
    exitCode: number;
    stdout?: string;
    stderr?: string;
}
interface PluginCliOutputLimitError {
    code: "plugin_cli_output_too_large";
    message: string;
    maxBytes: number;
    stdoutBytes: number;
    stderrBytes: number;
    totalBytes: number;
}
/** Normalized host result returned by the plugin CLI HTTP/testing boundary. */
interface PluginCliExecutionResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    error?: PluginCliOutputLimitError;
}
interface PluginCliRegistration {
    /** Preferred top-level command name (`bb <name> …`): lowercase [a-z0-9-]+.
     * A core collision logs an activation warning and remains available through
     * `bb plugin run <plugin-id>`. */
    name: string;
    summary: string;
    /** Subcommand metadata rendered in help and the plugin-commands skill
     * without executing plugin code. Parsing argv is plugin-owned. */
    commands?: PluginCliCommandInfo[];
    /**
     * Set when `run` answers `--help` / `-h` itself, at every level, without
     * executing a command. The `bb` CLI then forwards help requests to the
     * plugin instead of printing the one-line `usage` from `commands`.
     * `defineCli` sets it. Leave it unset for a hand-written `run`:
     * the host cannot know that such a parser will not act on the other
     * arguments.
     */
    rendersHelp?: boolean;
    run(argv: string[], ctx: PluginCliContext): PluginCliResult | Promise<PluginCliResult>;
}
/** Per-turn context handed to bb.agents context providers (design §4.4). */
/** MCP-style content parts a native tool may return (design §4.4). */
type PluginAgentToolContentPart = {
    type: "text";
    text: string;
} | {
    type: "image";
    data: string;
    mimeType: string;
};
type PluginAgentToolResult = string | {
    content: PluginAgentToolContentPart[];
    isError?: boolean;
};
/** Per-call context handed to a native tool's execute (design §4.4). */
interface PluginAgentToolContext {
    threadId: string;
    projectId: string;
    /** Signed-in person who owns the thread (ix multi-user servers); absent for threads started by the CLI, loopback or automation. */
    experimental_user?: ExperimentalPluginRpcCallerUser;
    /**
     * Aborts when the tool-call request is cancelled, the thread is stopped or
     * deleted, or this plugin is disposed. Opening a form with `bb.ui.requestInput`
     * detaches the call from its request: the agent receives a waiting notice,
     * and request cancellation no longer aborts this signal. The tool's eventual
     * result is delivered as a system message (success steers a running turn or
     * starts a new one; an `isError` result only steers). Thread stop/delete and
     * plugin disposal still abort the signal after detachment.
     */
    signal: AbortSignal;
}
/**
 * The title of a plugin-owned timeline row while it is pending and once it
 * settled. Each label is capped at 80 characters and rendered as plain text.
 */
interface PluginRowLabels {
    /** Label shown while the row is pending. */
    pending: string;
    /** Label shown after the row completes successfully. */
    completed: string;
}
/**
 * How something a plugin owns reads as a timeline row (grammar v3): a native
 * tool's calls, or the row a `bb.ui.requestInput` form leaves behind. Every
 * field is optional: the server fills what the plugin leaves out (a generic
 * label; the plugin's branding glyph, then `Toolbox`) and hands one complete
 * presentation to whatever renders the row.
 */
interface PluginRowPresentation {
    /** Row title while the row is pending and once it settled. */
    label?: PluginRowLabels;
    /**
     * A named host glyph (`{ glyph: "Workflow" }`), or one of this plugin's
     * own declared icons by its namespaced glyph (`{ glyph: "<pluginId>/<name>" }`,
     * an entry of the manifest's `bb.branding.experimental_icons` map). A
     * namespaced glyph that names another plugin or an undeclared name rejects
     * the tool registration.
     */
    icon?: {
        glyph: string;
    };
    /** Low-value rows clients collapse by default (a question a dedicated
     * interaction row already shows, a bookkeeping call). */
    suppress?: boolean;
    /** Accent colour per theme; omitted rows use the neutral row tint. */
    tint?: {
        light: string;
        dark: string;
    };
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
interface ExperimentalPluginProviderEnvEntry {
    name: string;
    value: string | {
        serverPath: string;
    };
    reason: string;
}
type PluginMentionTrigger = "!" | "#" | "$" | "@" | "~";
/** Search context handed to a mention provider (design §4.9). `projectId`/
 * `threadId` are null when the composer has not committed one yet. */
interface PluginMentionSearchContext {
    trigger: PluginMentionTrigger;
    query: string;
    projectId: string | null;
    threadId: string | null;
}
/** One row a mention provider returns from `search`. `id` is the provider's
 * own item id — the host namespaces it before it reaches the wire. */
interface PluginMentionItem {
    id: string;
    title: string;
    subtitle?: string;
    /**
     * BB icon name: a built-in name, or a name the plugin's app bundle
     * registered with `app.experimental_icons.register()`. Resolved names take
     * precedence over plugin branding in menu rows, composer pills, and sent
     * messages. Omitted or unknown names fall back to plugin branding, then
     * the generic plugin icon.
     */
    icon?: string;
}
/** Agent-only image context resolved with a plugin mention. */
type ExperimentalPluginMentionImage = {
    type: "image";
    url: string;
    context?: string;
} | {
    type: "localImage";
    path: string;
    context?: string;
};
interface PluginMentionProviderRegistration {
    /** Unique within this plugin: [a-zA-Z0-9_-]+ (no ":" — the host composes
     * wire item ids as "<providerId>:<itemId>"). */
    id: string;
    /** Section label shown above this provider's rows in the mention menu. */
    label: string;
    /**
     * Composer trigger characters this provider should answer. Omit to use the
     * default `@` mention trigger. Valid triggers are `@`, `#`, `$`, `!`, and `~`.
     */
    triggers?: readonly PluginMentionTrigger[];
    /**
     * Runs server-side as the user types after one of this provider's triggers
     * in the composer. Each call is time-boxed (2s) and failure-isolated: a slow
     * or throwing provider contributes an empty list — it can never break the
     * mention menu.
     */
    search(ctx: PluginMentionSearchContext): PluginMentionItem[] | Promise<PluginMentionItem[]>;
    /**
     * Resolves one picked item into agent context, called once per unique
     * item at message send time. The returned `context` is attached to the
     * message as an agent-visible (user-hidden) prompt input. Throwing blocks
     * the send with a visible error.
     */
    resolve(itemId: string): {
        context: string;
        experimental_images?: readonly ExperimentalPluginMentionImage[];
    } | Promise<{
        context: string;
        experimental_images?: readonly ExperimentalPluginMentionImage[];
    }>;
}
/**
 * The chat an AI task works for, so a service can run it with the same
 * provider accounts as that chat's turns.
 */
interface ExperimentalPluginAiTaskContext {
    /** The thread being titled, or the thread working in the committed worktree; `null` when there is none. */
    readonly threadId: string | null;
    /** The thread's or worktree's project; `null` when there is none. */
    readonly projectId: string | null;
    /**
     * The person the task runs for on servers with sign-in: the person who
     * asked for a commit message. Absent for thread titles (the thread's
     * acting person applies) and on servers without sign-in.
     */
    readonly experimental_user?: ExperimentalPluginRpcCallerUser;
}
/** Options for one `complete` call. */
interface PluginAiCompleteOptions {
    /**
     * Aborted when bb stops waiting: the task timed out (5 seconds for titles
     * and commit messages) or the request was cancelled. Pass it to `fetch`.
     */
    readonly signal: AbortSignal;
    /**
     * The chat this prompt is for. bb always sets it; absent only on older bb
     * releases.
     */
    readonly experimental_context?: ExperimentalPluginAiTaskContext;
}
/** Options for one `transcribe` call. */
interface PluginAiTranscribeOptions {
    /** Aborted when bb stops waiting (10 seconds) or the request was cancelled. */
    readonly signal: AbortSignal;
    /**
     * Vocabulary the speaker is likely to use (names, identifiers), for
     * services that accept a transcription prompt; `null` when there is none.
     */
    readonly hint: string | null;
}
/**
 * Whether a service can answer right now. `message` is shown to the user
 * beside the service ("Sign in to your bb account") and should say how to
 * make it ready.
 */
type PluginAiServiceStatus = {
    readonly ready: true;
} | {
    readonly ready: false;
    readonly message: string;
};
/**
 * An AI service bb can use for its helper tasks: thread titles and commit
 * messages (`complete`) and voice input (`transcribe`). The user picks a
 * service per task in Settings → AI services or with
 * `bb settings ai-services set`. The functions run in the plugin's server
 * process; a plugin that needs host-local state (a login file, a local model)
 * reaches its own `bb.host` entry through `bb.hosts.experimental_client`.
 *
 * bb owns the prompts and cleans up replies (think blocks, quotes, labels,
 * extra lines), so a service returns the model's text as-is. The plugin owns
 * everything behind the function: which model, which API, any retries.
 * Failure is a rejected promise.
 */
interface PluginAiServiceDeclaration {
    /**
     * Stable, lowercase id, unique within this plugin. bb identifies a service
     * by plugin id and service id, so another plugin may use the same id.
     * `automatic` and `off` are reserved.
     */
    readonly id: string;
    /** Shown in the picker; 1-64 characters. */
    readonly displayName: string;
    /**
     * Answer one prompt with plain text. Offered for thread titles and commit
     * messages. Declare `complete`, `transcribe`, or both.
     */
    readonly complete?: (prompt: string, options: PluginAiCompleteOptions) => Promise<string>;
    /** Transcribe recorded speech to text. Offered for voice input. */
    readonly transcribe?: (audio: File, options: PluginAiTranscribeOptions) => Promise<string>;
    /**
     * Report whether the service can answer. bb calls it for the picker's
     * status line and to decide whether Automatic skips the service and
     * whether the microphone shows; results are cached for a few seconds.
     * Omit it when the service is always ready.
     */
    readonly status?: () => Promise<PluginAiServiceStatus>;
}

declare function pluginCliCollisionWarning(pluginId: string, commandName: string): string | null;
/**
 * Built-in dynamic tool names plugins may not shadow. Maintained by hand —
 * kept in sync with the built-in tools in
 * apps/server/src/services/threads/thread-runtime-config.ts by
 * apps/server/test/services/plugins/plugin-agent-tools.test.ts.
 */
declare const RESERVED_AGENT_TOOL_NAMES: readonly string[];
/** JSON values ≤256KB; larger writes are rejected with a clear error. */
declare const KV_VALUE_MAX_BYTES: number;
declare const PLUGIN_PROVIDER_ENV_NAME_PATTERN: RegExp;
declare const PLUGIN_PROVIDER_ENV_MAX_ENTRIES = 32;
declare function validatePluginProviderEnvEntries(value: unknown): ExperimentalPluginProviderEnvEntry[];
/** Status labels ride on every tool-call event and share one timeline row. */
declare const PLUGIN_AGENT_STATUS_LABEL_MAX_CHARS = 80;
declare const PROVIDER_ID_PATTERN: RegExp;
declare const PLUGIN_PROVIDER_BRIDGE_OPTIONS_MAX_BYTES: number;
declare const SETTING_KEY_PATTERN: RegExp;
/**
 * Validate freeform descriptors from plugin code and merge them into the
 * plugin's registered schema. Plugin source is not type-safe at runtime, so
 * both the production and fake hosts must enforce this boundary identically.
 */
declare function registerSettingDescriptors(target: PluginSettingDescriptors, added: Record<string, unknown>): PluginSettingDescriptors;
/** Validate a settings update. `null` means unset. */
declare function validateSettingsUpdate(descriptors: PluginSettingDescriptors, values: Record<string, unknown>): string[];
declare function coerceStoredPluginSettingValue(descriptor: PluginSettingDescriptor, value: unknown): PluginSettingValue | undefined;
declare const PLUGIN_MENTION_TRIGGER_VALUES: readonly ["@", "#", "$", "!", "~"];
declare function isPluginMentionTrigger(value: unknown): value is PluginMentionTrigger;
declare const PLUGIN_PROVIDER_DISPLAY_NAME_MAX_CHARS = 80;
declare const PLUGIN_PROVIDER_PERMISSION_MODE_VALUES: readonly ["accept-edits", "auto", "full"];
declare const PLUGIN_PROVIDER_REASONING_LEVEL_VALUES: readonly ["none", "low", "medium", "high", "xhigh", "ultracode", "max", "ultra"];
declare const PLUGIN_PROVIDER_COMPOSER_ACTION_VALUES: readonly ["plan", "goal"];
/**
 * A validated `bb.experimental_aiServices.register` declaration. Absent
 * functions are `null` so hosts never have to distinguish missing from
 * undefined.
 */
interface NormalizedPluginAiService {
    readonly id: string;
    readonly displayName: string;
    readonly complete: NonNullable<PluginAiServiceDeclaration["complete"]> | null;
    readonly transcribe: NonNullable<PluginAiServiceDeclaration["transcribe"]> | null;
    readonly status: NonNullable<PluginAiServiceDeclaration["status"]> | null;
}
/**
 * Validate one `bb.experimental_aiServices.register` declaration the same
 * way in the production host and the fake host. Throws on the first problem;
 * returns a normalized, frozen copy carrying only contract fields.
 */
declare function validatePluginAiServiceDeclaration(declaration: PluginAiServiceDeclaration): NormalizedPluginAiService;
/** The collision a plugin's second registration of one AI-service id raises. */
declare function aiServiceAlreadyRegisteredMessage(id: string): string;
/** The collision a second registration of a live provider id raises. */
declare function providerAlreadyRegisteredMessage(id: string): string;
declare function aiTaskEnvForeignProviderMessage(id: string): string;
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
declare function validatePluginProviderDeclaration(declaration: PluginProviderDeclaration): NormalizedPluginProviderDeclaration;
/**
 * Run a declaration's `deriveProviderOptions` hook for one
 * command and validate its result as a bounded, plain-JSON object — the same
 * rules as `experimental_bridgeOptions`, because the result rides the same
 * wire slot. Shared by the real host and the fake so a hook that works in
 * tests works in production.
 */
declare function deriveValidatedProviderOptions(args: {
    declaration: PluginProviderDeclaration;
    context: Parameters<NonNullable<PluginProviderDeclaration["deriveProviderOptions"]>>[0];
}): Readonly<Record<string, JsonValue>>;
declare function isStandardSchema(value: unknown): value is StandardSchemaV1;
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
/**
 * The declared shape of `presentation`, copied field by field so
 * a plugin's object cannot smuggle prototypes or extra markup into the
 * persisted row. Labels share the status-label length cap. The production
 * host and the fake host both call this, so a presentation that registers
 * in a plugin unit test registers in bb, and one bb rejects is rejected
 * with the same message.
 */
declare function parsePluginRowPresentation(subject: string, value: unknown): PluginRowPresentation | null;
/** Compact issue summary from a (possibly foreign-instance) zod error. */
declare function summarizeStandardIssues(issues: readonly StandardSchemaV1Issue[]): string;
declare function enforcePluginCliOutputLimit(result: Omit<PluginCliExecutionResult, "error">, jsonOutput: boolean): PluginCliExecutionResult;
/**
 * Adopt the value a plugin HTTP route handler returned.
 *
 * Plugin handlers can run in a different realm (bundled fetch polyfills), so
 * a valid `Response` from a handler can fail
 * `instanceof Response` in the host (#1661). Both the real host and the fake
 * host accept a structurally valid Response from any realm and re-wrap it
 * into a this-realm `Response`, so Hono always consumes a native object and a
 * malformed return still fails at the invoke boundary with a pointed error.
 *
 * The body streams through: a foreign `body` stream is piped chunk by chunk
 * with cancellation forwarded to the source, so no full-size buffer is made.
 */
declare function adoptHttpRouteResponse(value: unknown): Response;
/**
 * The one rule for a namespaced glyph (`"<pluginId>/<name>"`) wherever a
 * plugin may reference its own declared icons — a tool presentation at
 * `bb.agents.registerTool`, a provider icon at `bb.providers.register`, and a
 * row presentation at ingest: the plugin id must be the emitting plugin's
 * and the name must be in its `bb.branding.experimental_icons` map. The
 * server and the fake plugin host apply it from here, so a registration the
 * fake accepts is one the server accepts.
 *
 * Returns the reason a glyph is refused, always naming the glyph and the
 * plugin, or null when the glyph is acceptable. A host glyph (no `/`) is
 * never refused here: whether the client can draw it is the client's call.
 */
declare function undeclaredIconProblem(pluginId: string, declaredIconNames: ReadonlySet<string>, glyph: string): string | null;
/** `bb.providers.register` refusal for an icon {@link undeclaredIconProblem} rejects. */
declare function providerIconRefusalMessage(providerId: string, problem: string): string;
/**
 * `bb.providers.register` refusal for the provider icon or a service tier
 * icon {@link undeclaredIconProblem} rejects, or null when every icon is
 * acceptable.
 */
declare function providerDeclarationIconRefusal(pluginId: string, declaredIconNames: ReadonlySet<string>, declaration: NormalizedPluginProviderDeclaration): string | null;
/**
 * `bb.providers.register` refusal for a plugin whose manifest declares no
 * `bb.host` entry: a declaration is metadata, and the bridge it runs on is
 * that entry.
 */
declare function providerWithoutBridgeMessage(providerId: string): string;
/**
 * Files a hook handler under its key in a per-hook record.
 *
 * The record is a mapped type over the hook-name union, so writing to it
 * through a generic key is not expressible soundly in TypeScript: this call
 * site knows `handler` matches `hook`, but the checker only knows both range
 * over the union and so demands their intersection. The erasure is confined to
 * this one function; every READ is sound, because a slot is typed for its own
 * hook and the runner builds the context for the hook it read the handler from.
 *
 * Shared by the real host (`plugin-api.ts`) and the fake one so both register
 * hooks by the same rule, which is the point of every other helper here.
 */
declare function storePluginHook<K extends PluginHookName>(records: {
    [N in PluginHookName]: PluginHookHandler<N> | null;
}, hook: K, handler: PluginHookHandler<K>): void;
/** The refusal a second handler for one hook from one plugin gets. */
declare function pluginHookAlreadyRegisteredMessage(hook: PluginHookName): string;
declare const ENVIRONMENT_PROVIDER_ID_PATTERN: RegExp;
declare const ENVIRONMENT_PROVIDER_DISPLAY_NAME_MAX_CHARS = 80;
declare const ENVIRONMENT_PROVIDER_DESCRIPTION_MAX_CHARS = 200;
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
declare function validatePluginEnvironmentProviderDeclaration(declaration: PluginEnvironmentProviderDeclaration): NormalizedPluginEnvironmentProvider;
declare const MACHINE_PROVIDER_DESCRIPTION_MAX_CHARS = 200;
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
declare function validatePluginMachineProviderDeclaration(declaration: PluginMachineProviderDeclaration): NormalizedPluginMachineProvider;
declare function validateServerAccessProviderDeclaration(declaration: ServerAccessProviderDeclaration): ServerAccessProviderDeclaration;
declare function runPluginStorageMigrations(database: Database.Database, statements: string[]): void;
declare function normalizeHttpRouteRegistration(method: string, path: string, handler: unknown, opts: {
    auth?: PluginHttpAuthMode;
} | undefined, existingRoutes: readonly {
    method: string;
    path: string;
}[]): {
    method: string;
    path: string;
    auth: PluginHttpAuthMode;
};
declare function normalizeWebSocketRouteRegistration(path: string, handler: unknown, opts: {
    auth?: PluginHttpAuthMode;
} | undefined, existingRoutes: readonly {
    path: string;
}[]): {
    path: string;
    auth: PluginHttpAuthMode;
};
type RpcRegistrationRecord = {
    declarations: ContractTagDeclarations<unknown, unknown>;
    viewer: boolean;
    publication: ReturnType<typeof publishRpcMethod>;
    inputSchema: StandardSchemaV1;
    outputSchema: StandardSchemaV1;
    handler: (input: unknown, context: ExperimentalPluginRpcHandlerContext) => unknown;
};
declare function normalizeRpcRegistration(contract: unknown, handlers: unknown, registered: ReadonlyMap<string, unknown>, options: unknown): Array<[string, RpcRegistrationRecord]>;
declare function normalizeRealtimePayload(channel: string, payload: unknown): unknown;
declare function validateBackgroundServiceRegistration(name: string, service: {
    start(signal: AbortSignal): void | Promise<void>;
}, existing: readonly {
    name: string;
}[]): {
    name: string;
    start: (signal: AbortSignal) => void | Promise<void>;
};
declare function validateScheduleRegistration(name: string, cron: string, fn: () => void | Promise<void>, existing: readonly {
    name: string;
}[], parseCron: (cron: string) => void): {
    name: string;
    cron: string;
    fn: () => void | Promise<void>;
};
declare function normalizeCliRegistration(registration: PluginCliRegistration, alreadyRegistered: boolean): {
    name: string;
    summary: string;
    commands: PluginCliCommandInfo[];
    rendersHelp: boolean;
    run: PluginCliRegistration["run"];
};
type AgentToolExecute = (params: unknown, ctx: PluginAgentToolContext) => PluginAgentToolResult | Promise<PluginAgentToolResult>;
type AgentToolParse = (input: unknown) => {
    ok: true;
    value: unknown;
} | {
    ok: false;
    error: string;
};
declare function normalizeAgentToolRegistration(args: {
    pluginId: string;
    declaredIconNames: ReadonlySet<string>;
    tool: {
        name: string;
        description: string;
        instructions?: string;
        presentation?: PluginRowPresentation;
        parameters: unknown;
        execute(params: never, ctx: PluginAgentToolContext): PluginAgentToolResult | Promise<PluginAgentToolResult>;
    };
}): {
    name: string;
    description: string;
    presentation: PluginRowPresentation | null;
    instructions: string | null;
    inputSchema: unknown;
    parse: AgentToolParse;
    execute: AgentToolExecute;
};
declare function normalizeMentionProviderRegistration(provider: PluginMentionProviderRegistration, existing: readonly {
    id: string;
}[]): {
    id: string;
    label: string;
    triggers: readonly PluginMentionTrigger[];
    search: PluginMentionProviderRegistration["search"];
    resolve: PluginMentionProviderRegistration["resolve"];
};
interface NormalizedPluginInteractionRequest {
    threadId: string;
    rendererId: string;
    title: string;
    payload: JsonValue;
    timeoutMs: number;
    presentation: PluginRowPresentation | null;
    describeSubmission: NonNullable<PluginInteractionRequest["describeSubmission"]> | null;
}
declare function normalizeInteractionRequest(request: PluginInteractionRequest): NormalizedPluginInteractionRequest;
declare function validateProviderEnvContribution(label: "provider environment contribution" | "provider environment health contribution", providerId: string, resolve: unknown, registered: ReadonlyMap<string, unknown>): void;
declare function normalizePluginAgentConfiguration(args: {
    knownSkillIds: ReadonlySet<string>;
    knownToolIds: ReadonlySet<string>;
    pluginId: string;
    value: unknown;
}): {
    toolIds: string[];
    toolParameterOverrides: Map<string, Record<string, unknown>>;
    skillIds: string[];
    instructions: string | null;
};
declare function readPluginRpcRefusal(error: unknown): PluginRpcError | null;
declare function validateRpcValue(schema: StandardSchemaV1, value: unknown, phase: "input" | "output", fail: (error: PluginRpcError) => never): Promise<unknown>;
declare function normalizeRpcJsonResult(value: unknown, fail: (error: PluginRpcError) => never): JsonValue;

export { ENVIRONMENT_PROVIDER_DESCRIPTION_MAX_CHARS, ENVIRONMENT_PROVIDER_DISPLAY_NAME_MAX_CHARS, ENVIRONMENT_PROVIDER_ID_PATTERN, ENVIRONMENT_PROVIDER_REQUIREMENT_NAMES, KV_VALUE_MAX_BYTES, MACHINE_PROVIDER_DESCRIPTION_MAX_CHARS, PLUGIN_AGENT_STATUS_LABEL_MAX_CHARS, PLUGIN_MENTION_TRIGGER_VALUES, PLUGIN_PROVIDER_BRIDGE_OPTIONS_MAX_BYTES, PLUGIN_PROVIDER_COMPOSER_ACTION_VALUES, PLUGIN_PROVIDER_DISPLAY_NAME_MAX_CHARS, PLUGIN_PROVIDER_ENV_MAX_ENTRIES, PLUGIN_PROVIDER_ENV_NAME_PATTERN, PLUGIN_PROVIDER_PERMISSION_MODE_VALUES, PLUGIN_PROVIDER_REASONING_LEVEL_VALUES, PROVIDER_ID_PATTERN, RESERVED_AGENT_TOOL_NAMES, RESERVED_CORE_CLI_COMMANDS, SETTING_KEY_PATTERN, adoptHttpRouteResponse, aiServiceAlreadyRegisteredMessage, aiTaskEnvForeignProviderMessage, coerceStoredPluginSettingValue, deriveValidatedProviderOptions, enforcePluginCliOutputLimit, environmentCompositionSchema, isPluginMentionTrigger, isStandardSchema, normalizeAgentToolRegistration, normalizeCliRegistration, normalizeHttpRouteRegistration, normalizeInteractionRequest, normalizeMentionProviderRegistration, normalizePluginAgentConfiguration, normalizeRealtimePayload, normalizeRpcJsonResult, normalizeRpcRegistration, normalizeWebSocketRouteRegistration, parsePluginRowPresentation, pluginCliCollisionWarning, pluginHookAlreadyRegisteredMessage, providerAlreadyRegisteredMessage, providerDeclarationIconRefusal, providerIconRefusalMessage, providerWithoutBridgeMessage, publishRpcMethod, readPluginRpcRefusal, readRpcPublicationOptions, registerSettingDescriptors, runPluginStorageMigrations, storePluginHook, summarizeStandardIssues, undeclaredIconProblem, validateBackgroundServiceRegistration, validatePluginAiServiceDeclaration, validatePluginEnvironmentProviderDeclaration, validatePluginMachineProviderDeclaration, validatePluginProviderDeclaration, validatePluginProviderEnvEntries, validateProviderEnvContribution, validateRpcValue, validateScheduleRegistration, validateServerAccessProviderDeclaration, validateSettingsUpdate };
export type { NormalizedPluginAiService, NormalizedPluginEnvironmentComposition, NormalizedPluginEnvironmentProvider, NormalizedPluginEnvironmentProviderRequirements, NormalizedPluginInteractionRequest, NormalizedPluginMachineProvider, NormalizedPluginProviderDeclaration };
