// Portable type declarations for `@workspace-core/plugin-sdk`. Unpublished BB
// workspace contracts are flattened; public subpaths may reuse the
// package root without requiring any other @core/* package.
//
// Confused by the API, or need a symbol that isn't here? Clone the BB repo
// and read the real source: https://github.com/get-bb/bb

import * as _workspace_core_plugin_sdk from '@workspace-core/plugin-sdk';
import { ExperimentalSidebarFooterItemRegistration, PluginNavPanelRegistration, PluginProviderIconRegistration, PluginHomepageSectionRegistration, PluginSettingsSectionRegistration, ExperimentalAppOverlayRegistration, ExperimentalTabRegistration, PluginNewThreadPanelActionRegistration, ComposerCustomization, PluginPendingInteractionRegistration, PluginSidebarFooterActionRegistration, PluginThreadListRegistration, ExperimentalSidebarNavigationRegistration, PluginThreadHeaderActionRegistration, ExperimentalThreadContextSegmentRegistration, ExperimentalThreadInfoRowRegistration, ExperimentalThreadInfoSectionRegistration, PluginThreadActionRegistration, ExperimentalPluginBrowserToolbarActionRegistration, PluginFileOpenerRegistration, PluginSourceCodeRendererRegistration, PluginDiffRendererRegistration, ExperimentalComposerRegistration, PluginMessageDirectiveRegistration, ExperimentalCodeFenceRendererRegistration, PluginMessageActionRegistration, ExperimentalIconRegistration, PluginTimelineRendererRegistration, PluginEnvironmentProviderInputsRegistration, PluginMachineProviderInputsRegistration, PluginContentScriptRegistration, ComposerDraftSnapshot, PluginComposerScope, ComposerSelection, PluginComposerTextEffect, PluginComposerMention, ComposerSubmitOptions, ExperimentalClipboardContent, PluginComposerThreadRowStatus, BbNavigate, ExperimentalFileOpenOptions, PluginAppDefinition, PluginRpcContract, StandardSchemaV1InferInput, PluginRpcResult, PluginBrowserBbSdk, PluginRealtimeConnectionState, ComposerMention, ComposerAttachment, PluginSidebarThreadsState, PluginProvidersState, PluginCodeThemeState, BranchesState, CheckoutState, PluginSidebarThreadRowStatus, PluginSidebarThreadShortcut, PluginSidebarSplitLayout, ExperimentalComposerRendererApi, ExperimentalSidebarNavigationItem, PluginThreadActionTarget, PluginThreadActionEntry, PluginThreadActionRegistrationInfo, PluginEnvironmentProvidersState, ExperimentalLiveFileTarget, ExperimentalPanelController, JsonValue, ExperimentalPageTitle, ExperimentalOpenTabOptions, ExperimentalSidebarNavigationActions, ExperimentalSidebarNavigationTarget } from '@workspace-core/plugin-sdk';
import { ComponentType, ReactNode } from 'react';
import { RenderResult } from '@testing-library/react';

type ExperimentalSidebarFooterCommandKind = "close" | "open" | "toggle";
interface ExperimentalSidebarFooterRuntimeSnapshot {
    command: {
        sequence: number;
        kind: ExperimentalSidebarFooterCommandKind;
    } | null;
}
interface ExperimentalSidebarFooterItemRuntime {
    subscribe(listener: () => void): () => void;
    getSnapshot(): ExperimentalSidebarFooterRuntimeSnapshot;
    acknowledgeCommand(sequence: number): void;
}
type CollectedExperimentalSidebarFooterItem = ExperimentalSidebarFooterItemRegistration & {
    runtime: ExperimentalSidebarFooterItemRuntime;
};

interface LegacyThreadPanelActionRegistration {
    id: string;
    title: string;
    icon?: string;
    component: ComponentType<_workspace_core_plugin_sdk.ExperimentalThreadActionTabProps>;
    layout?: "flush" | "padded";
    run?(context: _workspace_core_plugin_sdk.ExperimentalThreadTabActionContext): void | Promise<void>;
}
type LegacyNavPanelRegistration = PluginNavPanelRegistration & {
    fixedTabs?: readonly PluginNavPanelFixedTabRegistration[];
};
type PluginNavPanelFixedTabRegistration = {
    id: string;
    panelId: string;
    title: string;
    icon: string;
    component: ComponentType<_workspace_core_plugin_sdk.PluginNavPanelProps>;
    layout?: "flush" | "padded";
    experimental_target?: _workspace_core_plugin_sdk.ExperimentalFixedTabTargetContract<_workspace_core_plugin_sdk.JsonValue>;
};
type CollectedPluginProviderIconRegistration = Omit<PluginProviderIconRegistration, "providerKind"> & {
    providerKind: PluginProviderIconRegistration["providerKind"] | "all";
};

/**
 * `@workspace-core/plugin-sdk/testing/app` — the frontend plugin test harness. Tests a
 * plugin's `app.tsx` source directly under vitest + jsdom, without the bb
 * host or the esbuild bundle:
 *
 * - {@link installTestPluginRuntime} fills `globalThis.__bbPluginRuntime.
 *   pluginSdkApp` with a test implementation of the `@workspace-core/plugin-sdk/app`
 *   surface (the same seam `bb plugin build` shims to the real app). The
 *   `@workspace-core/plugin-sdk/app` exports look the runtime up when they are called
 *   or rendered, so import order does not matter: install the runtime any time
 *   before the first hook runs ({@link loadPluginApp} and {@link renderSlot}
 *   install it for you).
 * - {@link loadPluginApp} runs the definition's setup against a validating
 *   collector (ported from the BB app's interpreter, same error messages)
 *   and returns the typed slot registrations.
 * - {@link renderSlot} mounts one registration's component with mock hook
 *   backends: rpc as a method→handler map with a call log, realtime as a
 *   channel you can push events into, settings/context as plain values, and
 *   navigate/composer as recorders. Its `behavior`, `inspection`, and
 *   `lifecycle` views separate host inputs, assertions, and mount controls;
 *   the existing direct members remain aliases.
 *
 * Add `// @vitest-environment jsdom` to test files using renderSlot.
 */
interface RpcCall {
    method: string;
    input: unknown;
}
/** One recorded `useSdk()` call, as `"<area>.<method>"` plus its arguments. */
interface SdkCall {
    method: string;
    args: unknown[];
}
type PluginSdkFakeTree<T> = {
    [Key in keyof T]?: T[Key] extends (...args: never[]) => unknown ? T[Key] : PluginSdkFakeTree<T[Key]>;
};
/**
 * Nested partial fakes for `useSdk()`, mirroring the client's areas and
 * sub-areas (`{ threads: { queuedMessages: { create } } }`). Provide only the
 * methods the slot calls; a call to anything else throws with the missing
 * dot-path so the test fails loudly instead of returning undefined.
 */
type PluginSdkTestFakes = PluginSdkFakeTree<PluginBrowserBbSdk>;
type NavigateCall = {
    method: "toThread";
    threadId: string;
    options?: Parameters<BbNavigate["toThread"]>[1];
} | {
    method: "toProject";
    projectId: string;
} | {
    method: "toPluginPanel";
    path: string;
    options?: {
        subPath?: string;
        replace?: boolean;
    };
} | {
    method: "toCompose";
    options?: Parameters<BbNavigate["toCompose"]>[0];
} | {
    method: "openUrl";
    url: string;
} | {
    method: "experimental_openFilePreview";
    options: ExperimentalFileOpenOptions;
} | {
    method: "experimental_openFileExternally";
    options: ExperimentalFileOpenOptions;
} | {
    method: "experimental_openTerminal";
    options: Parameters<BbNavigate["experimental_openTerminal"]>[0];
};
type ExperimentalPanelCall = {
    method: "openTab" | "toggleTab";
    options: ExperimentalOpenTabOptions;
} | {
    method: "close";
};
interface ComposerLog {
    /** Latest plain text in this isolated composer scope. */
    readonly text: string;
    /**
     * Latest text and mention pills, as `useComposer().draft` reports them.
     * The harness composer has no caret, so cursor inserts land at the end.
     */
    readonly draft: ComposerDraftSnapshot;
    /** The key `useComposer().key` reports for the current scope. */
    readonly key: string;
    /** Latest host-provided composer scope. */
    readonly scope: PluginComposerScope;
    /** Current picker snapshot, or null for a composer without pickers. */
    readonly selection: ComposerSelection | null;
    /** Latest host-provided attachment count exposed through `useComposerView()`. */
    readonly attachmentCount: number;
    /** Latest host-rendered text effect requested by the plugin. */
    textEffect: PluginComposerTextEffect | null;
    textEffectCalls: Array<PluginComposerTextEffect | null>;
    /** Whether this plugin currently holds the composer input lock. */
    inputLocked: boolean;
    inputLockCalls: boolean[];
    quotes: string[];
    mentions: PluginComposerMention[];
    focusCount: number;
    /**
     * Every `submit` the plugin ran, in order. The harness composer has no
     * submit pipeline of its own, so it records the options and clears the
     * draft — enough to assert what a picker scheduled and that it tidied up.
     */
    submits: ComposerSubmitOptions[];
    /**
     * Every `setSelection` the harness composer accepted, in order. The
     * harness has no pickers of its own, so it merges accepted fields into
     * its current selection and returns that snapshot. A thread drops
     * project and environment because it has no pickers for them. The
     * queued-message scope rejects, as the app does.
     */
    selections: ComposerSelection[];
}
/**
 * What `experimental_useThreadActions(thread)` returns in a test, in menu
 * order; the host's own actions are not emulated. `requestRename` is the
 * caller's rename editor (a no-op when it passed none), for entries whose
 * `run` renames. The fake applies `keys`. Omitted → an empty list. The fake
 * `experimental_ThreadActionsMenu` opens on a trigger click and the fake
 * context menu on right-click; each lists these entries and its `inline`
 * items as `menuitem` buttons, and closes after one runs (calling
 * `onOpenChange(false)` and `onCloseAutoFocus`).
 */
type TestThreadActionsResolver = (thread: PluginThreadActionTarget, options: {
    requestRename(threadId: string): void;
}) => readonly PluginThreadActionEntry[];
/**
 * What the fake `experimental_ThreadActionsContextMenu` lists when its
 * `experimental_bulkThreads` has two or more threads, in menu order; the host's
 * own actions are not emulated. That menu is labelled `Actions for N threads`,
 * lists these entries and its `inline` items as `menuitem` buttons, closes
 * after one runs, and calls `onEscapeKeyDown` and closes on Escape. Omitted →
 * an empty list.
 */
type TestThreadBulkActionsResolver = (threads: readonly PluginThreadActionTarget[]) => readonly PluginThreadActionEntry[];
/**
 * One recorded `experimental_useSidebarNavigation()` action, or a split drag
 * started from `experimental_useSidebarNavigationSplit()` (`beginSplitDrag`).
 */
interface SidebarNavigationCall {
    method: keyof ExperimentalSidebarNavigationActions | "beginSplitDrag";
    itemId?: string;
    itemIds?: string[];
    isVisible?: boolean;
    target?: ExperimentalSidebarNavigationTarget;
}
type TestClipboard = (content: ExperimentalClipboardContent) => Promise<boolean>;
/**
 * Install the test runtime at `globalThis.__bbPluginRuntime.pluginSdkApp`,
 * plus the React the `@workspace-core/plugin-sdk/app` components render through.
 * Idempotent per module instance. Call it before the first SDK hook runs or
 * SDK component renders; when the plugin's modules are imported does not
 * matter.
 */
declare function installTestPluginRuntime(): void;
interface CapturedPluginApp {
    homepageSections: PluginHomepageSectionRegistration[];
    settingsSections: PluginSettingsSectionRegistration[];
    appOverlays: ExperimentalAppOverlayRegistration[];
    navPanels: LegacyNavPanelRegistration[];
    tabs: ExperimentalTabRegistration[];
    threadPanelActions: LegacyThreadPanelActionRegistration[];
    newThreadPanelActions: PluginNewThreadPanelActionRegistration[];
    composerCustomizations: ComposerCustomization[];
    pendingInteractions: PluginPendingInteractionRegistration[];
    sidebarFooterActions: PluginSidebarFooterActionRegistration[];
    experimentalSidebarFooterItems: CollectedExperimentalSidebarFooterItem[];
    threadLists: PluginThreadListRegistration[];
    experimentalSidebarNavigations: ExperimentalSidebarNavigationRegistration[];
    threadHeaderActions: PluginThreadHeaderActionRegistration[];
    threadContextSegments: ExperimentalThreadContextSegmentRegistration[];
    threadInfoRows: ExperimentalThreadInfoRowRegistration[];
    threadInfoSections: ExperimentalThreadInfoSectionRegistration[];
    threadActions: PluginThreadActionRegistration<unknown>[];
    browserToolbarActions: ExperimentalPluginBrowserToolbarActionRegistration[];
    fileOpeners: PluginFileOpenerRegistration[];
    sourceCodeRenderers: PluginSourceCodeRendererRegistration[];
    diffRenderers: PluginDiffRendererRegistration[];
    composers: ExperimentalComposerRegistration[];
    messageDirectives: PluginMessageDirectiveRegistration[];
    codeFenceRenderers: ExperimentalCodeFenceRendererRegistration[];
    messageActions: PluginMessageActionRegistration[];
    providerIcons: CollectedPluginProviderIconRegistration[];
    icons: ExperimentalIconRegistration[];
    timelineRenderers: PluginTimelineRendererRegistration[];
    environmentProviderInputs: PluginEnvironmentProviderInputsRegistration[];
    machineProviderInputs: PluginMachineProviderInputsRegistration[];
    contentScripts: PluginContentScriptRegistration[];
}
type PluginAppModule = {
    default: unknown;
};
type PluginAppSource = PluginAppDefinition | PluginAppModule | (() => Promise<PluginAppDefinition | PluginAppModule>);
/**
 * Install the test runtime, resolve the plugin app definition, and capture
 * its slot registrations. Pass the imported module, its default export, or a
 * thunk (`() => import("../app.tsx")`).
 */
declare function loadPluginApp(source: PluginAppSource): Promise<CapturedPluginApp>;
interface ContentScriptTestMountOptions {
    pluginId: string;
    /** Defaults to 1. Pass the host generation you want the plugin to observe. */
    generation?: number;
    /**
     * Simulate an older compatible host that predates the optional experimental
     * thread-row status API. Current-host behavior is enabled by default.
     */
    omitExperimentalThreadRowStatus?: boolean;
    /**
     * Host result for `experimental_copyToClipboard()` writes, which are
     * recorded in `inspection.experimental_clipboardWrites` until another
     * mount or `renderSlot` takes the clipboard. Omitted → every write
     * succeeds.
     */
    experimental_copyToClipboard?: TestClipboard;
}
interface ContentScriptThreadRowStatusCall {
    threadId: string;
    status: PluginComposerThreadRowStatus | null;
}
interface MountedPluginContentScripts {
    inspection: {
        readonly mountedIds: readonly string[];
        readonly signal: AbortSignal;
        readonly disposed: boolean;
        readonly threadRowStatusCalls: readonly ContentScriptThreadRowStatusCall[];
        getThreadRowStatus(threadId: string): PluginComposerThreadRowStatus | null;
        /** Every `experimental_copyToClipboard()` write, in order. */
        readonly experimental_clipboardWrites: readonly ExperimentalClipboardContent[];
    };
    lifecycle: {
        /** Abort, then run returned cleanup functions once in reverse order. */
        dispose(): Promise<void>;
    };
}
/**
 * Mount captured content scripts with host-faithful ordering and rollback.
 * Call this once per simulated app window; each result owns an independent
 * AbortSignal and cleanup lifecycle.
 */
declare function mountPluginContentScripts(app: CapturedPluginApp, options: ContentScriptTestMountOptions): Promise<MountedPluginContentScripts>;
type PluginRpcTestHandlers<Contract extends PluginRpcContract> = {
    [Method in keyof Contract]: (input: StandardSchemaV1InferInput<Contract[Method]["input"]>) => PluginRpcResult<Contract[Method]> | Promise<PluginRpcResult<Contract[Method]>>;
};
interface RenderSlotOptions<Contract extends PluginRpcContract = PluginRpcContract> {
    /**
     * Backing handlers for `useRpc().call`: method name → implementation.
     * Inputs and results are JSON-round-tripped like the wire; a method
     * without a handler rejects, and a throwing handler rejects with its
     * message (what the real rpc client surfaces).
     */
    rpc?: PluginRpcTestHandlers<Contract>;
    experimental_rpcContract?: NoInfer<Contract>;
    /** `useSettings()` values; omitted → `{ values: undefined, isLoading: false }`. */
    settings?: Record<string, string | number | boolean>;
    /** `useBbContext()` selection; both default to null. */
    context?: {
        projectId?: string | null;
        threadId?: string | null;
    };
    /** `experimental_usePluginId()` value; defaults to `test-plugin`. */
    pluginId?: string;
    /** Initial `useRealtimeConnectionState()` value; defaults to `connected`. */
    realtimeConnectionState?: PluginRealtimeConnectionState;
    /** Initial state for this render's isolated composer scope and view. */
    composer?: {
        text?: string;
        /** Mention pills already in `text`, with ranges into it. */
        mentions?: readonly ComposerMention[];
        scope?: PluginComposerScope;
        attachmentCount?: number;
        attachments?: readonly ComposerAttachment[];
        layout?: "compact" | "expanded";
        isRunning?: boolean;
        isSubmitting?: boolean;
        selection?: ComposerSelection;
        /**
         * What `submittingBlockedReason` reports, and what `submit` rejects
         * with. Omitted → "Type a message first." while the draft is empty,
         * "Submitting..." while `isSubmitting`, otherwise null.
         */
        submittingBlockedReason?: string | null;
    };
    /**
     * Threads and projects `experimental_useSidebarThreads()` reports. Omitted →
     * a ready, empty list. Pass `{ status: "loading" }` to test that branch.
     */
    sidebarThreads?: Partial<PluginSidebarThreadsState>;
    /**
     * The provider directory `experimental_useProviders()` reports. Omitted →
     * a ready, empty list. Pass `{ status: "loading" }` to test that branch.
     */
    providers?: Partial<PluginProvidersState>;
    /**
     * The code theme `experimental_useCodeTheme()` reports. Omitted → a light
     * mode with no resolved document, the state a plugin sees on first paint.
     */
    codeTheme?: Partial<PluginCodeThemeState>;
    /**
     * Host result for `experimental_copyToClipboard()` writes, which are
     * recorded in `inspection.experimental_clipboardWrites` either way. The
     * clipboard is not slot-scoped: writes from anywhere (components, command
     * callbacks) go to the most recently rendered slot or mounted content
     * scripts. Omitted → every write succeeds.
     */
    experimental_copyToClipboard?: TestClipboard;
    branchesState?: Partial<BranchesState>;
    /** Checkout facts `experimental_useCheckoutState()` reports. */
    checkoutState?: Partial<CheckoutState>;
    /**
     * Thread ids `useSidebarThreadDraft()` and `useSidebarThreadDraftIds()`
     * report as holding an unsent draft. Omitted → none.
     */
    sidebarDraftThreadIds?: readonly string[];
    /** Experiment keys `experimental_useExperiment()` reports as on. Omitted → none. */
    experiments?: readonly string[];
    /**
     * Row statuses `useSidebarThreadRowStatus()` reports, keyed by thread id.
     * Omitted → every thread reports null.
     */
    sidebarRowStatuses?: Record<string, PluginSidebarThreadRowStatus>;
    /**
     * Shortcuts `useSidebarThreadShortcut()` reports, keyed by thread id, as
     * if the app command modifier were held. Omitted → every thread reports
     * null.
     */
    sidebarShortcuts?: Record<string, PluginSidebarThreadShortcut>;
    /** The split layout `useSidebarSplitLayout()` reports. Omitted → null. */
    sidebarSplitLayout?: PluginSidebarSplitLayout;
    /**
     * What `experimental_useComposerRenderer()` returns, as if the slot were
     * mounted as an `experimental_composer` replacement. Omitted → the hook
     * throws, as it does outside a composer replacement.
     */
    composerRenderer?: ExperimentalComposerRendererApi;
    /**
     * Items and the active item `experimental_useSidebarNavigation()` reports.
     * Omitted → no items. Actions are recorded in `sidebarNavigationCalls` and
     * do not change the items.
     */
    sidebarNavigation?: {
        items?: readonly ExperimentalSidebarNavigationItem[];
        activeItemId?: string | null;
        isHomeActive?: boolean;
        isShortcutModifierHeld?: boolean;
    };
    /**
     * What `experimental_useThreadActions()` reports for a thread, in menu
     * order. Omitted → an empty list.
     */
    threadActions?: TestThreadActionsResolver;
    /**
     * What `experimental_ThreadActionsContextMenu` lists for an
     * `experimental_bulkThreads`, in menu order. Omitted → an empty list.
     */
    threadBulkActions?: TestThreadBulkActionsResolver;
    /**
     * What `experimental_useThreadActionRegistrations()` reports. Omitted → an
     * empty list.
     */
    threadActionRegistrations?: readonly PluginThreadActionRegistrationInfo[];
    /**
     * The environment provider catalog `useEnvironmentProviders()` reports.
     * Omitted → a ready, empty list. Pass `{ status: "loading" }` to test that
     * branch.
     */
    environmentProviders?: Partial<PluginEnvironmentProvidersState>;
    /**
     * Fakes for `useSdk()`, one partial object per area. Calls are recorded
     * in `inspection.sdkCalls`; a call to a method you did not provide throws.
     */
    sdk?: PluginSdkTestFakes;
    /** Host acceptance for URL intents from the hook or `UrlLink`. */
    openUrl?: (url: string) => boolean;
    /** Host acceptance for preview intents from the hook or file link. */
    openFilePreview?: (options: ExperimentalFileOpenOptions) => boolean;
    /** Host acceptance for preferred-external file intents. */
    openFileExternally?: (options: ExperimentalFileOpenOptions) => boolean;
    /**
     * Answer for `experimental_useCanOpenFileExternally(target)`. Omitted →
     * false for every target.
     */
    canOpenFileExternally?: (target: ExperimentalLiveFileTarget) => boolean;
    /** Host acceptance for `useBbNavigate().experimental_openTerminal`. */
    openTerminal?: (options: Parameters<BbNavigate["experimental_openTerminal"]>[0]) => boolean;
    /**
     * Host acceptance for `experimental_useAppPanel()` calls, one handler per
     * method; an omitted method declines. An accepted `openTab` of a fixed tab
     * with a `target` makes that target visible to `experimental_useFixedTabTarget`.
     */
    experimental_panel?: Partial<ExperimentalPanelController>;
    /**
     * Initial session target visible to `experimental_useFixedTabTarget`.
     * Omit `panelId` for a thread fixed tab.
     */
    experimental_fixedTabTarget?: {
        panelId?: string;
        tabId: string;
        target: JsonValue;
    };
}
/** Host-originated inputs a slot test can drive deterministically. */
interface RenderedSlotBehaviorDrivers {
    /**
     * Push a realtime event to `useRealtime(channel, …)` subscribers, wrapped
     * in act. The payload is JSON-round-tripped like `bb.realtime.publish`.
     */
    experimental_invalidateRpc(tags: readonly string[] | null, pluginId?: string): Promise<void>;
    emitRealtime(channel: string, payload: unknown): Promise<void>;
    /** Drive the lifecycle of the same connection used by realtime events. */
    setRealtimeConnectionState(state: PluginRealtimeConnectionState): Promise<void>;
    /** Replace composer text as a host-originated edit, wrapped in act. */
    setComposerText(text: string): Promise<void>;
    /** Replace the scope snapshots returned by composer hooks, wrapped in act. */
    setComposerScope(scope: PluginComposerScope): Promise<void>;
}
/** Read-only call/write logs produced while the slot is mounted. */
interface RenderedSlotInspectionState {
    /** The registered page title hook's current result; null after unmount. */
    readonly experimental_pageTitle: ExperimentalPageTitle | null;
    /** Every `useRpc().call`, in order. */
    readonly rpcCalls: RpcCall[];
    /** Every `useBbNavigate()` call, in order. */
    readonly navigateCalls: NavigateCall[];
    /** Every `experimental_useAppPanel()` call, in order. */
    readonly experimental_panelCalls: ExperimentalPanelCall[];
    /**
     * Every `experimental_useSidebarNavigation()` action and navigation split
     * drag, in order.
     */
    readonly sidebarNavigationCalls: SidebarNavigationCall[];
    /**
     * The environment id of every `experimental_useArchiveEnvironmentThreads()`
     * call, in order.
     */
    readonly experimental_environmentArchiveCalls: string[];
    /** Every `useSdk()` call, in order, as `"<area>.<method>"`. */
    readonly sdkCalls: SdkCall[];
    /** Every `experimental_copyToClipboard()` write, in order. */
    readonly experimental_clipboardWrites: ExperimentalClipboardContent[];
    /** Everything written through `useComposer()`. */
    readonly composer: ComposerLog;
}
/** Explicit mount controls, separate from behavior inputs and call logs. */
interface RenderedSlotLifecycleControls {
    rerender(ui: ReactNode): void;
    unmount(): void;
}
/**
 * Testing Library result plus BB-specific helpers. Direct members are
 * retained for compatibility; named views make intent explicit in new tests.
 */
interface RenderedSlot extends RenderResult, RenderedSlotBehaviorDrivers, RenderedSlotInspectionState {
    readonly behavior: RenderedSlotBehaviorDrivers;
    readonly inspection: RenderedSlotInspectionState;
    readonly lifecycle: RenderedSlotLifecycleControls;
}
declare function renderSlot<Props extends object, Contract extends PluginRpcContract = PluginRpcContract>(registration: {
    component: ComponentType<Props>;
    experimental_usePageTitle?: (props: Props) => ExperimentalPageTitle | null;
}, props: Props, options?: RenderSlotOptions<Contract>): RenderedSlot;

export { installTestPluginRuntime, loadPluginApp, mountPluginContentScripts, renderSlot };
export type { CapturedPluginApp, ComposerLog, ContentScriptTestMountOptions, ContentScriptThreadRowStatusCall, MountedPluginContentScripts, NavigateCall, PluginAppSource, PluginRpcTestHandlers, PluginSdkTestFakes, RenderSlotOptions, RenderedSlot, RenderedSlotBehaviorDrivers, RenderedSlotInspectionState, RenderedSlotLifecycleControls, RpcCall, SdkCall, SidebarNavigationCall, TestThreadActionsResolver, TestThreadBulkActionsResolver };
