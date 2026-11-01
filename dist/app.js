// src/rpc-contract.ts
var rpcErrorCodes = [
  "forbidden",
  "not_found",
  "conflict",
  "invalid",
  "invalid_json",
  "invalid_input",
  "handler_error",
  "invalid_output",
  "non_json_result",
  "unknown_method",
  "transport_error",
  "invalid_response",
  "unknown_error"
];
var callErrorBrand = /* @__PURE__ */ Symbol.for("@workspace-core/plugin-sdk/rpc-call-error");
var experimental_PluginRpcCallError = class _experimental_PluginRpcCallError extends Error {
  /** Recognizes errors across the packed SDK's separately bundled entries. */
  static [Symbol.hasInstance](value) {
    return typeof value === "object" && value !== null && Reflect.get(value, callErrorBrand) === true && rpcErrorCodes.some((code) => code === Reflect.get(value, "code")) && typeof Reflect.get(value, "message") === "string";
  }
  code;
  issues;
  status;
  serverCode;
  constructor(args) {
    super(args.message);
    this.name = "experimental_PluginRpcCallError";
    Object.defineProperty(this, callErrorBrand, { value: true });
    this.code = args.code;
    this.issues = args.issues;
    this.status = args.status;
    this.serverCode = args.serverCode;
  }
  /** Normalize failures at the RPC boundary; preserves an existing client error. */
  static from(error, fallback = "transport_error") {
    if (error instanceof _experimental_PluginRpcCallError) return error;
    const record = typeof error === "object" && error !== null ? error : {};
    const rawCode = Reflect.get(record, "code");
    const code = rpcErrorCodes.find((value) => value === rawCode);
    const message = Reflect.get(record, "message");
    const status = Reflect.get(record, "status");
    const rawIssues = Reflect.get(record, "issues");
    const issues = [];
    if (Array.isArray(rawIssues))
      for (const issue of rawIssues) {
        if (typeof issue !== "object" || issue === null || typeof Reflect.get(issue, "message") !== "string")
          continue;
        const path = Reflect.get(issue, "path");
        if (path !== void 0 && (!Array.isArray(path) || !path.every(
          (part) => typeof part === "string" || typeof part === "number" && Number.isFinite(part)
        )))
          continue;
        issues.push({
          message: Reflect.get(issue, "message"),
          ...path === void 0 ? {} : { path }
        });
      }
    return new _experimental_PluginRpcCallError({
      code: code ?? (typeof rawCode === "string" ? "unknown_error" : fallback),
      message: typeof message === "string" ? message : typeof error === "string" ? error : "Plugin RPC request failed",
      ...issues.length === 0 ? {} : { issues },
      ...typeof status === "number" ? { status } : {},
      ...typeof rawCode === "string" && code === void 0 ? { serverCode: rawCode } : {}
    });
  }
};
var refusalBrand = /* @__PURE__ */ Symbol.for("@workspace-core/plugin-sdk/rpc-refusal");
var experimental_PluginRpcRefusal = class extends Error {
  [refusalBrand] = true;
  code;
  issues;
  constructor(args) {
    super(args.message);
    this.name = "experimental_PluginRpcRefusal";
    this.code = args.code;
    this.issues = args.issues;
  }
};

// src/thread-action-groups.ts
var experimental_THREAD_ACTION_GROUPS = {
  open: "1_open",
  state: "1_state",
  organize: "2_organize",
  settings: "3_settings",
  lifecycle: "4_lifecycle"
};

// src/thread-info-groups.ts
var experimental_THREAD_CONTEXT_SEGMENT_GROUPS = {
  thread: "1_thread",
  git: "3_git"
};
var experimental_THREAD_INFO_ROW_GROUPS = {
  thread: "1_thread",
  environment: "2_environment",
  git: "3_git",
  pullRequest: "4_pullRequest",
  lifecycle: "5_lifecycle"
};
var experimental_THREAD_INFO_SECTION_GROUPS = {
  related: "1_related",
  changes: "2_changes",
  storage: "3_storage"
};

// src/app.ts
function runtimeHost() {
  return globalThis.__bbPluginRuntime;
}
function installedApp() {
  return runtimeHost()?.pluginSdkApp;
}
function runtimeMember(name) {
  const member = installedApp()?.[name];
  if (member === void 0) {
    throw new Error(
      `@workspace-core/plugin-sdk/app: ${name} needs the bb app's plugin runtime. In tests, call installTestPluginRuntime() from @workspace-core/plugin-sdk/testing/app first.`
    );
  }
  return member;
}
function runtimeFunction(name) {
  const forward = (...args) => runtimeMember(name)(...args);
  return forward;
}
function runtimeComponent(name) {
  function RuntimeComponent(props) {
    const react = runtimeHost()?.react;
    if (react === void 0) {
      throw new Error(
        `@workspace-core/plugin-sdk/app: ${name} needs React on the bb plugin runtime. In tests, call installTestPluginRuntime() from @workspace-core/plugin-sdk/testing/app first.`
      );
    }
    return react.createElement(runtimeMember(name), props);
  }
  RuntimeComponent.displayName = name;
  return RuntimeComponent;
}
var experimental_Icon = runtimeComponent("experimental_Icon");
var experimental_ProviderIcon = runtimeComponent(
  "experimental_ProviderIcon"
);
var definePluginApp = (setup) => {
  const app = installedApp();
  if (app?.definePluginApp !== void 0) return app.definePluginApp(setup);
  if (typeof setup !== "function") {
    throw new Error("definePluginApp expects a setup function");
  }
  return Object.freeze({ __bbPluginApp: true, setup });
};
var ThreadChat = runtimeComponent("ThreadChat");
var Markdown = runtimeComponent("Markdown");
var experimental_FileLink = runtimeComponent("experimental_FileLink");
var UrlLink = runtimeComponent("UrlLink");
var experimental_NewThreadComposer = runtimeComponent(
  "experimental_NewThreadComposer"
);
var experimental_VoiceInputTextarea = runtimeComponent(
  "experimental_VoiceInputTextarea"
);
var experimental_ProviderModelPicker = runtimeComponent(
  "experimental_ProviderModelPicker"
);
var experimental_PermissionModePicker = runtimeComponent(
  "experimental_PermissionModePicker"
);
var experimental_BranchPicker = runtimeComponent(
  "experimental_BranchPicker"
);
var experimental_useBranches = runtimeFunction(
  "experimental_useBranches"
);
var experimental_useCheckoutState = runtimeFunction(
  "experimental_useCheckoutState"
);
var experimental_SourceCode = runtimeComponent(
  "experimental_SourceCode"
);
var experimental_Diff = runtimeComponent("experimental_Diff");
var experimental_InfoSection = runtimeComponent(
  "experimental_InfoSection"
);
var experimental_DetailRow = runtimeComponent(
  "experimental_DetailRow"
);
var experimental_InfoList = runtimeComponent("experimental_InfoList");
var experimental_InfoListRow = runtimeComponent(
  "experimental_InfoListRow"
);
var experimental_useRpcQuery = runtimeFunction(
  "experimental_useRpcQuery"
);
var experimental_useRpcKeyedQuery = runtimeFunction(
  "experimental_useRpcKeyedQuery"
);
var experimental_useRpcMutation = runtimeFunction(
  "experimental_useRpcMutation"
);
var experimental_useRpcRefresh = runtimeFunction(
  "experimental_useRpcRefresh"
);
var useRpc = runtimeFunction("useRpc");
var useRealtime = runtimeFunction("useRealtime");
var useRealtimeConnectionState = runtimeFunction(
  "useRealtimeConnectionState"
);
var useSettings = runtimeFunction("useSettings");
var useBbContext = runtimeFunction("useBbContext");
var experimental_usePluginId = runtimeFunction(
  "experimental_usePluginId"
);
var experimental_useQuestionFormHost = runtimeFunction(
  "experimental_useQuestionFormHost"
);
var useBbNavigate = runtimeFunction("useBbNavigate");
var experimental_useCanOpenFileExternally = runtimeFunction(
  "experimental_useCanOpenFileExternally"
);
var experimental_useAppPanel = runtimeFunction(
  "experimental_useAppPanel"
);
var experimental_useFixedTabTarget = runtimeFunction(
  "experimental_useFixedTabTarget"
);
var useComposer = runtimeFunction("useComposer");
var useComposers = runtimeFunction("useComposers");
var experimental_useComposerRenderer = runtimeFunction(
  "experimental_useComposerRenderer"
);
var experimental_useThreadTitleDisplayText = runtimeFunction(
  "experimental_useThreadTitleDisplayText"
);
var experimental_useComposerContributions = runtimeFunction(
  "experimental_useComposerContributions"
);
var experimental_useComposerMentionSearch = runtimeFunction(
  "experimental_useComposerMentionSearch"
);
var experimental_useComposerCommandSearch = runtimeFunction(
  "experimental_useComposerCommandSearch"
);
var experimental_ComposerRoot = runtimeComponent(
  "experimental_ComposerRoot"
);
var experimental_VoiceInputButton = runtimeComponent(
  "experimental_VoiceInputButton"
);
var experimental_VoiceRecordingBar = runtimeComponent(
  "experimental_VoiceRecordingBar"
);
var experimental_FailedVoiceRecordings = runtimeComponent(
  "experimental_FailedVoiceRecordings"
);
var experimental_ShortcutHint = runtimeComponent(
  "experimental_ShortcutHint"
);
var experimental_ImageLightbox = runtimeComponent(
  "experimental_ImageLightbox"
);
var experimental_PromptMentionIcon = runtimeComponent(
  "experimental_PromptMentionIcon"
);
var experimental_describePromptMention = runtimeFunction(
  "experimental_describePromptMention"
);
var experimental_promptMentionClipboardAttributes = runtimeFunction(
  "experimental_promptMentionClipboardAttributes"
);
var experimental_readPromptMentionClipboard = runtimeFunction(
  "experimental_readPromptMentionClipboard"
);
var experimental_PluginIcon = runtimeComponent(
  "experimental_PluginIcon"
);
var experimental_ThreadTitleText = runtimeComponent(
  "experimental_ThreadTitleText"
);
var useComposerView = runtimeFunction("useComposerView");
var experimental_useSidebarThreads = runtimeFunction(
  "experimental_useSidebarThreads"
);
var experimental_useSidebarThreadActions = runtimeFunction(
  "experimental_useSidebarThreadActions"
);
var experimental_useThreadActions = runtimeFunction(
  "experimental_useThreadActions"
);
var experimental_useArchiveEnvironmentThreads = runtimeFunction(
  "experimental_useArchiveEnvironmentThreads"
);
var experimental_useThreadActionRegistrations = runtimeFunction(
  "experimental_useThreadActionRegistrations"
);
var experimental_ThreadActionsMenu = runtimeComponent(
  "experimental_ThreadActionsMenu"
);
var experimental_ThreadActionsContextMenu = runtimeComponent(
  "experimental_ThreadActionsContextMenu"
);
var experimental_useExperiment = runtimeFunction(
  "experimental_useExperiment"
);
var experimental_useSidebarThreadSplit = runtimeFunction(
  "experimental_useSidebarThreadSplit"
);
var experimental_useSidebarNavigation = runtimeFunction(
  "experimental_useSidebarNavigation"
);
var experimental_useSidebarNavigationSplit = runtimeFunction(
  "experimental_useSidebarNavigationSplit"
);
var experimental_SidebarNavigationIcon = runtimeComponent(
  "experimental_SidebarNavigationIcon"
);
var useSidebarThreadDraft = runtimeFunction("useSidebarThreadDraft");
var useSidebarThreadDraftIds = runtimeFunction(
  "useSidebarThreadDraftIds"
);
var useSidebarThreadRowStatus = runtimeFunction(
  "useSidebarThreadRowStatus"
);
var useSidebarThreadRowStatuses = runtimeFunction(
  "useSidebarThreadRowStatuses"
);
var useSidebarSplitLayout = runtimeFunction("useSidebarSplitLayout");
var useSidebarThreadShortcut = runtimeFunction(
  "useSidebarThreadShortcut"
);
var ThreadTitle = runtimeComponent("ThreadTitle");
var experimental_ThreadStatusGlyph = runtimeComponent(
  "experimental_ThreadStatusGlyph"
);
var useEnvironmentProviders = runtimeFunction(
  "useEnvironmentProviders"
);
var useSdk = runtimeFunction("useSdk");
var experimental_useProviders = runtimeFunction(
  "experimental_useProviders"
);
var experimental_useCodeTheme = runtimeFunction(
  "experimental_useCodeTheme"
);
var experimental_copyToClipboard = runtimeFunction(
  "experimental_copyToClipboard"
);
var experimental_saveFile = runtimeFunction("experimental_saveFile");
export {
  Markdown,
  ThreadChat,
  ThreadTitle,
  UrlLink,
  definePluginApp,
  experimental_BranchPicker,
  experimental_ComposerRoot,
  experimental_DetailRow,
  experimental_Diff,
  experimental_FailedVoiceRecordings,
  experimental_FileLink,
  experimental_Icon,
  experimental_ImageLightbox,
  experimental_InfoList,
  experimental_InfoListRow,
  experimental_InfoSection,
  experimental_NewThreadComposer,
  experimental_PermissionModePicker,
  experimental_PluginIcon,
  experimental_PluginRpcCallError,
  experimental_PromptMentionIcon,
  experimental_ProviderIcon,
  experimental_ProviderModelPicker,
  experimental_ShortcutHint,
  experimental_SidebarNavigationIcon,
  experimental_SourceCode,
  experimental_THREAD_ACTION_GROUPS,
  experimental_THREAD_CONTEXT_SEGMENT_GROUPS,
  experimental_THREAD_INFO_ROW_GROUPS,
  experimental_THREAD_INFO_SECTION_GROUPS,
  experimental_ThreadActionsContextMenu,
  experimental_ThreadActionsMenu,
  experimental_ThreadStatusGlyph,
  experimental_ThreadTitleText,
  experimental_VoiceInputButton,
  experimental_VoiceInputTextarea,
  experimental_VoiceRecordingBar,
  experimental_copyToClipboard,
  experimental_describePromptMention,
  experimental_promptMentionClipboardAttributes,
  experimental_readPromptMentionClipboard,
  experimental_saveFile,
  experimental_useAppPanel,
  experimental_useArchiveEnvironmentThreads,
  experimental_useBranches,
  experimental_useCanOpenFileExternally,
  experimental_useCheckoutState,
  experimental_useCodeTheme,
  experimental_useComposerCommandSearch,
  experimental_useComposerContributions,
  experimental_useComposerMentionSearch,
  experimental_useComposerRenderer,
  experimental_useExperiment,
  experimental_useFixedTabTarget,
  experimental_usePluginId,
  experimental_useProviders,
  experimental_useQuestionFormHost,
  experimental_useRpcKeyedQuery,
  experimental_useRpcMutation,
  experimental_useRpcQuery,
  experimental_useRpcRefresh,
  experimental_useSidebarNavigation,
  experimental_useSidebarNavigationSplit,
  experimental_useSidebarThreadActions,
  experimental_useSidebarThreadSplit,
  experimental_useSidebarThreads,
  experimental_useThreadActionRegistrations,
  experimental_useThreadActions,
  experimental_useThreadTitleDisplayText,
  useBbContext,
  useBbNavigate,
  useComposer,
  useComposerView,
  useComposers,
  useEnvironmentProviders,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  useSdk,
  useSettings,
  useSidebarSplitLayout,
  useSidebarThreadDraft,
  useSidebarThreadDraftIds,
  useSidebarThreadRowStatus,
  useSidebarThreadRowStatuses,
  useSidebarThreadShortcut
};
