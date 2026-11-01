// src/internal/rpc-tags.ts
import { z } from "zod";
var rpcInvalidationTags = z.array(z.string().min(1)).min(1);
function rpcResponseTags(declarations, input, output) {
  const tags = z.array(z.string().min(1)).parse(declarations.tags?.(input, output) ?? []);
  const keyTags = {};
  if (declarations.keyTags && typeof output === "object" && output !== null && !Array.isArray(output)) {
    for (const [key, value] of Object.entries(output)) {
      keyTags[key] = z.array(z.string().min(1)).parse(declarations.keyTags(key, value));
    }
  }
  const invalidated = z.array(z.string().min(1)).parse(declarations.invalidates?.(input, output) ?? []);
  return { tags, keyTags, invalidated };
}
export {
  rpcInvalidationTags,
  rpcResponseTags
};
