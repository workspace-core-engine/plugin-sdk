# @workspace-core/plugin-sdk

The plugin SDK for the core platform: the typed API plugin authors compile
against, plus the runtime and testing entry points the platform's plugin build
and host use. This repository holds the built package only; it is published
from the core platform's `packages/plugin-sdk` by
`scripts/core/publish-plugin-sdk.mjs`, and every release is an immutable
`v<version>` tag.

## Depend on it

Pin a release tag from GitHub in `devDependencies` (the platform supplies the
SDK runtime to plugins at load time, so it is never a runtime dependency):

```json
{
  "devDependencies": {
    "@workspace-core/plugin-sdk": "github:workspace-core-engine/plugin-sdk#v0.7.0"
  }
}
```

or run `npm install --save-dev github:workspace-core-engine/plugin-sdk#v0.7.0`.

Import it under its package name:

```ts
import { defineRpcContract, type BbPluginApi } from "@workspace-core/plugin-sdk";
import { definePluginApp } from "@workspace-core/plugin-sdk/app";
```

The platform also accepts the earlier names `@get-bb/plugin-sdk` and
`@core/plugin-sdk` in plugin sources, so existing plugins keep building and
running; `plugin migrate` in the platform CLI moves a plugin to
`@workspace-core/plugin-sdk`.

## Contents

- `dist/` — the runtime entry points (`.`, `./app`, `./host`,
  `./testing`, `./provider-bridge`, and the rest of `exports` in
  `package.json`).
- `bundled-types/` — self-contained declarations for every entry point. Read
  them for exact signatures.

## License

MIT — see [LICENSE](LICENSE).
