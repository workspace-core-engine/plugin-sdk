// Portable type declarations for `@workspace-core/plugin-sdk`. Unpublished BB
// workspace contracts are flattened; public subpaths may reuse the
// package root without requiring any other @core/* package.
//
// Confused by the API, or need a symbol that isn't here? Clone the BB repo
// and read the real source: https://github.com/get-bb/bb

import { z } from 'zod';
import { JsonValue as JsonValue$2, PluginComposerApi as PluginComposerApi$1, PluginComposerScope as PluginComposerScope$1, ComposerDraftSnapshot as ComposerDraftSnapshot$1, ComposerSelection as ComposerSelection$1, ComposerDraftReplacement as ComposerDraftReplacement$1, ComposerDraft as ComposerDraft$1, ComposerMention as ComposerMention$1, PluginComposerTextEffect as PluginComposerTextEffect$1 } from '@workspace-core/plugin-sdk';

interface JsonObject {
    [key: string]: JsonValue$1;
}
type JsonValue$1 = string | number | boolean | null | JsonValue$1[] | JsonObject;

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

declare const createThreadEnvironmentArgsSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    environmentId: z.ZodString;
    type: z.ZodLiteral<"reuse">;
}, z.core.$strip>, z.ZodObject<{
    hostId: z.ZodOptional<z.ZodString>;
    type: z.ZodLiteral<"host">;
    workspace: z.ZodDiscriminatedUnion<[z.ZodObject<{
        branch: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"existing">;
            name: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            baseBranch: z.ZodString;
            kind: z.ZodLiteral<"new">;
        }, z.core.$strict>], "kind">>;
        path: z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>;
        type: z.ZodLiteral<"unmanaged">;
    }, z.core.$strip>, z.ZodObject<{
        baseBranch: z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"named">;
            name: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"default">;
        }, z.core.$strip>], "kind">;
        type: z.ZodLiteral<"managed-worktree">;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"personal">;
    }, z.core.$strip>], "type">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"project-default">;
}, z.core.$strip>, z.ZodObject<{
    environmentProviderId: z.ZodString;
    inputs: z.ZodDefault<z.ZodNullable<z.ZodType<JsonValue$1, unknown, z.core.$ZodTypeInternals<JsonValue$1, unknown>>>>;
    machine: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
        hostId: z.ZodString;
        type: z.ZodLiteral<"existing">;
    }, z.core.$strip>, z.ZodObject<{
        inputs: z.ZodDefault<z.ZodNullable<z.ZodType<JsonValue$1, unknown, z.core.$ZodTypeInternals<JsonValue$1, unknown>>>>;
        machineProviderId: z.ZodString;
        type: z.ZodLiteral<"new">;
    }, z.core.$strip>], "type">>;
    type: z.ZodLiteral<"provider">;
}, z.core.$strip>], "type">;
type CreateThreadEnvironmentArgs = z.infer<typeof createThreadEnvironmentArgsSchema>;

/**
 * A value that survives a JSON round trip without coercion or data loss.
 *
 * Host boundaries still validate values at runtime because TypeScript cannot
 * exclude non-finite numbers and plugin bundles can bypass static types.
 */
type JsonValue = string | number | boolean | null | JsonValue[] | {
    [key: string]: JsonValue;
};

/** Where `useComposer()` writes. */
type PluginComposerScope = {
    kind: "thread";
    threadId: string;
} | {
    kind: "queued-message";
    threadId: string;
    queuedMessageId: string;
} | {
    kind: "new-thread";
    /** Root compose's effective selected project; null only while unresolved. */
    projectId: string | null;
};
/** The composer's text and the @-mention pills in it. */
interface ComposerDraft {
    text: string;
    mentions: readonly ComposerMention[];
}
/**
 * A composer attachment: an uploaded file, optionally owned by another
 * project, or an absolute path on one machine. Never both.
 */
type ComposerAttachment = {
    type: "localFile" | "localImage";
    path: string;
    name: string;
    mimeType?: string;
    /** Exact size in bytes; omit when unknown. Zero is treated as unknown. A wrong nonzero size can make the send fail when bb stages a file. */
    sizeBytes?: number;
} & ({
    /** Project that currently owns this uploaded path; omit for destination-relative attachments. */
    sourceProjectId?: string;
    hostId?: never;
} | {
    /** Machine whose absolute `path` this is; core rejects sending it to a thread on another machine. */
    hostId: string;
    sourceProjectId?: never;
});
/** The complete current draft. Snapshots and their entries are immutable. */
interface ComposerDraftSnapshot extends ComposerDraft {
    readonly attachments: readonly ComposerAttachment[];
}
/** Atomic text and mention replacement, optionally replacing uploaded attachments too. */
interface ComposerDraftReplacement extends ComposerDraft {
    /** Omit to preserve attachments; supply an empty array to remove them all. Does not upload or copy files. */
    attachments?: readonly ComposerAttachment[];
}
/**
 * One @-mention pill: its range in `ComposerDraft.text` plus everything the
 * host needs to recreate it, so a mention read from `draft` can be passed
 * back to `insert` unchanged.
 */
type ComposerMention = {
    from: number;
    to: number;
    label: string;
} & ({
    kind: "thread";
    threadId: string;
    projectId?: string;
} | {
    kind: "project";
    projectId: string;
} | {
    kind: "section";
    sectionId: string;
} | {
    kind: "path";
    path: string;
    source: "thread-storage" | "workspace";
    entryKind: "directory" | "file";
} | {
    kind: "command";
    trigger: "$" | "/";
    name: string;
    source: "command" | "skill";
    origin: "builtin" | "project" | "user";
    argumentHint: string | null;
} | {
    kind: "attachment";
    /** The stored path of a file attached to the same draft. */
    path: string;
} | {
    kind: "plugin";
    /** The plugin that owns the pill. */
    pluginId: string;
    /** The mention provider id that plugin registered. */
    provider: string;
    /** The item id the provider's `resolve` receives at send time. */
    id: string;
    icon?: string | null;
});
/**
 * What `insert` accepts: text, a mention read from `draft` (any kind), or one
 * of the calling plugin's own mentions (`{ provider, id, label }`, no `kind`).
 */
type ComposerInsertPart = string | ComposerMention | PluginComposerMention;
/** Where `insert` puts its content. */
interface ComposerInsertOptions {
    /**
     * `"cursor"` (default) inserts at the editor's selection, replacing any
     * selected text; the selection is kept while focus is elsewhere, and the
     * composer must be on screen. `"end"` inserts after the last character and
     * also works for a composer that is not on screen.
     */
    at?: "cursor" | "end";
    /** Put the content on its own paragraph, adding a paragraph break before and after only where text is adjacent. */
    block?: boolean;
}
/** Host-rendered paint applied to the editable composer text. */
interface PluginComposerTextEffect {
    className: string;
}
/** An @-mention pill bound to one of the calling plugin's mention providers. */
interface PluginComposerMention {
    /** Mention provider id registered by THIS plugin via `bb.ui.registerMentionProvider`. */
    provider: string;
    /** Item id your provider's `resolve` will receive at send time. */
    id: string;
    /** Pill text shown in the composer. */
    label: string;
}
/**
 * One composer: its state and the writes a plugin can make. `useComposer()`
 * returns the composer the calling surface belongs to — inside a composer
 * slot, that composer; in a thread's panels, that thread's composer;
 * elsewhere, the current route's draft (the thread in view, or the new-thread
 * draft).
 *
 * The handle is stable: the same composer returns the same object across
 * renders, and its methods always act on the current draft, so it is safe to
 * keep in effects, callbacks and async work. Its reactive fields (`text`,
 * `draft`, `selection`, `isEmpty`, …) re-render the calling component when they change;
 * depend on those fields, not on the handle, in memo dependency lists.
 *
 * A handle always writes to its own composer's draft. Thread and new-thread
 * drafts persist, so a write after the composer left the screen still lands
 * in that draft. When the draft no longer exists (a queued-message or
 * sent-message editor that closed), `insert`, `replace`, `removeMention`, `submit` and
 * `setSelection` throw "This composer is no longer available"; the older
 * text methods log a warning and do nothing.
 */
interface PluginComposerApi {
    /** Open this plugin's registered composer popup by popup id in this mounted composer. Returns false for an unavailable, suppressed or out-of-scope popup. */
    experimental_openPopup(popupId: string): boolean;
    /** Close this plugin's open popup in this composer and restore editor focus. Returns false if this plugin has no open popup. */
    experimental_closePopup(): boolean;
    scope: PluginComposerScope;
    /**
     * Stable identity for this composer's draft: the same across remounts and
     * reloads for thread and new-thread composers (including a `ThreadChat`),
     * and per editing session for queued-message and sent-message editors.
     */
    readonly key: string;
    /** `"compact"` in the collapsed single-line layout, otherwise `"expanded"`. */
    readonly layout: "compact" | "expanded";
    /** The thread's agent is running or stopping. Always false in a new-thread composer. */
    readonly isRunning: boolean;
    /** The composer is submitting right now. */
    readonly isSubmitting: boolean;
    /**
     * Pressing Enter would not submit right now: the same decision as the
     * host's send button (empty draft, uploads in progress, loading, a
     * selection or setup missing, a pending interaction, voice input, …).
     */
    readonly isSubmittingBlocked: boolean;
    /** The host's message for why submitting is blocked, or null when it is not. */
    readonly submittingBlockedReason: string | null;
    /** No text (ignoring whitespace), no mentions and no attachments. */
    readonly isEmpty: boolean;
    /** Attachments that have finished uploading. */
    readonly attachmentCount: number;
    /** Current plain text for this composer scope. */
    readonly text: string;
    /** The complete current draft, including uploaded attachments. Stable until the draft changes. */
    readonly draft: ComposerDraftSnapshot;
    /** Current picker values, or null when this composer has no pickers. Stable until a picker value changes. */
    readonly selection: ComposerSelection | null;
    /**
     * Replace text and mentions together in one committed change. An updater
     * receives the latest immutable snapshot, including attachments, and must
     * return its result synchronously. Returning that same snapshot is a no-op.
     * Omitted attachments are preserved; an explicit list replaces them, and
     * an empty list clears them. Does not infer or rebase mention ranges.
     * Ranges are non-overlapping UTF-16 offsets into the supplied text.
     * Invalid results, throwing updaters, and unavailable editors leave the
     * draft unchanged. Source project references on uploaded attachments are
     * preserved; core copies them into the destination project when the draft
     * is submitted. Does not focus or submit. Use `insert` for insertion at the
     * editor's cursor.
     */
    replace(next: ComposerDraftReplacement | ((current: ComposerDraftSnapshot) => ComposerDraftReplacement)): void;
    /**
     * Insert text and mentions. See {@link ComposerInsertOptions} for placement.
     * Mentions read from `draft` are recreated exactly; the calling plugin's
     * own `{ provider, id, label }` resolves through its mention provider.
     * Throws for another plugin's mention without `kind`, and for
     * `at: "cursor"` when the composer is not on screen.
     */
    insert(parts: ComposerInsertPart | readonly ComposerInsertPart[], options?: ComposerInsertOptions): void;
    /**
     * Apply a host-rendered effect to this composer's editable text, or clear it.
     * Effects are scoped to the calling plugin and automatically clear when the
     * slot unmounts or its composer scope changes.
     */
    setTextEffect(effect: PluginComposerTextEffect | null): void;
    /**
     * Lock or unlock editing for this composer. Locks are scoped to the calling
     * plugin and automatically release when the slot unmounts or its composer
     * scope changes.
     */
    setInputLock(locked: boolean): void;
    /** Subscribe to successful local submissions in this composer scope, including accepted queued messages. Failed sends and draft clearing do not notify. Dispose on unmount. */
    onSubmitted(listener: () => void): () => void;
    /** Focus the composer caret at the end of the draft. */
    focus(): void;
    /**
     * Submit this composer's draft through the composer's own send and steer
     * handlers, the ones Enter and modifier+Enter run, including a
     * provider handoff that creates a new thread. The draft's attachments and
     * @-mentions, and — in the new-thread composer — the provider, model,
     * reasoning level, service tier, permission mode and environment the user
     * has selected on screen, all travel with it.
     *
     * It submits only the draft, so it rejects an empty one, even where the
     * shortcut would steer the next queued message instead. Otherwise it runs
     * only when the matching shortcut would. While attachments are uploading it
     * waits for them, then checks again; it rejects if an upload fails. When
     * the shortcut could not submit, it rejects with the reason, a message safe
     * to show to the user. The composer must be on screen. The queued-message
     * and sent-message editors reject.
     *
     * Every option combines with the others. `experimental_mode` uses the
     * names `bb.sdk.threads.send` uses. Without it, submit does what Enter
     * does for this user, which may be to queue or to steer.
     * `"queue-if-active"` queues behind the running turn, or starts a turn.
     * `"steer-if-active"` adds the message to the running turn. Where nothing
     * can be steered, such as on an idle thread, it starts a turn.
     * `sendAt` makes the chosen action wait until the given time; a scheduled
     * steer steers whatever turn is running then. `experimental_data` is
     * opaque JSON delivered to dispatch hooks together with the calling
     * plugin's id on this initial attempt. Hooks run before operational core
     * waits. If a hook queues the message, its existing plugin wait identifies
     * the owner on later attempts; core does not persist or interpret the
     * opaque data.
     *
     * Resolves once the composer has accepted the submission and cleared the
     * draft. Failures of the underlying request show bb's usual error toast
     * and restore the draft, exactly as an interactive failure does, and then
     * reject with the toast's message.
     */
    submit(options?: ComposerSubmitOptions): Promise<void>;
    /**
     * Set this composer's pickers as if each value had been picked by hand.
     *
     * Every field is optional. An omitted field is left alone. A field this
     * composer has no picker for is ignored rather than rejected: a thread
     * composer has no project or environment; a provider without service tiers
     * has no tier; a fork draft locks its project, provider and environment.
     * Values travel through the same paths the pickers use, so in the
     * new-thread composer they become the remembered defaults for the next
     * thread and are reported as the user's explicit choices, and in a thread
     * composer a provider change starts the same handoff the picker starts:
     * the handoff block is prepended to the draft and the next send creates a
     * new thread. A same-provider model change in a thread does not start a
     * handoff, exactly like the picker.
     *
     * In the new-thread composer the project is switched first and awaited
     * (attachments are copied to the new project), then the environment and
     * machine are applied to the new project, then provider, model, reasoning
     * level, service tier and permission mode. A provider change reloads the
     * model catalog before the model and reasoning level are applied to it.
     * Because the project switch remounts plugin surfaces, the returned
     * promise is owned by the composer and still resolves after the calling
     * component has unmounted.
     *
     * Resolves with the composer's own selection once it has settled: the
     * applied values have committed and the model catalog for the selected
     * provider and machine has finished loading, so model, reasoning level and
     * permission mode have reconciled against it. The catalog wait is bounded;
     * if it has not finished after 15 seconds the promise resolves with the
     * selection as it stands. The result carries only the fields this composer
     * has, so a missing key means "no such picker here" and a value that
     * differs from the one passed was reconciled (a reasoning level the model
     * does not support, a service tier the model does not offer, a permission
     * mode above the machine's ceiling, a model the provider does not list). A provider the composer does not list is
     * ignored together with the model and reasoning level meant for it, so the
     * stored provider preference never names something the picker could not
     * have chosen. `environment` is absent while the composer
     * has no submittable environment; `providerId` and `model` are absent
     * while nothing is selected; `serviceTier` is present only when the
     * selected provider has tiers and one is chosen.
     *
     * Rejects, with a message safe to show to the user, in a composer with no
     * pickers at all (a queued-message editor, a side chat, a plugin surface
     * mounted outside any composer), when the calling surface is no longer
     * active, and when a value is not a known reasoning level or permission
     * mode, or is an empty service tier.
     */
    setSelection(selection: ComposerSelection): Promise<ComposerSelection>;
}
/**
 * Current picker values in `selection`, input for `setSelection`, and the shape it resolves with. Field names match `NewThreadRequest` and the `default*` props of
 * `experimental_NewThreadComposer`, so one routed decision can feed the
 * composer, the embedded composer and `bb.sdk.threads.spawn` alike.
 */
interface ComposerSelection {
    /** New-thread composers only. BB's personal-project id means "Don't work in a project". */
    projectId?: string;
    /**
     * New-thread composers only. `{ type: "project-default" }` and a `host`
     * environment without a `hostId` seed nothing and are ignored. Provider
     * `inputs` are not applied; the provider's own inputs control keeps its
     * value, and the result reports what the composer would submit.
     */
    environment?: CreateThreadEnvironmentArgs;
    /** A provider the composer does not list is ignored, and `model` and `reasoningLevel` with it. */
    providerId?: string;
    /** Applied only when the composer ends up on the requested provider (or none was requested). */
    model?: string;
    /** Applied only when the composer ends up on the requested provider (or none was requested). */
    reasoningLevel?: ReasoningLevel;
    /**
     * A tier id the provider declares (`"default"`, `"fast"`, …). Ignored by a
     * provider with no service tiers; a tier the selected model does not offer
     * becomes `"default"`.
     */
    serviceTier?: ServiceTier;
    permissionMode?: PermissionMode;
}
/** What `submit` adds to pressing Enter. Every field combines with the others. */
interface ComposerSubmitOptions {
    /**
     * `"queue-if-active"` queues behind the running turn and
     * `"steer-if-active"` adds to it; both start a turn when none is running.
     * Omitted, it does what Enter does for this user.
     */
    experimental_mode?: "queue-if-active" | "steer-if-active";
    /** Epoch ms in the future; the action waits until then. */
    sendAt?: number;
    /**
     * Opaque JSON delivered to dispatch hooks with the calling plugin's id on
     * the initial dispatch attempt.
     */
    experimental_data?: JsonValue;
}

declare function reconcileComposerMentions(currentText: string, nextText: string, mentions: readonly ComposerMention[]): ComposerMention[];

type DraftTarget = Pick<ComposerHandleTarget, "focus" | "getDraft" | "isAvailable" | "setDraft">;
declare function createComposerDraftActions(target: () => DraftTarget): Pick<PluginComposerApi, "draft" | "focus" | "replace">;

interface ComposerEditorState {
    layout: "compact" | "expanded";
    isRunning: boolean;
    isSubmitting: boolean;
    isSubmittingBlocked: boolean;
    submittingBlockedReason: string | null;
    isAttaching: boolean;
    attachmentError: string | null;
}
interface ComposerSubmitExtras {
    sendAt?: number;
    pluginSubmission?: {
        pluginId: string;
        data: JsonValue$2;
    };
}
interface ComposerEditorSubmission extends ComposerSubmitExtras {
    mode: "enter" | "queue-if-active" | "steer-if-active";
}
interface ComposerHandleTarget {
    key: string;
    scope: PluginComposerScope$1;
    getDraft(): ComposerDraftSnapshot$1;
    getAttachmentCount(): number;
    getSelection(): ComposerSelection$1 | null;
    setDraft(next: ComposerDraftReplacement$1): void;
    addQuote(text: string): void;
    getEditorState(): ComposerEditorState;
    subscribeEditorState(listener: () => void): () => void;
    insertAtCursor(value: ComposerDraft$1, block: boolean): boolean;
    isAvailable(): boolean;
    focus(): void;
    openPopup?(pluginId: string, popupId: string): boolean;
    closePopup?(pluginId: string): boolean;
    /**
     * Runs the on-screen composer's own Enter, queue or steer handler with the
     * submission's extras, or returns null when no composer box is mounted.
     */
    editorSubmit(submission: ComposerEditorSubmission): Promise<void> | null;
    setSelection?(selection: ComposerSelection$1): Promise<ComposerSelection$1>;
}
interface ComposerHandleController {
    pluginId: string;
    target: ComposerHandleTarget;
    mentionText(mention: ComposerMention$1): string;
    setTextEffect(effect: PluginComposerTextEffect$1 | null): void;
    setInputLock(locked: boolean): void;
    onSubmitted(listener: () => void): () => void;
}
interface ComposerHandleBinding {
    key: string;
    handle: PluginComposerApi$1;
    update(controller: ComposerHandleController): void;
}
declare const OFF_SCREEN_EDITOR_STATE: ComposerEditorState;
declare function appendComposerDraft(current: ComposerDraft$1, value: ComposerDraft$1, block: boolean): ComposerDraft$1;
declare function createComposerHandleBinding(key: string, initial: ComposerHandleController): ComposerHandleBinding;

export { OFF_SCREEN_EDITOR_STATE, appendComposerDraft, createComposerDraftActions, createComposerHandleBinding, reconcileComposerMentions };
export type { ComposerEditorState, ComposerEditorSubmission, ComposerHandleBinding, ComposerHandleController, ComposerHandleTarget, ComposerSubmitExtras };
