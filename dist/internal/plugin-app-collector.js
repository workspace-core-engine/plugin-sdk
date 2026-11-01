// src/internal/sidebar-footer-runtime.ts
var sidebarFooterCommandSequence = 0;
var SidebarFooterItemRuntime = class {
  listeners = /* @__PURE__ */ new Set();
  snapshot = {
    command: null
  };
  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = () => this.snapshot;
  acknowledgeCommand = (sequence) => {
    if (this.snapshot.command?.sequence !== sequence) return;
    this.snapshot = { ...this.snapshot, command: null };
    this.emit();
  };
  createDisclosureController() {
    return Object.freeze({
      open: () => this.request("open"),
      close: () => this.request("close"),
      toggle: () => this.request("toggle")
    });
  }
  request(kind) {
    sidebarFooterCommandSequence += 1;
    this.snapshot = {
      ...this.snapshot,
      command: { sequence: sidebarFooterCommandSequence, kind }
    };
    this.emit();
  }
  emit() {
    for (const listener of this.listeners) listener();
  }
};
function adaptSidebarFooterAction(registration) {
  return {
    source: "sidebarFooterAction",
    id: registration.id,
    label: registration.title,
    icon: registration.icon,
    kind: "action",
    onActivate: ({ openPluginDetails }) => registration.run({ openSettings: openPluginDetails }),
    runtime: new SidebarFooterItemRuntime()
  };
}
var sidebarFooterItemsByRegistrationSet = /* @__PURE__ */ new WeakMap();
function getCollectedSidebarFooterItems(registrations) {
  return sidebarFooterItemsByRegistrationSet.get(registrations) ?? null;
}

// src/internal/plugin-app-registration-collector.ts
import { z } from "zod";

// src/internal/composer-customization-validation.ts
var PLUGIN_SLOT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
var PLUGIN_MESSAGE_DIRECTIVE_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
function requireSlotId(kind, value) {
  if (typeof value !== "string" || !PLUGIN_SLOT_ID_PATTERN.test(value)) {
    throw new Error(
      `${kind}: "id" must match ${String(PLUGIN_SLOT_ID_PATTERN)}, got ${JSON.stringify(value)}`
    );
  }
  return value;
}
function requireEnvironmentProviderId(kind, value) {
  if (typeof value !== "string" || !PLUGIN_SLOT_ID_PATTERN.test(value)) {
    throw new Error(
      `${kind}: "environmentProviderId" must match ${String(PLUGIN_SLOT_ID_PATTERN)}, got ${JSON.stringify(value)}`
    );
  }
  return value;
}
function requireProviderId(kind, value) {
  if (typeof value !== "string" || !PLUGIN_SLOT_ID_PATTERN.test(value)) {
    throw new Error(
      `${kind}: "providerId" must match ${String(PLUGIN_SLOT_ID_PATTERN)}, got ${JSON.stringify(value)}`
    );
  }
  return value;
}
var PLUGIN_TIMELINE_RENDERER_KIND_PATTERN = /^(tool|[a-z0-9-]+\/[a-z0-9-]+)$/u;
function requireTimelineRendererKind(kind, value) {
  if (typeof value !== "string" || !PLUGIN_TIMELINE_RENDERER_KIND_PATTERN.test(value)) {
    throw new Error(
      `${kind}: "kind" must be "tool" or "<pluginId>/<name>" (lowercase letters, digits, "-"), got ${JSON.stringify(value)}`
    );
  }
  return value;
}
function requireMessageDirectiveId(kind, value) {
  if (typeof value !== "string" || !PLUGIN_MESSAGE_DIRECTIVE_ID_PATTERN.test(value)) {
    throw new Error(
      `${kind}: "id" must match ${String(PLUGIN_MESSAGE_DIRECTIVE_ID_PATTERN)}, got ${JSON.stringify(value)}`
    );
  }
  return value;
}
function requireNonEmptyString(kind, field, value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${kind}: "${field}" must be a non-empty string`);
  }
  return value;
}
function requireOptionalString(kind, field, value) {
  if (value !== void 0 && typeof value !== "string") {
    throw new Error(`${kind}: "${field}" must be a string when set`);
  }
  return value;
}
function requireComponent(kind, value) {
  if (typeof value !== "function") {
    throw new Error(`${kind}: "component" must be a React component function`);
  }
  return value;
}
function requireFunction(kind, field, value) {
  if (typeof value !== "function") {
    throw new Error(`${kind}: "${field}" must be a function`);
  }
  return value;
}
function requireUniqueId(kind, seen, id) {
  if (seen.has(id)) {
    throw new Error(`${kind}: duplicate id "${id}"`);
  }
  seen.add(id);
}
function parseContributionArray(kind, value, onRejected, parse, seenIds = /* @__PURE__ */ new Set()) {
  if (value === void 0) return void 0;
  if (!Array.isArray(value)) {
    onRejected(`${kind}: must be an array when set`);
    return void 0;
  }
  const parsed = [];
  for (const [index, entry] of value.entries()) {
    const entryKind = `${kind}[${index}]`;
    try {
      const parsedEntry = parse(entryKind, entry);
      requireUniqueId(entryKind, seenIds, parsedEntry.id);
      parsed.push(parsedEntry);
    } catch (error) {
      onRejected(error instanceof Error ? error.message : String(error));
    }
  }
  return parsed;
}
function parseMenuItem(entryKind, value) {
  const entry = value;
  const id = requireSlotId(entryKind, entry?.id);
  const icon = requireOptionalString(entryKind, "icon", entry?.icon);
  const description = requireOptionalString(
    entryKind,
    "description",
    entry?.description
  );
  const disabled = entry?.disabled;
  if (disabled !== void 0 && typeof disabled !== "boolean" && typeof disabled !== "function") {
    throw new Error(
      `${entryKind}: "disabled" must be a boolean or function when set`
    );
  }
  return {
    id,
    label: requireNonEmptyString(entryKind, "label", entry?.label),
    ...icon !== void 0 ? { icon } : {},
    ...description !== void 0 ? { description } : {},
    ...disabled !== void 0 ? { disabled } : {},
    run: requireFunction(entryKind, "run", entry?.run)
  };
}
function parseRegions(kind, registration, onRejected, seenPopupIds) {
  const actions = parseContributionArray(`${kind}.actions`, registration.actions, onRejected, (entryKind, value) => {
    const entry = value;
    return {
      id: requireSlotId(entryKind, entry?.id),
      component: requireComponent(entryKind, entry?.component)
    };
  });
  const banners = parseContributionArray(`${kind}.banners`, registration.banners, onRejected, (entryKind, value) => {
    const entry = value;
    const id = requireSlotId(entryKind, entry?.id);
    const chrome = entry?.chrome;
    if (chrome !== void 0 && chrome !== "card" && chrome !== "bare") {
      throw new Error(
        `${entryKind}: "chrome" must be "card" or "bare" when set`
      );
    }
    return {
      id,
      ...chrome !== void 0 ? { chrome } : {},
      component: requireComponent(entryKind, entry?.component)
    };
  });
  const plusMenu = parseContributionArray(
    `${kind}.plusMenu`,
    registration.plusMenu,
    onRejected,
    parseMenuItem
  );
  const sendMenu = parseContributionArray(
    `${kind}.sendMenu`,
    registration.sendMenu,
    onRejected,
    parseMenuItem
  );
  const popups = parseContributionArray(
    `${kind}.experimental_popups`,
    registration.experimental_popups,
    onRejected,
    (entryKind, value) => {
      const entry = value;
      return {
        id: requireSlotId(entryKind, entry?.id),
        label: requireNonEmptyString(entryKind, "label", entry?.label),
        component: requireComponent(entryKind, entry?.component)
      };
    },
    seenPopupIds
  );
  let richText;
  if (registration.richText !== void 0) {
    const raw = registration.richText;
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      onRejected(`${kind}.richText: must be an object when set`);
    } else {
      const effects = parseContributionArray(
        `${kind}.richText.effects`,
        raw.effects,
        onRejected,
        (entryKind, value) => {
          const entry = value;
          return {
            id: requireSlotId(entryKind, entry?.id),
            match: requireFunction(entryKind, "match", entry?.match),
            className: requireNonEmptyString(
              entryKind,
              "className",
              entry?.className
            )
          };
        }
      );
      const onDraftChange = raw.onDraftChange;
      if (onDraftChange !== void 0 && typeof onDraftChange !== "function") {
        onRejected(
          `${kind}.richText: "onDraftChange" must be a function when set`
        );
      }
      richText = {
        ...effects !== void 0 ? { effects } : {},
        ...typeof onDraftChange === "function" ? {
          onDraftChange
        } : {}
      };
    }
  }
  return {
    ...actions !== void 0 ? { actions } : {},
    ...banners !== void 0 ? { banners } : {},
    ...plusMenu !== void 0 ? { plusMenu } : {},
    ...sendMenu !== void 0 ? { sendMenu } : {},
    ...richText !== void 0 ? { richText } : {},
    ...popups !== void 0 ? { experimental_popups: popups } : {}
  };
}
function collectComposerCustomization(registration, seenIds, onRejected, seenPopupIds = /* @__PURE__ */ new Set()) {
  const kind = "composer.customize";
  try {
    const raw = registration;
    const id = requireSlotId(kind, raw?.id);
    const scopes = raw?.scopes;
    if (scopes !== void 0) {
      if (!Array.isArray(scopes)) {
        throw new Error(`${kind}: "scopes" must be an array when set`);
      }
      for (const scope of scopes) {
        if (scope !== "thread" && scope !== "queued-message" && scope !== "side-chat" && scope !== "new-thread") {
          throw new Error(
            `${kind}: invalid scope kind ${JSON.stringify(scope)}`
          );
        }
      }
    }
    requireUniqueId(kind, seenIds, id);
    return {
      id,
      ...scopes !== void 0 ? {
        scopes: scopes.filter(
          (scope) => scope !== "side-chat"
        )
      } : {},
      ...parseRegions(`${kind}(${id})`, raw ?? {}, onRejected, seenPopupIds)
    };
  } catch (error) {
    onRejected(error instanceof Error ? error.message : String(error));
    return null;
  }
}

// src/internal/plugin-app-registration-collector.ts
var CODE_FENCE_LANGUAGE_PATTERN = /^[a-z0-9][a-z0-9+#._-]*$/;
var SIDEBAR_FOOTER_ACTION_KEYS = /* @__PURE__ */ new Set([
  "id",
  "label",
  "icon",
  "kind",
  "onActivate"
]);
var SIDEBAR_FOOTER_DISCLOSURE_KEYS = /* @__PURE__ */ new Set([
  "id",
  "label",
  "icon",
  "kind",
  "component"
]);
var SidebarFooterCollector = class {
  constructor(collected, allCollected, seenIds) {
    this.collected = collected;
    this.allCollected = allCollected;
    this.seenIds = seenIds;
  }
  collected;
  allCollected;
  seenIds;
  register(registration) {
    const kind = "experimental_sidebarFooter.register";
    const id = requireSlotId(kind, registration?.id);
    requireUniqueId(kind, this.seenIds, id);
    const label = requireNonEmptyString(kind, "label", registration.label);
    const icon = requireNonEmptyString(kind, "icon", registration.icon);
    const runtime = new SidebarFooterItemRuntime();
    if (registration.kind === "action") {
      this.rejectUnknownKeys(kind, registration, SIDEBAR_FOOTER_ACTION_KEYS);
      if (typeof registration.onActivate !== "function") {
        throw new Error(`${kind}: "onActivate" must be a function`);
      }
      const item = {
        id,
        label,
        icon,
        kind: "action",
        onActivate: registration.onActivate,
        source: "experimental_sidebarFooter",
        runtime
      };
      this.collected.push(item);
      this.allCollected.push(item);
      return;
    }
    if (registration.kind === "disclosure") {
      this.rejectUnknownKeys(
        kind,
        registration,
        SIDEBAR_FOOTER_DISCLOSURE_KEYS
      );
      const item = {
        id,
        label,
        icon,
        kind: "disclosure",
        component: requireComponent(kind, registration.component),
        source: "experimental_sidebarFooter",
        runtime
      };
      this.collected.push(item);
      this.allCollected.push(item);
      return runtime.createDisclosureController();
    }
    throw new Error(`${kind}: "kind" must be "action" or "disclosure"`);
  }
  rejectUnknownKeys(kind, registration, allowed) {
    for (const key of Object.keys(registration)) {
      if (!allowed.has(key)) throw new Error(`${kind}: unknown field "${key}"`);
    }
  }
};
var NAV_PANEL_REGISTRATION_KEYS = {
  id: true,
  title: true,
  icon: true,
  path: true,
  component: true,
  fixedTabs: true,
  experimental_useBadge: true,
  experimental_usePageTitle: true,
  experimental_sidebar: true,
  headerContent: true
};
var RENAMED_NAV_PANEL_KEYS = /* @__PURE__ */ new Map([
  ["experimental_fixedTabs", 'was renamed to "fixedTabs" in SDK 0.4.16']
]);
var RETIRED_NAV_PANEL_KEYS = /* @__PURE__ */ new Map([
  [
    "experimental_sidebarAccessory",
    'is ignored: it was replaced by "experimental_useBadge", a hook returning a badge value, in SDK 0.6.53'
  ]
]);
function checkStaleNavPanelKeys(kind, registration, onWarning) {
  for (const key of Object.keys(registration)) {
    if (Object.hasOwn(NAV_PANEL_REGISTRATION_KEYS, key)) continue;
    const renamed = RENAMED_NAV_PANEL_KEYS.get(key);
    if (renamed !== void 0) {
      throw new Error(`${kind}: "${key}" ${renamed}`);
    }
    const retired = RETIRED_NAV_PANEL_KEYS.get(key);
    if (retired !== void 0) {
      onWarning(`${kind}: "${key}" ${retired}`);
      continue;
    }
    if (key.startsWith("experimental_")) {
      throw new Error(`${kind}: unknown field "${key}"`);
    }
  }
}
function createCommandShortcutSchema() {
  return z.object({
    key: z.string().min(1).max(32).refine(
      (key) => ![
        "Alt",
        "Control",
        "Meta",
        "OS",
        "Shift",
        "Dead",
        "Unidentified"
      ].includes(key)
    ),
    mod: z.boolean().default(false),
    meta: z.boolean().default(false),
    control: z.boolean().default(false),
    alt: z.boolean().default(false),
    shift: z.boolean().default(false)
  }).strict().refine(
    (shortcut) => shortcut.mod || shortcut.meta || shortcut.control || shortcut.alt || /^F(?:[1-9]|1[0-9]|2[0-4])$/u.test(shortcut.key),
    "Use Command, Control, or Alt with a key, or a function key"
  );
}
function requireOptionalOrder(kind, order) {
  if (order === void 0) return {};
  if (!Number.isFinite(order)) {
    throw new Error(`${kind}: "order" must be a finite number`);
  }
  return { order };
}
function collectTitledComponent(kind, seen, registration) {
  const id = requireSlotId(kind, registration?.id);
  requireUniqueId(kind, seen, id);
  const description = requireOptionalString(
    kind,
    "description",
    registration.description
  );
  return {
    id,
    title: requireNonEmptyString(kind, "title", registration.title),
    ...description !== void 0 ? { description } : {},
    component: requireComponent(kind, registration.component)
  };
}
function collectPanelAction(kind, seen, registration) {
  const id = requireSlotId(kind, registration?.id);
  requireUniqueId(kind, seen, id);
  if (registration.run !== void 0 && typeof registration.run !== "function") {
    throw new Error(`${kind}: "run" must be a function when set`);
  }
  if (registration.layout !== void 0 && registration.layout !== "padded" && registration.layout !== "flush") {
    throw new Error(`${kind}: "layout" must be "padded" or "flush"`);
  }
  return {
    id,
    title: requireNonEmptyString(kind, "title", registration.title),
    ...registration.icon !== void 0 ? { icon: requireNonEmptyString(kind, "icon", registration.icon) } : {},
    component: requireComponent(kind, registration.component),
    ...registration.layout !== void 0 ? { layout: registration.layout } : {},
    ...registration.run !== void 0 ? { run: registration.run } : {}
  };
}
function collectPluginAppRegistrations(definition, onWarning = (message) => console.warn(message)) {
  const commandShortcutSchema = createCommandShortcutSchema();
  const sidebarFooterItems = [];
  const collected = {
    homepageSections: [],
    settingsSections: [],
    appOverlays: [],
    navPanels: [],
    tabs: [],
    get threadPanelActions() {
      return this.tabs.filter(
        (tab) => tab.context.kind === "thread" && tab.availability === "action"
      );
    },
    newThreadPanelActions: [],
    composerCustomizations: [],
    pendingInteractions: [],
    sidebarFooterActions: [],
    experimentalSidebarFooterItems: [],
    threadLists: [],
    experimentalSidebarNavigations: [],
    threadHeaderActions: [],
    threadContextSegments: [],
    threadInfoRows: [],
    threadInfoSections: [],
    threadActions: [],
    browserToolbarActions: [],
    fileOpeners: [],
    sourceCodeRenderers: [],
    diffRenderers: [],
    composers: [],
    messageDirectives: [],
    codeFenceRenderers: [],
    messageActions: [],
    commandPaletteActions: [],
    providerIcons: [],
    icons: [],
    timelineRenderers: [],
    environmentProviderInputs: [],
    machineProviderInputs: [],
    contentScripts: []
  };
  sidebarFooterItemsByRegistrationSet.set(collected, sidebarFooterItems);
  const seenIds = {
    homepageSection: /* @__PURE__ */ new Set(),
    settingsSection: /* @__PURE__ */ new Set(),
    appOverlay: /* @__PURE__ */ new Set(),
    navPanel: /* @__PURE__ */ new Set(),
    tab: /* @__PURE__ */ new Set(),
    newThreadPanelAction: /* @__PURE__ */ new Set(),
    composerCustomization: /* @__PURE__ */ new Set(),
    composerPopup: /* @__PURE__ */ new Set(),
    pendingInteraction: /* @__PURE__ */ new Set(),
    sidebarFooterItem: /* @__PURE__ */ new Set(),
    threadList: /* @__PURE__ */ new Set(),
    sidebarNavigation: /* @__PURE__ */ new Set(),
    sidebarHeader: /* @__PURE__ */ new Set(),
    threadHeaderAction: /* @__PURE__ */ new Set(),
    threadContextSegment: /* @__PURE__ */ new Set(),
    threadInfoRow: /* @__PURE__ */ new Set(),
    threadInfoSection: /* @__PURE__ */ new Set(),
    threadAction: /* @__PURE__ */ new Set(),
    browserToolbarAction: /* @__PURE__ */ new Set(),
    fileOpener: /* @__PURE__ */ new Set(),
    sourceCodeRenderer: /* @__PURE__ */ new Set(),
    diffRenderer: /* @__PURE__ */ new Set(),
    composer: /* @__PURE__ */ new Set(),
    messageDirective: /* @__PURE__ */ new Set(),
    codeFenceRenderer: /* @__PURE__ */ new Set(),
    codeFenceLanguage: /* @__PURE__ */ new Set(),
    messageAction: /* @__PURE__ */ new Set(),
    command: /* @__PURE__ */ new Set(),
    providerIcon: /* @__PURE__ */ new Set(),
    timelineRenderer: /* @__PURE__ */ new Set(),
    environmentProviderInputs: /* @__PURE__ */ new Set(),
    machineProviderInputs: /* @__PURE__ */ new Set(),
    contentScript: /* @__PURE__ */ new Set()
  };
  function collectTab(value, legacy = false) {
    const registration = value;
    const kind = "slots.experimental_tab";
    const id = requireSlotId(kind, registration?.id);
    const context = registration.context;
    if (context?.kind !== "thread" && context?.kind !== "nav-panel") {
      throw new Error(`${kind}: context must be thread or nav-panel`);
    }
    if (context.kind === "nav-panel") requireSlotId(kind, context.panelId);
    const availability = registration.availability;
    if (availability !== "fixed" && availability !== "action") {
      throw new Error(`${kind}: availability must be fixed or action`);
    }
    requireUniqueId(
      kind,
      seenIds.tab,
      `${context.kind}/${context.kind === "nav-panel" ? context.panelId : ""}/${id}`
    );
    if (registration.useVisible !== void 0 && typeof registration.useVisible !== "function") {
      throw new Error(`${kind}: useVisible must be a function`);
    }
    if (availability === "fixed" && (registration.run !== void 0 || registration.params !== void 0)) {
      throw new Error(`${kind}: run and params require action availability`);
    }
    const target = registration.experimental_target;
    if (target !== void 0 && (availability !== "fixed" || typeof target?.validate !== "function")) {
      throw new Error(
        `${kind}: experimental_target requires a fixed tab and a validate function`
      );
    }
    const validated = {
      ...registration,
      ...collectPanelAction(kind, /* @__PURE__ */ new Set(), {
        ...registration,
        icon: legacy && registration.icon === "" ? void 0 : registration.icon
      }),
      icon: legacy && registration.icon === "" ? "" : requireNonEmptyString(kind, "icon", registration.icon),
      ...registration.tooltip === void 0 ? {} : {
        tooltip: requireNonEmptyString(
          kind,
          "tooltip",
          registration.tooltip
        )
      },
      ...availability === "action" && registration.params !== void 0 ? { params: z.json().parse(registration.params) } : {}
    };
    collected.tabs.push(validated);
  }
  function collectCommand(kind, registration) {
    const id = requireSlotId(kind, registration?.id);
    requireUniqueId(kind, seenIds.command, id);
    if (typeof registration.run !== "function") {
      throw new Error(`${kind}: "run" must be a function`);
    }
    return {
      id,
      defaultShortcut: registration.defaultShortcut === void 0 ? null : commandShortcutSchema.parse(registration.defaultShortcut),
      title: requireNonEmptyString(kind, "title", registration.title)
    };
  }
  function registerCommand(registration) {
    const kind = "commands.register";
    const command = collectCommand(kind, registration);
    if (registration.isAvailable !== void 0 && typeof registration.isAvailable !== "function") {
      throw new Error(`${kind}: "isAvailable" must be a function`);
    }
    collected.commandPaletteActions.push({
      target: "app",
      ...command,
      ...registration.isAvailable !== void 0 ? { isAvailable: registration.isAvailable } : {},
      run: registration.run
    });
  }
  function registerComposerCommand(registration) {
    collected.commandPaletteActions.push({
      target: "composer",
      ...collectCommand("composer.experimental_registerCommand", registration),
      run: registration.run
    });
  }
  const legacySidebarHeaders = [];
  const legacySlotAliases = {
    threadPanelAction(registration) {
      try {
        const action = collectPanelAction(
          "slots.threadPanelAction",
          /* @__PURE__ */ new Set(),
          registration
        );
        collectTab(
          {
            ...action,
            icon: action.icon ?? "",
            context: { kind: "thread" },
            availability: "action"
          },
          true
        );
      } catch (error) {
        onWarning(`Legacy threadPanelAction ignored: ${String(error)}`);
      }
    },
    experimental_sidebarHeader(registration) {
      legacySidebarHeaders.push(
        collectTitledComponent(
          "slots.experimental_sidebarHeader",
          seenIds.sidebarHeader,
          registration
        ).component
      );
    }
  };
  definition.setup({
    commands: { register: registerCommand },
    slots: {
      ...legacySlotAliases,
      homepageSection(registration) {
        const kind = "slots.homepageSection";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.homepageSection, id);
        collected.homepageSections.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          component: requireComponent(kind, registration.component)
        });
      },
      settingsSection(registration) {
        const kind = "slots.settingsSection";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.settingsSection, id);
        const title = requireOptionalString(kind, "title", registration.title);
        const description = requireOptionalString(
          kind,
          "description",
          registration.description
        );
        const page = registration.experimental_page;
        if (page !== void 0 && page !== "mobile") {
          throw new Error(`${kind}: experimental_page must be "mobile"`);
        }
        collected.settingsSections.push({
          ...page !== void 0 ? { experimental_page: page } : {},
          id,
          ...title !== void 0 ? { title } : {},
          ...description !== void 0 ? { description } : {},
          component: requireComponent(kind, registration.component)
        });
      },
      experimental_appOverlay(registration) {
        const kind = "slots.experimental_appOverlay";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.appOverlay, id);
        collected.appOverlays.push({
          id,
          component: requireComponent(kind, registration.component)
        });
      },
      navPanel(registration) {
        const kind = "slots.navPanel";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.navPanel, id);
        checkStaleNavPanelKeys(kind, registration, onWarning);
        const panelId = id;
        const path = requireNonEmptyString(kind, "path", registration.path);
        if (!PLUGIN_SLOT_ID_PATTERN.test(path)) {
          throw new Error(
            `${kind}: "path" must match ${String(PLUGIN_SLOT_ID_PATTERN)} (it becomes a URL segment), got ${JSON.stringify(path)}`
          );
        }
        if (registration.headerContent !== void 0 && typeof registration.headerContent !== "function") {
          throw new Error(
            `${kind}: "headerContent" must be a React component function when set`
          );
        }
        if (registration.experimental_useBadge !== void 0 && typeof registration.experimental_useBadge !== "function") {
          throw new Error(
            `${kind}: "experimental_useBadge" must be a React hook function when set`
          );
        }
        if (registration.experimental_sidebar !== void 0 && typeof registration.experimental_sidebar !== "function") {
          throw new Error(
            `${kind}: "experimental_sidebar" must be a React component function when set`
          );
        }
        if (registration.experimental_usePageTitle !== void 0 && typeof registration.experimental_usePageTitle !== "function") {
          throw new Error(
            `${kind}: "experimental_usePageTitle" must be a React hook function when set`
          );
        }
        const legacy = registration;
        const fixedTabs = [];
        if (legacy.fixedTabs !== void 0 && !Array.isArray(legacy.fixedTabs)) {
          onWarning("Legacy navPanel.fixedTabs ignored: expected an array");
        }
        for (const value of Array.isArray(legacy.fixedTabs) ? legacy.fixedTabs : []) {
          try {
            const id2 = requireSlotId(kind, value?.id);
            const tab = {
              id: id2,
              panelId,
              title: requireNonEmptyString(kind, "title", value.title ?? id2),
              icon: typeof value.icon === "string" ? value.icon : "",
              component: requireComponent(kind, value.component),
              ...value.layout === "flush" ? { layout: "flush" } : {},
              ...typeof value.experimental_target?.validate === "function" ? { experimental_target: value.experimental_target } : {}
            };
            collectTab(
              {
                ...tab,
                context: { kind: "nav-panel", panelId },
                availability: "fixed"
              },
              true
            );
            fixedTabs.push(tab);
          } catch (error) {
            onWarning(
              `Legacy navPanel.fixedTabs entry ignored: ${String(error)}`
            );
          }
        }
        collected.navPanels.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          icon: requireNonEmptyString(kind, "icon", registration.icon),
          path,
          ...fixedTabs.length === 0 ? {} : { fixedTabs },
          component: requireComponent(kind, registration.component),
          ...registration.experimental_useBadge !== void 0 ? {
            experimental_useBadge: registration.experimental_useBadge
          } : {},
          ...registration.experimental_usePageTitle !== void 0 ? {
            experimental_usePageTitle: registration.experimental_usePageTitle
          } : {},
          ...registration.experimental_sidebar !== void 0 ? { experimental_sidebar: registration.experimental_sidebar } : {},
          ...registration.headerContent !== void 0 ? { headerContent: registration.headerContent } : {}
        });
      },
      experimental_tab(registration) {
        collectTab(registration);
      },
      experimental_newThreadPanelAction(registration) {
        collected.newThreadPanelActions.push(
          collectPanelAction(
            "slots.experimental_newThreadPanelAction",
            seenIds.newThreadPanelAction,
            registration
          )
        );
      },
      pendingInteraction(registration) {
        const kind = "slots.pendingInteraction";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.pendingInteraction, id);
        collected.pendingInteractions.push({
          id,
          component: requireComponent(kind, registration.component)
        });
      },
      sidebarFooterAction(registration) {
        const kind = "slots.sidebarFooterAction";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.sidebarFooterItem, id);
        if (typeof registration.run !== "function") {
          throw new Error(`${kind}: "run" must be a function`);
        }
        const legacyRegistration = {
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          icon: requireNonEmptyString(kind, "icon", registration.icon),
          run: registration.run
        };
        collected.sidebarFooterActions.push(legacyRegistration);
        sidebarFooterItems.push(adaptSidebarFooterAction(legacyRegistration));
      },
      experimental_threadList(registration) {
        collected.threadLists.push(
          collectTitledComponent(
            "slots.experimental_threadList",
            seenIds.threadList,
            registration
          )
        );
      },
      experimental_sidebarNavigation(registration) {
        const kind = "slots.experimental_sidebarNavigation";
        const collectedRegistration = collectTitledComponent(
          kind,
          seenIds.sidebarNavigation,
          registration
        );
        const placement = registration.placement;
        if (placement !== void 0 && placement !== "rail" && placement !== "list") {
          throw new Error(`${kind}: "placement" must be "rail" or "list"`);
        }
        const headerComponent = registration.headerComponent;
        if (headerComponent !== void 0 && typeof headerComponent !== "function") {
          throw new Error(
            `${kind}: "headerComponent" must be a React component function`
          );
        }
        collected.experimentalSidebarNavigations.push({
          ...collectedRegistration,
          placement: placement ?? "list",
          ...headerComponent !== void 0 ? { headerComponent } : {}
        });
      },
      experimental_threadHeaderAction(registration) {
        const kind = "slots.experimental_threadHeaderAction";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.threadHeaderAction, id);
        collected.threadHeaderActions.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          component: requireComponent(kind, registration.component)
        });
      },
      experimental_threadContextSegment(registration) {
        const kind = "slots.experimental_threadContextSegment";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.threadContextSegment, id);
        const optionalComponent = (field) => {
          const value = registration[field];
          if (value === void 0) return {};
          if (typeof value !== "function") {
            throw new Error(
              `${kind}: "${field}" must be a React component function`
            );
          }
          return { [field]: value };
        };
        if (typeof registration.summary !== "function") {
          throw new Error(
            `${kind}: "summary" must be a React component function`
          );
        }
        if (registration.useVisible !== void 0 && typeof registration.useVisible !== "function") {
          throw new Error(`${kind}: "useVisible" must be a function`);
        }
        collected.threadContextSegments.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          group: requireNonEmptyString(kind, "group", registration.group),
          ...requireOptionalOrder(kind, registration.order),
          summary: registration.summary,
          ...optionalComponent("action"),
          ...optionalComponent("details"),
          ...registration.useVisible !== void 0 ? { useVisible: registration.useVisible } : {}
        });
      },
      experimental_threadInfoRow(registration) {
        const kind = "slots.experimental_threadInfoRow";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.threadInfoRow, id);
        collected.threadInfoRows.push({
          id,
          group: requireNonEmptyString(kind, "group", registration.group),
          ...requireOptionalOrder(kind, registration.order),
          component: requireComponent(kind, registration.component)
        });
      },
      experimental_threadInfoSection(registration) {
        const kind = "slots.experimental_threadInfoSection";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.threadInfoSection, id);
        collected.threadInfoSections.push({
          id,
          group: requireNonEmptyString(kind, "group", registration.group),
          ...requireOptionalOrder(kind, registration.order),
          component: requireComponent(kind, registration.component)
        });
      },
      experimental_threadAction(registration) {
        const kind = "slots.experimental_threadAction";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.threadAction, id);
        if (typeof registration.item !== "function") {
          throw new Error(`${kind}: "item" must be a function`);
        }
        if (registration.useData !== void 0 && typeof registration.useData !== "function") {
          throw new Error(`${kind}: "useData" must be a function`);
        }
        if (registration.experimental_bulkItem !== void 0 && typeof registration.experimental_bulkItem !== "function") {
          throw new Error(
            `${kind}: "experimental_bulkItem" must be a function`
          );
        }
        collected.threadActions.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          icon: requireNonEmptyString(kind, "icon", registration.icon),
          group: requireNonEmptyString(kind, "group", registration.group),
          ...requireOptionalOrder(kind, registration.order),
          ...registration.useData !== void 0 ? { useData: registration.useData } : {},
          item: registration.item,
          ...registration.experimental_bulkItem !== void 0 ? {
            experimental_bulkItem: registration.experimental_bulkItem
          } : {}
        });
      },
      experimental_browserToolbarAction(registration) {
        const kind = "slots.experimental_browserToolbarAction";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.browserToolbarAction, id);
        collected.browserToolbarActions.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          component: requireComponent(kind, registration.component)
        });
      },
      fileOpener(registration) {
        const kind = "slots.fileOpener";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.fileOpener, id);
        const rawExtensions = registration?.extensions;
        if (!Array.isArray(rawExtensions) || rawExtensions.length === 0) {
          throw new Error(
            `${kind}: "extensions" must be a non-empty array of lowercase extensions without the dot`
          );
        }
        const extensions = rawExtensions.map((extension) => {
          if (typeof extension !== "string" || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(extension)) {
            throw new Error(
              `${kind}: extensions must be lowercase alphanumerics with single underscores or hyphens between segments, without the dot, got ${JSON.stringify(extension)}`
            );
          }
          return extension;
        });
        collected.fileOpeners.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          extensions,
          component: requireComponent(kind, registration.component)
        });
      },
      experimental_sourceCodeRenderer(registration) {
        collected.sourceCodeRenderers.push(
          collectTitledComponent(
            "slots.experimental_sourceCodeRenderer",
            seenIds.sourceCodeRenderer,
            registration
          )
        );
      },
      experimental_diffRenderer(registration) {
        collected.diffRenderers.push(
          collectTitledComponent(
            "slots.experimental_diffRenderer",
            seenIds.diffRenderer,
            registration
          )
        );
      },
      experimental_composer(registration) {
        collected.composers.push(
          collectTitledComponent(
            "slots.experimental_composer",
            seenIds.composer,
            registration
          )
        );
      },
      messageDirective(registration) {
        const kind = "slots.messageDirective";
        const id = requireMessageDirectiveId(kind, registration?.id);
        requireUniqueId(kind, seenIds.messageDirective, id);
        collected.messageDirectives.push({
          id,
          component: requireComponent(kind, registration.component)
        });
      },
      experimental_codeFenceRenderer(registration) {
        const kind = "slots.experimental_codeFenceRenderer";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.codeFenceRenderer, id);
        const rawLanguages = registration.languages;
        if (!Array.isArray(rawLanguages) || rawLanguages.length === 0) {
          throw new Error(
            `${kind}: "languages" must be a non-empty array of lowercase info-string languages`
          );
        }
        const languages = rawLanguages.map((language) => {
          if (typeof language !== "string" || !CODE_FENCE_LANGUAGE_PATTERN.test(language)) {
            throw new Error(
              `${kind}: languages must match ${CODE_FENCE_LANGUAGE_PATTERN}, got ${JSON.stringify(language)}`
            );
          }
          if (seenIds.codeFenceLanguage.has(language)) {
            throw new Error(`${kind}: duplicate language "${language}"`);
          }
          seenIds.codeFenceLanguage.add(language);
          return language;
        });
        collected.codeFenceRenderers.push({
          id,
          languages,
          component: requireComponent(kind, registration.component)
        });
      },
      messageAction(registration) {
        const kind = "slots.messageAction";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.messageAction, id);
        if (typeof registration.run !== "function") {
          throw new Error(`${kind}: "run" must be a function`);
        }
        collected.messageActions.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          ...registration.icon !== void 0 ? {
            icon: requireNonEmptyString(kind, "icon", registration.icon)
          } : {},
          run: registration.run
        });
      },
      commandPaletteAction(registration) {
        registerCommand(registration);
      },
      experimental_providerIcon(registration) {
        const kind = "slots.experimental_providerIcon";
        const providerId = requireProviderId(kind, registration?.providerId);
        const declaredKind = registration.providerKind;
        if (declaredKind !== void 0 && declaredKind !== "agent" && declaredKind !== "machine" && declaredKind !== "environment") {
          throw new Error(`${kind}: invalid providerKind`);
        }
        const providerKind = declaredKind ?? "all";
        requireUniqueId(
          kind,
          seenIds.providerIcon,
          `${providerKind}:${providerId}`
        );
        collected.providerIcons.push({
          providerKind,
          providerId,
          icon: requireComponent(kind, registration.icon)
        });
      },
      experimental_timelineRenderer(registration) {
        const kind = "slots.experimental_timelineRenderer";
        const itemKind = requireTimelineRendererKind(kind, registration?.kind);
        requireUniqueId(kind, seenIds.timelineRenderer, itemKind);
        collected.timelineRenderers.push({
          kind: itemKind,
          component: requireComponent(kind, registration.component)
        });
      },
      experimental_environmentProviderInputs(registration) {
        const kind = "slots.experimental_environmentProviderInputs";
        const environmentProviderId = requireEnvironmentProviderId(
          kind,
          registration?.environmentProviderId
        );
        requireUniqueId(
          kind,
          seenIds.environmentProviderInputs,
          environmentProviderId
        );
        collected.environmentProviderInputs.push({
          environmentProviderId,
          component: requireComponent(kind, registration.component)
        });
      },
      experimental_machineProviderInputs(registration) {
        const kind = "slots.experimental_machineProviderInputs";
        const machineProviderId = requireProviderId(
          kind,
          registration?.machineProviderId
        );
        requireUniqueId(kind, seenIds.machineProviderInputs, machineProviderId);
        collected.machineProviderInputs.push({
          machineProviderId,
          component: requireComponent(kind, registration.component)
        });
      }
    },
    experimental_sidebarFooter: new SidebarFooterCollector(
      collected.experimentalSidebarFooterItems,
      sidebarFooterItems,
      seenIds.sidebarFooterItem
    ),
    composer: {
      customize(registration) {
        const customization = collectComposerCustomization(
          registration,
          seenIds.composerCustomization,
          (reason) => onWarning(`composer customization rejected: ${reason}`),
          seenIds.composerPopup
        );
        if (customization !== null) {
          collected.composerCustomizations.push(customization);
        }
      },
      experimental_registerCommand: registerComposerCommand
    },
    experimental_icons: {
      register(registration) {
        const kind = "experimental_icons.register";
        const name = requireNonEmptyString(
          kind,
          "name",
          registration?.name
        ).trim();
        if (name.length === 0)
          throw new Error(`${kind}: "name" must not be blank`);
        if (collected.icons.some((icon) => icon.name === name)) {
          throw new Error(`${kind}: duplicate icon name "${name}"`);
        }
        collected.icons.push({
          name,
          component: requireComponent(kind, registration.component)
        });
      }
    },
    contentScripts: {
      register(registration) {
        const kind = "contentScripts.register";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.contentScript, id);
        if (typeof registration.mount !== "function") {
          throw new Error(`${kind}: "mount" must be a function`);
        }
        collected.contentScripts.push({ id, mount: registration.mount });
      }
    }
  });
  attachLegacySidebarHeaders(
    collected.experimentalSidebarNavigations,
    legacySidebarHeaders,
    onWarning
  );
  return collected;
}
function attachLegacySidebarHeaders(navigations, headers, onWarning) {
  const [header, ...extraHeaders] = headers;
  if (header === void 0) return;
  const kind = "slots.experimental_sidebarHeader";
  if (extraHeaders.length > 0) {
    onWarning(
      `${kind}: only the first header is used; pass "headerComponent" to each experimental_sidebarNavigation instead`
    );
  }
  let attached = false;
  navigations.forEach((navigation, index) => {
    if (navigation.headerComponent !== void 0) return;
    navigations[index] = { ...navigation, headerComponent: header };
    attached = true;
  });
  if (!attached) {
    onWarning(
      `${kind}: ignored because the plugin registers no navigation without a "headerComponent"`
    );
  }
}
export {
  adaptSidebarFooterAction,
  collectPluginAppRegistrations,
  getCollectedSidebarFooterItems
};
