// Portable type declarations for `@workspace-core/plugin-sdk`. Unpublished BB
// workspace contracts are flattened; public subpaths may reuse the
// package root without requiring any other @core/* package.
//
// Confused by the API, or need a symbol that isn't here? Clone the BB repo
// and read the real source: https://github.com/get-bb/bb

import { z } from 'zod';
import { PluginEnvironmentProviderRequirements, StandardSchemaV1, StandardSchemaV1InferOutput, JsonValue as JsonValue$1, PluginEnvironmentValidateDecision } from '@workspace-core/plugin-sdk';

interface JsonObject {
    [key: string]: JsonValue;
}
type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

declare const environmentSchema: z.ZodObject<{
    baseBranch: z.ZodNullable<z.ZodString>;
    branchName: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodNumber;
    defaultBranch: z.ZodNullable<z.ZodString>;
    environmentProviderId: z.ZodNullable<z.ZodString>;
    environmentProviderInstanceKey: z.ZodNullable<z.ZodString>;
    environmentProviderSelection: z.ZodNullable<z.ZodObject<{
        inputs: z.ZodNullable<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
        machine: z.ZodDiscriminatedUnion<[z.ZodObject<{
            hostId: z.ZodString;
            type: z.ZodLiteral<"existing">;
        }, z.core.$strip>, z.ZodObject<{
            inputs: z.ZodNullable<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
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

type PluginEnvironmentProviderInputsSchema = StandardSchemaV1 | undefined;
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
type InputsValue<S> = S extends StandardSchemaV1 ? StandardSchemaV1InferOutput<S> : null;
/** Attempt-scoped updates; core persists each update before this call returns. */
interface PluginEnvironmentProviderProgress {
    step(text: string): void;
    log(text: string): void;
}
interface PluginEnvironmentProviderValidateContext<R extends PluginEnvironmentProviderRequirements = PluginEnvironmentProviderRequirements, S extends PluginEnvironmentProviderInputsSchema = PluginEnvironmentProviderInputsSchema> {
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
interface PluginEnvironmentProviderCreateContext<R extends PluginEnvironmentProviderRequirements = PluginEnvironmentProviderRequirements, S extends PluginEnvironmentProviderInputsSchema = PluginEnvironmentProviderInputsSchema> extends PluginEnvironmentProviderValidateContext<R, S> {
    thread: ThreadResponse;
    suggestedBranchName: string;
    attempt: number;
    pathKey: string;
    experimental_claimPath(path: string): Promise<boolean>;
    report: PluginEnvironmentProviderProgress;
    signal: AbortSignal;
}
/** Rebuilds a thread's destroyed environment; `inputs` are the ones it was created with. */
interface PluginEnvironmentProviderRestoreContext<R extends PluginEnvironmentProviderRequirements = PluginEnvironmentProviderRequirements, S extends PluginEnvironmentProviderInputsSchema = PluginEnvironmentProviderInputsSchema> extends PluginEnvironmentProviderValidateContext<R, S> {
    thread: ThreadResponse;
    attempt: number;
    pathKey: string;
    experimental_claimPath(path: string): Promise<boolean>;
    /** Resource is private to this provider; null after completed removal. */
    previous: {
        environment: Environment;
        resource: JsonValue$1 | null;
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
    resource?: JsonValue$1;
} | {
    status: "failed";
    message: string;
};
interface PluginEnvironmentProviderRemoveContext {
    environment: Environment | null;
    hostId: string | null;
    path: string | null;
    pathKey: string;
    resource: JsonValue$1 | null;
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
interface PluginEnvironmentProviderDefinition<R extends PluginEnvironmentProviderRequirements = PluginEnvironmentProviderRequirements, S extends PluginEnvironmentProviderInputsSchema = PluginEnvironmentProviderInputsSchema> {
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

export type { PluginEnvironmentProviderAvailability, PluginEnvironmentProviderAvailabilityContext, PluginEnvironmentProviderCreateContext, PluginEnvironmentProviderCreateResult, PluginEnvironmentProviderDefinition, PluginEnvironmentProviderInputsSchema, PluginEnvironmentProviderPolicy, PluginEnvironmentProviderProgress, PluginEnvironmentProviderRemoveContext, PluginEnvironmentProviderRemoveResult, PluginEnvironmentProviderRestoreContext, PluginEnvironmentProviderValidateContext };
