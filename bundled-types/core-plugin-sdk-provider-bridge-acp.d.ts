// Portable type declarations for `@workspace-core/plugin-sdk`. Unpublished BB
// workspace contracts are flattened; public subpaths may reuse the
// package root without requiring any other @core/* package.
//
// Confused by the API, or need a symbol that isn't here? Clone the BB repo
// and read the real source: https://github.com/get-bb/bb

import { z } from 'zod';

interface JsonObject {
    [key: string]: JsonValue;
}
type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

declare const reasoningLevelSchema: z.ZodString;
type ReasoningLevel = z.infer<typeof reasoningLevelSchema>;
declare const serviceTierSchema: z.ZodString;
type ServiceTier = z.infer<typeof serviceTierSchema>;

declare const availableModelSchema: z.ZodObject<{
    defaultReasoningEffort: z.ZodString;
    description: z.ZodString;
    displayName: z.ZodString;
    id: z.ZodString;
    isDefault: z.ZodBoolean;
    model: z.ZodString;
    routeProviderId: z.ZodOptional<z.ZodString>;
    sessionOptions: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        category: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        id: z.ZodString;
        label: z.ZodString;
        type: z.ZodLiteral<"select">;
        value: z.ZodString;
        values: z.ZodArray<z.ZodObject<{
            description: z.ZodOptional<z.ZodString>;
            group: z.ZodOptional<z.ZodString>;
            id: z.ZodString;
            label: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        category: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        fixed: z.ZodOptional<z.ZodBoolean>;
        id: z.ZodString;
        label: z.ZodString;
        type: z.ZodLiteral<"boolean">;
        value: z.ZodBoolean;
    }, z.core.$strip>], "type">>>;
    supportedReasoningEfforts: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        reasoningEffort: z.ZodString;
    }, z.core.$strip>>;
    supportedServiceTiers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        id: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
type AvailableModel = z.infer<typeof availableModelSchema>;

declare const deltaPresentationSchema: z.ZodObject<{
    badge: z.ZodOptional<z.ZodObject<{
        glyph: z.ZodString;
        hint: z.ZodString;
        label: z.ZodString;
        tone: z.ZodEnum<{
            destructive: "destructive";
            neutral: "neutral";
        }>;
    }, z.core.$strip>>;
    detail: z.ZodOptional<z.ZodString>;
    icon: z.ZodObject<{
        glyph: z.ZodString;
    }, z.core.$strip>;
    label: z.ZodObject<{
        completed: z.ZodString;
        pending: z.ZodString;
    }, z.core.$strip>;
    suppress: z.ZodOptional<z.ZodBoolean>;
    tint: z.ZodOptional<z.ZodObject<{
        dark: z.ZodString;
        light: z.ZodString;
    }, z.core.$strip>>;
    title: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type DeltaPresentation = z.infer<typeof deltaPresentationSchema>;
declare const deltaItemShapeSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    aggregatedOutput: z.ZodOptional<z.ZodString>;
    command: z.ZodString;
    cwd: z.ZodString;
    durationMs: z.ZodOptional<z.ZodNumber>;
    exitCode: z.ZodOptional<z.ZodNumber>;
    type: z.ZodLiteral<"command">;
}, z.core.$strip>, z.ZodObject<{
    changes: z.ZodArray<z.ZodObject<{
        diff: z.ZodOptional<z.ZodString>;
        kind: z.ZodEnum<{
            add: "add";
            delete: "delete";
            update: "update";
        }>;
        movePath: z.ZodOptional<z.ZodString>;
        newText: z.ZodOptional<z.ZodString>;
        oldText: z.ZodOptional<z.ZodString>;
        path: z.ZodString;
    }, z.core.$strip>>;
    type: z.ZodLiteral<"fileChange">;
}, z.core.$strip>, z.ZodObject<{
    args: z.ZodOptional<z.ZodUnknown>;
    durationMs: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
    result: z.ZodOptional<z.ZodUnknown>;
    server: z.ZodOptional<z.ZodString>;
    tool: z.ZodString;
    type: z.ZodLiteral<"tool">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"compaction">;
}, z.core.$strip>, z.ZodObject<{
    text: z.ZodString;
    type: z.ZodLiteral<"agentMessage">;
}, z.core.$strip>, z.ZodObject<{
    content: z.ZodArray<z.ZodString>;
    summary: z.ZodArray<z.ZodString>;
    type: z.ZodLiteral<"reasoning">;
}, z.core.$strip>, z.ZodObject<{
    text: z.ZodString;
    type: z.ZodLiteral<"plan">;
}, z.core.$strip>, z.ZodObject<{
    queries: z.ZodArray<z.ZodString>;
    type: z.ZodLiteral<"webSearch">;
}, z.core.$strip>, z.ZodObject<{
    pattern: z.ZodNullable<z.ZodString>;
    prompt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodLiteral<"webFetch">;
    url: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    path: z.ZodString;
    type: z.ZodLiteral<"imageView">;
}, z.core.$strip>, z.ZodObject<{
    error: z.ZodNullable<z.ZodString>;
    path: z.ZodNullable<z.ZodString>;
    prompt: z.ZodNullable<z.ZodString>;
    result: z.ZodOptional<z.ZodString>;
    transparentBackground: z.ZodBoolean;
    type: z.ZodLiteral<"imageGeneration">;
}, z.core.$strip>, z.ZodObject<{
    description: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
    familyId: z.ZodString;
    foreground: z.ZodOptional<z.ZodBoolean>;
    outputFile: z.ZodOptional<z.ZodString>;
    skipTranscript: z.ZodBoolean;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        interrupted: "interrupted";
        pending: "pending";
    }>;
    summary: z.ZodOptional<z.ZodString>;
    taskStatus: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        killed: "killed";
        paused: "paused";
        pending: "pending";
        running: "running";
        stopped: "stopped";
    }>;
    taskType: z.ZodString;
    type: z.ZodLiteral<"backgroundTask">;
    usage: z.ZodOptional<z.ZodObject<{
        durationMs: z.ZodNumber;
        toolUses: z.ZodNumber;
        totalTokens: z.ZodNumber;
    }, z.core.$strip>>;
    workflow: z.ZodOptional<z.ZodObject<{
        agents: z.ZodArray<z.ZodObject<{
            agentType: z.ZodOptional<z.ZodString>;
            attempt: z.ZodNumber;
            cached: z.ZodBoolean;
            durationMs: z.ZodOptional<z.ZodNumber>;
            error: z.ZodOptional<z.ZodString>;
            index: z.ZodNumber;
            isolation: z.ZodOptional<z.ZodString>;
            label: z.ZodString;
            lastProgressAt: z.ZodNumber;
            lastToolName: z.ZodOptional<z.ZodString>;
            lastToolSummary: z.ZodOptional<z.ZodString>;
            model: z.ZodString;
            phaseIndex: z.ZodOptional<z.ZodNumber>;
            phaseTitle: z.ZodOptional<z.ZodString>;
            promptPreview: z.ZodOptional<z.ZodString>;
            queuedAt: z.ZodOptional<z.ZodNumber>;
            resultPreview: z.ZodOptional<z.ZodString>;
            startedAt: z.ZodOptional<z.ZodNumber>;
            state: z.ZodEnum<{
                done: "done";
                failed: "failed";
                queued: "queued";
                running: "running";
                skipped: "skipped";
            }>;
            tokens: z.ZodOptional<z.ZodNumber>;
            toolCalls: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        phases: z.ZodArray<z.ZodObject<{
            index: z.ZodNumber;
            kind: z.ZodOptional<z.ZodString>;
            title: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    workflowName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    cmd: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
    type: z.ZodLiteral<"fileRead">;
}, z.core.$strip>, z.ZodObject<{
    cmd: z.ZodOptional<z.ZodString>;
    mode: z.ZodEnum<{
        content: "content";
        list: "list";
        path: "path";
    }>;
    path: z.ZodOptional<z.ZodString>;
    query: z.ZodString;
    type: z.ZodLiteral<"search">;
}, z.core.$strip>, z.ZodObject<{
    background: z.ZodBoolean;
    childRef: z.ZodString;
    label: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"delegation">;
}, z.core.$strip>, z.ZodObject<{
    explanation: z.ZodOptional<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            completed: "completed";
            failed: "failed";
            pending: "pending";
        }>>;
        step: z.ZodString;
    }, z.core.$strip>>;
    type: z.ZodLiteral<"planSteps">;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodString & z.ZodType<`${string}/${string}`, string, z.core.$ZodTypeInternals<`${string}/${string}`, string>>;
    payload: z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>;
    type: z.ZodLiteral<"extension">;
}, z.core.$strip>], "type">;
type DeltaItemShape = z.infer<typeof deltaItemShapeSchema>;

interface ProviderBridgeContext {
    pluginId: string;
    dataDir: string;
    tempDir: string;
}
interface ProviderBridgeDefinition {
    handleLine: (line: string) => void;
    start?: (context: ProviderBridgeContext) => void;
    onClose?: () => void;
    onSigterm?: () => void;
    onSigint?: () => void;
}
interface ProviderBridgeEntry extends ProviderBridgeDefinition {
    experimental_apiVersion: 1;
}

declare const providerUsageResultSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    supported: z.ZodLiteral<false>;
}, z.core.$loose>, z.ZodObject<{
    supported: z.ZodLiteral<true>;
    usage: z.ZodDiscriminatedUnion<[z.ZodObject<{
        accountEmail: z.ZodNullable<z.ZodString>;
        planLabel: z.ZodNullable<z.ZodString>;
        status: z.ZodLiteral<"ok">;
        windows: z.ZodArray<z.ZodObject<{
            cost: z.ZodOptional<z.ZodObject<{
                limitUsdCents: z.ZodNumber;
                usedUsdCents: z.ZodNumber;
            }, z.core.$strip>>;
            label: z.ZodString;
            resetsAt: z.ZodNullable<z.ZodString>;
            usedPercent: z.ZodNumber;
        }, z.core.$loose>>;
    }, z.core.$loose>, z.ZodObject<{
        status: z.ZodLiteral<"not_installed">;
    }, z.core.$loose>, z.ZodObject<{
        status: z.ZodLiteral<"unauthenticated">;
    }, z.core.$loose>, z.ZodObject<{
        status: z.ZodLiteral<"expired">;
    }, z.core.$loose>, z.ZodObject<{
        accountEmail: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        message: z.ZodString;
        planLabel: z.ZodDefault<z.ZodNullable<z.ZodString>>;
        status: z.ZodLiteral<"error">;
    }, z.core.$loose>], "status">;
}, z.core.$loose>], "supported">;
type ProviderUsageResult = z.infer<typeof providerUsageResultSchema>;

declare const experimental_providerBridge: ProviderBridgeEntry;

interface AcpMaintenanceDialect {
    loginCommand: string;
    installer(): {
        command: string;
        args: string[];
        displayCommand: string;
    };
    readAccount(): Promise<{
        email: string | null;
    } | null>;
    readUsage(): Promise<ProviderUsageResult>;
}

declare const acpToolKindSchema: z.ZodEnum<{
    delete: "delete";
    edit: "edit";
    execute: "execute";
    fetch: "fetch";
    move: "move";
    other: "other";
    read: "read";
    search: "search";
    switch_mode: "switch_mode";
    think: "think";
}>;
type AcpToolKind = z.infer<typeof acpToolKindSchema>;
declare const acpToolCallStatusSchema: z.ZodEnum<{
    cancelled: "cancelled";
    completed: "completed";
    failed: "failed";
    in_progress: "in_progress";
    pending: "pending";
}>;
type AcpToolCallStatus = z.infer<typeof acpToolCallStatusSchema>;
declare const acpToolCallContentSchema: z.ZodUnion<readonly [z.ZodObject<{
    content: z.ZodUnion<readonly [z.ZodObject<{
        text: z.ZodString;
        type: z.ZodLiteral<"text">;
    }, z.core.$loose>, z.ZodObject<{
        type: z.ZodString;
    }, z.core.$loose>]>;
    type: z.ZodLiteral<"content">;
}, z.core.$loose>, z.ZodObject<{
    newText: z.ZodString;
    oldText: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    path: z.ZodString;
    type: z.ZodLiteral<"diff">;
}, z.core.$loose>, z.ZodObject<{
    terminalId: z.ZodString;
    type: z.ZodLiteral<"terminal">;
}, z.core.$loose>]>;
type AcpToolCallContent = z.infer<typeof acpToolCallContentSchema>;
declare const acpToolCallUpdateEventSchema: z.ZodPreprocess<z.ZodObject<{
    content: z.ZodOptional<z.ZodPipe<z.ZodArray<z.ZodUnknown>, z.ZodTransform<({
        [x: string]: unknown;
        type: "content";
        content: {
            [x: string]: unknown;
            type: "text";
            text: string;
        } | {
            [x: string]: unknown;
            type: string;
        };
    } | {
        [x: string]: unknown;
        type: "diff";
        path: string;
        newText: string;
        oldText?: string | null | undefined;
    } | {
        [x: string]: unknown;
        type: "terminal";
        terminalId: string;
    })[], unknown[]>>>;
    kind: z.ZodOptional<z.ZodEnum<{
        delete: "delete";
        edit: "edit";
        execute: "execute";
        fetch: "fetch";
        move: "move";
        other: "other";
        read: "read";
        search: "search";
        switch_mode: "switch_mode";
        think: "think";
    }>>;
    locations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        line: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        path: z.ZodString;
    }, z.core.$loose>>>;
    name: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNull]>, z.ZodTransform<string | undefined, string | null>>>;
    rawInput: z.ZodOptional<z.ZodUnknown>;
    rawKind: z.ZodOptional<z.ZodString>;
    rawOutput: z.ZodOptional<z.ZodUnknown>;
    sessionUpdate: z.ZodEnum<{
        tool_call: "tool_call";
        tool_call_update: "tool_call_update";
    }>;
    status: z.ZodOptional<z.ZodEnum<{
        cancelled: "cancelled";
        completed: "completed";
        failed: "failed";
        in_progress: "in_progress";
        pending: "pending";
    }>>;
    title: z.ZodOptional<z.ZodString>;
    toolCallId: z.ZodString;
}, z.core.$loose>, unknown>;
type AcpToolCallUpdateEvent = z.infer<typeof acpToolCallUpdateEventSchema>;

interface AcpClassifiedToolCall {
    item: DeltaItemShape;
    presentation: DeltaPresentation;
}
interface AcpCommandResult {
    exitCode?: number;
    output?: string;
}

interface AcpToolIdentity {
    name?: string;
    kind?: AcpToolKind;
}
interface AcpDelegationReport {
    toolCallId: string;
    childRef: string;
    label: string;
    detail?: string;
}
interface AcpDialect {
    readonly id: string;
    toolIdentity?(event: AcpToolCallUpdateEvent): AcpToolIdentity | undefined;
    classifyToolCall?(event: AcpToolCallUpdateEvent): AcpClassifiedToolCall | undefined;
    commandResult?(event: AcpToolCallUpdateEvent): AcpCommandResult | undefined;
    normalizeCommandEvent?(event: AcpToolCallUpdateEvent): AcpToolCallUpdateEvent;
    readonly clientRequestMethods?: readonly string[];
    handleClientRequest?(method: string, params: unknown): AcpClientRequestOutcome | undefined;
    maintenance?: AcpMaintenanceDialect;
    presentModel?(model: AvailableModel): AvailableModel;
}
interface AcpClientRequestOutcome {
    result: Record<string, unknown>;
    delegation?: AcpDelegationReport;
}
declare function registerAcpDialect(dialect: AcpDialect): void;

interface AcpAgentProbeRequest {
    command: string;
    args: readonly string[];
    env?: Record<string, string>;
    cwd: string;
    timeoutMs?: number;
}
type AcpAgentProbe = {
    reachable: true;
    fork: boolean;
} | {
    reachable: false;
    reason: string;
};
declare function probeAcpAgent(request: AcpAgentProbeRequest): Promise<AcpAgentProbe>;
declare const acpAgentProbeSchema: z.ZodType<AcpAgentProbe>;

declare const acpLaunchSpecSchema: z.ZodObject<{
    args: z.ZodArray<z.ZodString>;
    command: z.ZodString;
    cwd: z.ZodOptional<z.ZodString>;
    displayName: z.ZodString;
    env: z.ZodRecord<z.ZodString, z.ZodString>;
    modelCli: z.ZodOptional<z.ZodPipe<z.ZodObject<{
        listArgs: z.ZodArray<z.ZodString>;
        primaryModels: z.ZodArray<z.ZodString>;
        selectFlag: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>, z.ZodTransform<{
        listArgs: string[];
        primaryModels: string[];
        selectFlag?: string | undefined;
    } | undefined, {
        listArgs: string[];
        primaryModels: string[];
        selectFlag?: string | undefined;
    }>>>;
    nativeReasoning: z.ZodOptional<z.ZodObject<{
        configId: z.ZodString;
        defaultLevel: z.ZodOptional<z.ZodString>;
        levelValues: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        supportedLevels: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>;
    nativeSkillRoots: z.ZodOptional<z.ZodObject<{
        project: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            ancestors: z.ZodOptional<z.ZodBoolean>;
            namePrefix: z.ZodOptional<z.ZodString>;
            path: z.ZodString;
            recursive: z.ZodOptional<z.ZodBoolean>;
            skipIfManifest: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>]>>>;
        user: z.ZodDefault<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
            ancestors: z.ZodOptional<z.ZodBoolean>;
            namePrefix: z.ZodOptional<z.ZodString>;
            path: z.ZodString;
            recursive: z.ZodOptional<z.ZodBoolean>;
            skipIfManifest: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>]>>>;
    }, z.core.$strict>>;
    permissionCli: z.ZodOptional<z.ZodObject<{
        full: z.ZodOptional<z.ZodArray<z.ZodString>>;
        insertAfterArgs: z.ZodOptional<z.ZodNumber>;
        readonly: z.ZodOptional<z.ZodArray<z.ZodString>>;
        workspaceWrite: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
    reasoningCli: z.ZodOptional<z.ZodObject<{
        defaultLevel: z.ZodOptional<z.ZodString>;
        flag: z.ZodString;
        levelValues: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        supportedLevels: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
type AcpLaunchSpec = z.infer<typeof acpLaunchSpecSchema>;

interface AgentModelCatalog {
    models: AvailableModel[];
    resolveVariant(args: {
        model: string;
        reasoningLevel?: ReasoningLevel;
        serviceTier?: ServiceTier;
    }): string | undefined;
}

/**
 * `@workspace-core/plugin-sdk/provider-bridge/acp` — the published ACP bridge kit.
 *
 * The Agent Client Protocol (https://agentclientprotocol.com) is one wire
 * protocol spoken by many agents, so bb runs all of them through one generic
 * bridge: the agent to launch arrives per command in the provider options,
 * and nothing in the bridge is bb-first-party. A plugin that wants to add an
 * ACP agent re-exports the bridge from its `bb.host` artifact and registers
 * its providers as any other plugin does:
 *
 * ```ts
 * // host.ts (the plugin's `bb.host` entry)
 * export { experimental_acpProviderBridge as experimental_providerBridge }
 *   from "@workspace-core/plugin-sdk/provider-bridge/acp";
 *
 * // server.ts
 * bb.providers.register({
 *   id: "amp",
 *   displayName: "Amp",
 *   experimental_bridgeOptions: {
 *     acpLaunchSpec: { displayName: "Amp", command: "amp", args: ["acp"], env: {} },
 *     acpDialect: "acp",
 *   },
 *   // …the rest of the declaration
 * })
 * ```
 *
 * **Dialects.** Version 1 of the protocol has no sub-agent concept and
 * standardizes nothing about `rawInput`, so what most distinguishes one
 * agent from another lives beside the protocol: grok stamps
 * `_meta["x.ai/tool"]` on every tool event, Cursor reports sub-agents
 * through a vendor `cursor/task` request. A dialect is a small module that
 * reads those channels; the bridge ships `acp` (the generic one), `cursor`,
 * `grok`, `omp` and `opencode`, named by id in the registration's bridge
 * options (`acpDialect`). A plugin supplies its own with
 * `experimental_registerAcpDialect`, called at module load in the same
 * `bb.host` artifact that re-exports the bridge:
 *
 * ```ts
 * // host.ts
 * import {
 *   experimental_registerAcpDialect,
 * } from "@workspace-core/plugin-sdk/provider-bridge/acp";
 *
 * experimental_registerAcpDialect({
 *   id: "amp",
 *   toolIdentity: (event) => readAmpToolName(event),
 * });
 * ```
 *
 * The registration then names it: `acpDialect: "amp"`. A built-in id cannot
 * be replaced, and an id nothing registered falls back to the generic
 * dialect. The registry is one per host artifact, and a dialect's hooks are
 * unversioned — see docs/api_to_audit.md.
 *
 * Curated by hand — named exports only, never `export *`. Value exports
 * carry the `experimental_` prefix every new plugin API member ships with
 * (see docs/api_to_audit.md); types are unprefixed. Exports no plugin
 * consumes are not published: the surface grows with a consumer, not ahead
 * of one.
 */

/**
 * @deprecated The bridge reads the parsed `AcpLaunchSpec` directly; the
 * profile it used to derive from the spec carried the same fields under
 * other names, and nothing outside the bridge produced or consumed it. Kept
 * as an alias because 0.4.x published the name; scheduled for removal at the
 * next major (docs/api_to_audit.md).
 */
type AcpAgentProfile = AcpLaunchSpec;

export { acpAgentProbeSchema as experimental_acpAgentProbeSchema, acpLaunchSpecSchema as experimental_acpLaunchSpecSchema, experimental_providerBridge as experimental_acpProviderBridge, probeAcpAgent as experimental_probeAcpAgent, registerAcpDialect as experimental_registerAcpDialect };
export type { AgentModelCatalog as AcpAgentModelCatalog, AcpAgentProbe, AcpAgentProbeRequest, AcpAgentProfile, AcpClassifiedToolCall, AcpClientRequestOutcome, AcpDelegationReport, AcpDialect, AcpLaunchSpec, AcpToolCallContent, AcpToolCallStatus, AcpToolCallUpdateEvent, AcpToolIdentity, AcpToolKind };
