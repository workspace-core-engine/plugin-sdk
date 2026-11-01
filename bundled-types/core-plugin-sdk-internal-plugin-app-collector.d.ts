// Portable type declarations for `@workspace-core/plugin-sdk`. Unpublished BB
// workspace contracts are flattened; public subpaths may reuse the
// package root without requiring any other @core/* package.
//
// Confused by the API, or need a symbol that isn't here? Clone the BB repo
// and read the real source: https://github.com/get-bb/bb

import * as _workspace_core_plugin_sdk from '@workspace-core/plugin-sdk';
import { ExperimentalSidebarFooterActionContext, ExperimentalSidebarFooterItemRegistration, PluginSidebarFooterActionRegistration, PluginHomepageSectionRegistration, PluginSettingsSectionRegistration, ExperimentalAppOverlayRegistration, PluginNavPanelRegistration, ExperimentalTabRegistration, PluginNewThreadPanelActionRegistration, ComposerCustomization, PluginPendingInteractionRegistration, PluginThreadListRegistration, ExperimentalSidebarNavigationRegistration, ExperimentalSidebarNavigationPlacement, PluginThreadHeaderActionRegistration, ExperimentalThreadContextSegmentRegistration, ExperimentalThreadInfoRowRegistration, ExperimentalThreadInfoSectionRegistration, PluginThreadActionRegistration, ExperimentalPluginBrowserToolbarActionRegistration, PluginFileOpenerRegistration, PluginSourceCodeRendererRegistration, PluginDiffRendererRegistration, ExperimentalComposerRegistration, PluginMessageDirectiveRegistration, ExperimentalCodeFenceRendererRegistration, PluginMessageActionRegistration, PluginCommandRegistration, ExperimentalComposerCommandRegistration, PluginProviderIconRegistration, ExperimentalIconRegistration, PluginTimelineRendererRegistration, PluginEnvironmentProviderInputsRegistration, PluginMachineProviderInputsRegistration, PluginContentScriptRegistration, PluginAppDefinition } from '@workspace-core/plugin-sdk';
import { ComponentType } from 'react';
import { z } from 'zod';

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
type CollectedManagedSidebarFooterItem = CollectedExperimentalSidebarFooterItem & {
    source: "experimental_sidebarFooter";
};
interface CollectedCompatibilitySidebarFooterItem {
    source: "sidebarFooterAction";
    id: string;
    label: string;
    icon: string;
    kind: "action";
    onActivate(context: ExperimentalSidebarFooterActionContext): void | Promise<void>;
    runtime: ExperimentalSidebarFooterItemRuntime;
}
type CollectedSidebarFooterItem = CollectedCompatibilitySidebarFooterItem | CollectedManagedSidebarFooterItem;
declare function adaptSidebarFooterAction(registration: PluginSidebarFooterActionRegistration): CollectedCompatibilitySidebarFooterItem;
declare function getCollectedSidebarFooterItems(registrations: object): readonly CollectedSidebarFooterItem[] | null;

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
declare function createCommandShortcutSchema(): z.ZodObject<{
    alt: z.ZodDefault<z.ZodBoolean>;
    control: z.ZodDefault<z.ZodBoolean>;
    key: z.ZodString;
    meta: z.ZodDefault<z.ZodBoolean>;
    mod: z.ZodDefault<z.ZodBoolean>;
    shift: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
type CollectedCommandShortcut = z.infer<ReturnType<typeof createCommandShortcutSchema>> | null;
type CollectedPluginCommandRegistration = (Omit<PluginCommandRegistration, "defaultShortcut"> & {
    target: "app";
    defaultShortcut: CollectedCommandShortcut;
}) | (Omit<ExperimentalComposerCommandRegistration, "defaultShortcut"> & {
    target: "composer";
    defaultShortcut: CollectedCommandShortcut;
});
interface CollectedPluginAppRegistrations {
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
    experimentalSidebarNavigations: CollectedSidebarNavigationRegistration[];
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
    commandPaletteActions: CollectedPluginCommandRegistration[];
    providerIcons: CollectedPluginProviderIconRegistration[];
    icons: ExperimentalIconRegistration[];
    timelineRenderers: PluginTimelineRendererRegistration[];
    environmentProviderInputs: PluginEnvironmentProviderInputsRegistration[];
    machineProviderInputs: PluginMachineProviderInputsRegistration[];
    contentScripts: PluginContentScriptRegistration[];
}
interface CollectedSidebarNavigationRegistration extends ExperimentalSidebarNavigationRegistration {
    placement: ExperimentalSidebarNavigationPlacement;
}
declare function collectPluginAppRegistrations(definition: PluginAppDefinition, onWarning?: (message: string) => void): CollectedPluginAppRegistrations;

export { adaptSidebarFooterAction, collectPluginAppRegistrations, getCollectedSidebarFooterItems };
export type { CollectedCompatibilitySidebarFooterItem, CollectedExperimentalSidebarFooterItem, CollectedManagedSidebarFooterItem, CollectedPluginAppRegistrations, CollectedPluginCommandRegistration, CollectedPluginProviderIconRegistration, CollectedSidebarFooterItem, CollectedSidebarNavigationRegistration, ExperimentalSidebarFooterCommandKind, ExperimentalSidebarFooterItemRuntime, ExperimentalSidebarFooterRuntimeSnapshot, LegacyNavPanelRegistration, LegacyThreadPanelActionRegistration };
