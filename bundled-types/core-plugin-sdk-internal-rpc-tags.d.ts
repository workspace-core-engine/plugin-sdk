// Portable type declarations for `@workspace-core/plugin-sdk`. Unpublished BB
// workspace contracts are flattened; public subpaths may reuse the
// package root without requiring any other @core/* package.
//
// Confused by the API, or need a symbol that isn't here? Clone the BB repo
// and read the real source: https://github.com/get-bb/bb

import { z } from 'zod';

interface ContractTagDeclarations<Input, Output> {
    tags?(input: Input, output: Output): readonly string[];
    keyTags?(key: string, value: Output extends Readonly<Record<string, infer Value>> ? Value : unknown): readonly string[];
    invalidates?(input: Input, output: Output): readonly string[];
}

declare const rpcInvalidationTags: z.ZodArray<z.ZodString>;
declare function rpcResponseTags<Input, Output>(declarations: ContractTagDeclarations<Input, Output>, input: Input, output: Output): {
    tags: string[];
    keyTags: Record<string, string[]>;
    invalidated: string[];
};

export { rpcInvalidationTags, rpcResponseTags };
