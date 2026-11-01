// Portable type declarations for `@workspace-core/plugin-sdk`. Unpublished BB
// workspace contracts are flattened; public subpaths may reuse the
// package root without requiring any other @core/* package.
//
// Confused by the API, or need a symbol that isn't here? Clone the BB repo
// and read the real source: https://github.com/get-bb/bb

import { StandardSchemaV1, StandardSchemaV1InferOutput, JsonValue, PluginMachineValidateDecision } from '@workspace-core/plugin-sdk';

type PluginMachineProviderResource = Exclude<JsonValue, null>;
type PluginMachineProviderInputsSchema = StandardSchemaV1 | undefined;
type InputsValue<S> = S extends StandardSchemaV1 ? StandardSchemaV1InferOutput<S> : null;
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

export type { PluginMachineProviderAvailability, PluginMachineProviderCreateContext, PluginMachineProviderCreateResult, PluginMachineProviderDefinition, PluginMachineProviderInputsSchema, PluginMachineProviderLifecycleContext, PluginMachineProviderProgress, PluginMachineProviderRemoveResult, PluginMachineProviderResource, PluginMachineProviderResourceResult, PluginMachineProviderValidateContext };
