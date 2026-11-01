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

// ../query-tags/src/index.ts
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from "react";
import {
  QueryObserver,
  useQuery,
  useQueryClient,
  useMutation,
  useMutationState,
  replaceEqualDeep as replaceEqualDeep3
} from "@tanstack/react-query";

// ../query-tags/src/clock.ts
var order = 0;
function tick() {
  return ++order;
}

// ../query-tags/src/keyed-store.ts
import {
  notifyManager,
  replaceEqualDeep
} from "@tanstack/react-query";
var KeyedCollection = class {
  constructor(name) {
    this.name = name;
  }
  name;
};
var stores = /* @__PURE__ */ new WeakMap();
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function collectionOf(store, token) {
  let collection = store.collections.get(token);
  if (collection === void 0) {
    collection = {
      base: /* @__PURE__ */ new Map(),
      visible: /* @__PURE__ */ new Map(),
      layers: [],
      acknowledgedAt: /* @__PURE__ */ new Map(),
      views: /* @__PURE__ */ new Map()
    };
    store.collections.set(token, collection);
  }
  return collection;
}
function readEntity(collection, id) {
  const cached = collection.visible.get(id);
  if (cached !== void 0) return cached;
  let entity = collection.base.get(id);
  if (entity === void 0) return void 0;
  for (const layer of collection.layers)
    if (layer.ids.has(id)) entity = layer.apply(entity, id);
  collection.visible.set(id, entity);
  return entity;
}
function changed(store, collection, ids) {
  const dirty = new Set(ids);
  for (const id of dirty) collection.visible.delete(id);
  if (store.batching > 0) {
    const pending = store.dirtyIds.get(collection) ?? /* @__PURE__ */ new Set();
    for (const id of dirty) pending.add(id);
    store.dirtyIds.set(collection, pending);
    return;
  }
  const views = /* @__PURE__ */ new Map();
  for (const id of dirty)
    for (const view of collection.views.get(id) ?? []) {
      const viewIds = views.get(view) ?? /* @__PURE__ */ new Set();
      viewIds.add(id);
      views.set(view, viewIds);
    }
  notifyManager.batch(() => {
    for (const [view, viewIds] of views) rematerialize(store, view, viewIds);
  });
}
function writeBase(store, collection, id, update) {
  const current = collection.base.get(id);
  const next = update(current);
  if (next === void 0 || next === current) return;
  collection.base.set(id, next);
  changed(store, collection, [id]);
}
function dropAccepted(collection, id, acceptedBefore) {
  let dropped = false;
  collection.layers = collection.layers.filter((layer) => {
    if (layer.acceptedAt === null || layer.acceptedAt >= acceptedBefore || !layer.ids.has(id))
      return true;
    dropped = true;
    layer.ids.delete(id);
    return layer.ids.size > 0;
  });
  return dropped;
}
function ingest(store, skeleton, id, item, readStart) {
  const { collection } = skeleton;
  const fresh = readStart > (collection.acknowledgedAt.get(id) ?? -1);
  writeBase(
    store,
    collection,
    id,
    (current) => skeleton.view.read(item, current, fresh)
  );
  if (dropAccepted(collection, id, readStart)) changed(store, collection, [id]);
}
function materializeItem(store, view, item, entity) {
  if (!isObject(item) || !isObject(entity)) return view.render(item, entity);
  let byEntity = store.rows.get(item);
  if (byEntity === void 0) {
    byEntity = /* @__PURE__ */ new WeakMap();
    store.rows.set(item, byEntity);
  }
  const cached = byEntity.get(entity);
  if (cached !== void 0) return cached;
  const row = view.render(item, entity);
  byEntity.set(entity, row);
  return row;
}
function rematerialize(store, query, dirty) {
  const skeleton = store.skeletons.get(query);
  if (skeleton === void 0) return;
  const { view, collection } = skeleton;
  const previous = store.materialized.get(query);
  const incremental = dirty !== void 0 && previous !== void 0;
  const slotKeys = /* @__PURE__ */ new Set();
  if (incremental) {
    for (const id of dirty)
      for (const slot of skeleton.slotsById.get(id) ?? []) slotKeys.add(slot);
  } else for (const slot of skeleton.slots.keys()) slotKeys.add(slot);
  if (slotKeys.size === 0) return;
  const items = /* @__PURE__ */ new Map();
  const materialized = new Map(previous);
  for (const slot of slotKeys) {
    const prior = previous?.get(slot);
    const visible = /* @__PURE__ */ new Map();
    const rows = [];
    for (const entry of skeleton.slots.get(slot) ?? []) {
      if (entry.id === null) {
        rows.push(entry.item);
        continue;
      }
      const entity = readEntity(collection, entry.id);
      if (entity !== void 0 && view.shows !== void 0 && !view.shows(entity, query.queryKey))
        continue;
      const previousRow = incremental ? prior?.get(entry.id) : void 0;
      const row = previousRow !== void 0 && dirty?.has(entry.id) === false ? previousRow : replaceEqualDeep(
        previousRow,
        entity === void 0 ? entry.item : materializeItem(store, view, entry.item, entity)
      );
      visible.set(entry.id, row);
      rows.push(row);
    }
    const unchanged = prior !== void 0 && prior.size === rows.length && [...prior.values()].every((row, index) => row === rows[index]);
    if (incremental && unchanged) continue;
    items.set(slot, rows);
    materialized.set(slot, visible);
  }
  if (items.size === 0) return;
  let next = view.rebuild(
    incremental ? query.state.data : skeleton.data,
    items
  );
  if (!incremental) {
    next = replaceEqualDeep(query.state.data, next);
    for (const slot of view.slots(next) ?? []) {
      const visible = /* @__PURE__ */ new Map();
      for (const item of slot.items) {
        const id = view.keyOf(item);
        if (id !== void 0) visible.set(id, item);
      }
      materialized.set(slot.key, visible);
    }
  }
  store.materialized.set(query, materialized);
  if (next !== query.state.data) query.setState({ data: next });
}
function skeletonIds(skeleton) {
  const ids = /* @__PURE__ */ new Set();
  for (const entries of skeleton?.slots.values() ?? [])
    for (const { id } of entries) if (id !== null) ids.add(id);
  return ids;
}
function setSkeleton(store, query, skeleton) {
  const previous = store.skeletons.get(query);
  const previousIds = skeletonIds(previous);
  const nextIds = skeletonIds(skeleton);
  if (skeleton === void 0) {
    store.skeletons.delete(query);
    store.materialized.delete(query);
  } else store.skeletons.set(query, skeleton);
  const collection = skeleton?.collection ?? previous?.collection;
  if (collection === void 0) return;
  for (const id of nextIds) {
    let views = collection.views.get(id);
    if (views === void 0) {
      views = /* @__PURE__ */ new Set();
      collection.views.set(id, views);
    }
    views.add(query);
  }
  for (const id of previousIds) {
    if (nextIds.has(id)) continue;
    const views = collection.views.get(id);
    views?.delete(query);
    if (views === void 0 || views.size === 0) {
      collection.views.delete(id);
      collection.base.delete(id);
      collection.visible.delete(id);
      dropAccepted(collection, id, Number.POSITIVE_INFINITY);
    }
  }
}
function priorItem(materialized, slot, id) {
  const same = materialized?.get(slot)?.get(id);
  if (same !== void 0) return same;
  for (const visible of materialized?.values() ?? []) {
    const item = visible.get(id);
    if (item !== void 0) return item;
  }
  return void 0;
}
function isHidden(entry, visible) {
  return entry.id !== null && !visible.has(entry.id);
}
function keepHiddenEntries(previous, next, visible) {
  if (!previous.some((entry) => isHidden(entry, visible))) return next;
  const result = [...next];
  let insertAt = result.length;
  for (let index = previous.length - 1; index >= 0; index--) {
    const entry = previous[index];
    const existing = entry.id === null ? -1 : result.findIndex(({ id }) => id === entry.id);
    if (existing >= 0) insertAt = existing;
    else if (isHidden(entry, visible)) result.splice(insertAt, 0, entry);
  }
  return result;
}
function keptInsertions(store, query, slot, readStart) {
  const insertions = (store.insertions.get(query) ?? []).filter(
    (insertion) => insertion.at > readStart
  );
  store.insertions.set(query, insertions);
  return insertions.filter((insertion) => insertion.slot === slot);
}
function batch(store, run) {
  store.batching++;
  try {
    notifyManager.batch(run);
  } finally {
    store.batching--;
  }
  if (store.batching > 0) return;
  const full = new Set(store.dirtyViews);
  const partial = /* @__PURE__ */ new Map();
  for (const [collection, ids] of store.dirtyIds)
    for (const id of ids)
      for (const view of collection.views.get(id) ?? []) {
        if (full.has(view)) continue;
        const viewIds = partial.get(view) ?? /* @__PURE__ */ new Set();
        viewIds.add(id);
        partial.set(view, viewIds);
      }
  store.dirtyIds.clear();
  store.dirtyViews.clear();
  notifyManager.batch(() => {
    for (const view of full) rematerialize(store, view);
    for (const [view, ids] of partial) rematerialize(store, view, ids);
  });
}
function onViewWritten(store, query, view, manual) {
  const data = query.state.data;
  const slots = data === void 0 ? void 0 : view.slots(data);
  if (slots === void 0) {
    setSkeleton(store, query, void 0);
    return;
  }
  const collection = collectionOf(store, view.collection);
  const target = { view, collection };
  const previous = store.skeletons.get(query);
  const materialized = manual ? store.materialized.get(query) : void 0;
  const readStart = manual ? -1 : store.fetchStartedAt.get(query) ?? 0;
  const receipt = manual ? void 0 : store.receipts.get(query);
  if (receipt !== void 0) store.receipts.delete(query);
  batch(store, () => {
    const nextSlots = /* @__PURE__ */ new Map();
    const slotsById = /* @__PURE__ */ new Map();
    for (const slot of slots) {
      const entries = [];
      for (const item of slot.items) {
        const id = view.keyOf(item);
        entries.push({ id: id ?? null, item });
        if (id === void 0) continue;
        const prior = priorItem(materialized, slot.key, id);
        if (prior !== void 0) {
          if (prior !== item)
            writeBase(
              store,
              collection,
              id,
              (current) => current === void 0 ? current : view.write(item, prior, current)
            );
          continue;
        }
        const start = receipt === void 0 ? readStart : receipt.get(id);
        if (start !== void 0) ingest(store, target, id, item, start);
        else if (!collection.base.has(id))
          ingest(store, target, id, item, readStart);
      }
      const previousEntries = previous?.slots.get(slot.key);
      const visible = materialized?.get(slot.key);
      const kept = previousEntries !== void 0 && visible !== void 0 ? keepHiddenEntries(previousEntries, entries, visible) : entries;
      if (!manual) {
        for (const insertion of keptInsertions(
          store,
          query,
          slot.key,
          readStart
        ))
          if (!kept.some(({ id }) => id === insertion.entry.id))
            kept.push(insertion.entry);
      }
      nextSlots.set(slot.key, kept);
      for (const { id } of kept) {
        if (id === null) continue;
        const slotKeys = slotsById.get(id) ?? /* @__PURE__ */ new Set();
        slotKeys.add(slot.key);
        slotsById.set(id, slotKeys);
      }
    }
    setSkeleton(store, query, {
      view,
      collection,
      data,
      slots: nextSlots,
      slotsById
    });
    store.dirtyViews.add(query);
  });
}
function viewOf(store, query) {
  const exact = store.exact.get(query.queryHash);
  if (exact !== void 0) return exact;
  for (const resolve of store.resolvers) {
    const view = resolve(query.queryKey);
    if (view !== void 0) return view;
  }
  return void 0;
}
function storeOf(client) {
  const existing = stores.get(client);
  if (existing !== void 0) return existing;
  const store = {
    client,
    collections: /* @__PURE__ */ new Map(),
    resolvers: [],
    exact: /* @__PURE__ */ new Map(),
    skeletons: /* @__PURE__ */ new Map(),
    insertions: /* @__PURE__ */ new WeakMap(),
    materialized: /* @__PURE__ */ new WeakMap(),
    fetchStartedAt: /* @__PURE__ */ new WeakMap(),
    receipts: /* @__PURE__ */ new WeakMap(),
    rows: /* @__PURE__ */ new WeakMap(),
    batching: 0,
    dirtyIds: /* @__PURE__ */ new Map(),
    dirtyViews: /* @__PURE__ */ new Set()
  };
  stores.set(client, store);
  client.getQueryCache().subscribe((event) => {
    const { query } = event;
    if (event.type === "removed") {
      if (store.skeletons.has(query)) setSkeleton(store, query, void 0);
      return;
    }
    if (event.type !== "updated") return;
    const { type } = event.action;
    if (type !== "fetch" && type !== "success") return;
    const view = viewOf(store, query);
    if (view === void 0) return;
    if (event.action.type === "fetch") {
      store.fetchStartedAt.set(query, tick());
      return;
    }
    if (event.action.type === "success")
      onViewWritten(store, query, view, event.action.manual === true);
  });
  return store;
}
function adopt(store, matches) {
  for (const query of store.client.getQueryCache().getAll()) {
    const view = matches(query);
    if (view !== void 0 && query.state.data !== void 0)
      onViewWritten(store, query, view, true);
  }
}
function registerKeyedView(client, queryKey, view) {
  const store = storeOf(client);
  const { queryHash } = client.defaultQueryOptions({ queryKey });
  if (store.exact.has(queryHash)) return;
  store.exact.set(queryHash, view);
  adopt(store, (query) => query.queryHash === queryHash ? view : void 0);
}
function recordKeyedRead(client, queryKey, startedAt) {
  const query = client.getQueryCache().get(client.defaultQueryOptions({ queryKey }).queryHash);
  if (query !== void 0) storeOf(client).receipts.set(query, startedAt);
}
function predictKeyed(client, token, ids, apply) {
  const store = storeOf(client);
  const collection = collectionOf(store, token);
  const layer = { ids: new Set(ids), apply, acceptedAt: null };
  collection.layers.push(layer);
  changed(store, collection, ids);
  const live = () => layer.acceptedAt === null && collection.layers.includes(layer);
  return {
    accept() {
      if (!live()) return;
      const at = tick();
      for (const id of ids) collection.acknowledgedAt.set(id, at);
      layer.acceptedAt = at;
    },
    remove() {
      if (!live()) return;
      collection.layers = collection.layers.filter((other) => other !== layer);
      changed(store, collection, ids);
    }
  };
}

// ../query-tags/src/optimistic.ts
import {
  matchQuery,
  notifyManager as notifyManager2,
  replaceEqualDeep as replaceEqualDeep2
} from "@tanstack/react-query";
function optimisticKeyedUpdate(collection, key, update) {
  return {
    collection,
    key,
    update: (current, result) => update(current, result)
  };
}
function optimisticQueryUpdate(queryKey, update, path = []) {
  return {
    queryKey,
    path: [...path],
    update: (current, result) => update(current, result)
  };
}
var predictions = /* @__PURE__ */ new WeakMap();
var receipts = /* @__PURE__ */ new WeakMap();
var taggedMeta = /* @__PURE__ */ new WeakSet();
var syncedClients = /* @__PURE__ */ new WeakMap();
function valueAt(data, path) {
  let value = data;
  for (const key of path) {
    if (typeof value !== "object" || value === null || !Object.hasOwn(value, key))
      return;
    value = Reflect.get(value, key);
  }
  return value === void 0 ? void 0 : { value };
}
function replaceAt(data, path, value) {
  const [key, ...rest] = path;
  if (key === void 0) return value;
  if (typeof data !== "object" || data === null) return data;
  const next = Array.isArray(data) ? [...data] : { ...data };
  Reflect.set(next, key, replaceAt(Reflect.get(data, key), rest, value));
  return next;
}
function prefix(left, right) {
  return left.length <= right.length && left.every((part, index) => part === right[index]);
}
function olderPending(state, layer) {
  return state.layers.some(
    (other) => other.order < layer.order && !other.settled && (prefix(other.path, layer.path) || prefix(layer.path, other.path))
  );
}
function confirmedValue(current, predicted, confirmed) {
  if (Object.is(predicted, confirmed)) return current;
  if (typeof current !== "object" || current === null || typeof predicted !== "object" || predicted === null || typeof confirmed !== "object" || confirmed === null || Array.isArray(predicted) !== Array.isArray(confirmed) || Array.isArray(predicted) && (!Array.isArray(confirmed) || predicted.length !== confirmed.length))
    return confirmed;
  const next = Array.isArray(current) ? [...current] : { ...current };
  for (const key of /* @__PURE__ */ new Set([
    ...Object.keys(predicted),
    ...Object.keys(confirmed)
  ])) {
    if (!Object.hasOwn(confirmed, key)) Reflect.deleteProperty(next, key);
    else
      Reflect.set(
        next,
        key,
        confirmedValue(
          Reflect.get(current, key),
          Reflect.get(predicted, key),
          Reflect.get(confirmed, key)
        )
      );
  }
  return next;
}
function rebase(base, visible, next) {
  if (Object.is(visible, next)) return base;
  if (typeof base !== "object" || base === null || typeof visible !== "object" || visible === null || typeof next !== "object" || next === null || Array.isArray(base) || Array.isArray(visible) || Array.isArray(next))
    return next;
  const result = {};
  for (const key of Object.keys(base))
    if (!Object.hasOwn(visible, key) && !Object.hasOwn(next, key))
      result[key] = Reflect.get(base, key);
  for (const key of Object.keys(next))
    result[key] = Object.hasOwn(visible, key) && Object.hasOwn(base, key) ? rebase(
      Reflect.get(base, key),
      Reflect.get(visible, key),
      Reflect.get(next, key)
    ) : Reflect.get(next, key);
  return result;
}
function projected(state) {
  return state.layers.reduce((data, layer) => {
    const current = valueAt(data, layer.path);
    return replaceAt(
      data,
      layer.path,
      layer.update(current === void 0 ? layer.initial : current.value)
    );
  }, state.base);
}
var predictionListeners = /* @__PURE__ */ new WeakMap();
function subscribeOptimisticQuery(query, listener) {
  if (query === void 0) return () => {
  };
  let listeners = predictionListeners.get(query);
  if (listeners === void 0) {
    listeners = /* @__PURE__ */ new Set();
    predictionListeners.set(query, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) predictionListeners.delete(query);
  };
}
function isTaggedQuery(query) {
  return query.meta !== void 0 && taggedMeta.has(query.meta);
}
function applyLayer(data, layer) {
  const current = valueAt(data, layer.path);
  return replaceAt(
    data,
    layer.path,
    layer.update(current === void 0 ? layer.initial : current.value)
  );
}
function confirmLayers(query, state, ready) {
  const tagged = isTaggedQuery(query);
  while (state.layers[0] !== void 0 && ready(state.layers[0])) {
    const layer = state.layers.shift();
    state.base = applyLayer(state.base, layer);
    if (tagged && !layer.fresh) state.guards.push(layer);
  }
}
function confirmBeforeWrite(query, state) {
  confirmLayers(query, state, (layer) => layer.acceptedAt !== null);
}
function isIdle(state) {
  return state.layers.length === 0 && state.guards.length === 0;
}
function untrack(query, state) {
  predictions.delete(query);
  const synced = syncedClients.get(state.client);
  if (synced === void 0) return;
  synced.queries.delete(query);
  if (synced.queries.size === 0) {
    synced.unsubscribe();
    syncedClients.delete(state.client);
  }
}
function track(query, state) {
  predictions.set(query, state);
  let synced = syncedClients.get(state.client);
  if (synced === void 0) {
    const queries = /* @__PURE__ */ new Set();
    const unsubscribe = state.client.getQueryCache().subscribe((event) => {
      if (event.type !== "updated" || event.action.type !== "success") return;
      const current = predictions.get(event.query);
      if (current === void 0 || isTaggedQuery(event.query)) return;
      const data = event.query.state.data;
      if (event.action.manual) {
        confirmBeforeWrite(event.query, current);
        current.base = rebase(current.base, current.visible, data);
      } else {
        current.base = data;
      }
      publish(event.query, current);
    });
    synced = { queries, unsubscribe };
    syncedClients.set(state.client, synced);
  }
  synced.queries.add(query);
}
function publish(query, state) {
  if (!isTaggedQuery(query))
    confirmLayers(query, state, (layer) => layer.settled);
  const data = replaceEqualDeep2(query.state.data, projected(state));
  state.visible = data;
  query.setState({ data });
  if (isIdle(state)) untrack(query, state);
  for (const listener of predictionListeners.get(query) ?? []) listener();
}
function markTaggedQueryMeta(meta) {
  taggedMeta.add(meta);
}
function commitTaggedReadReceipt(query, data, started) {
  receipts.set(query, { data, started });
}
function consumeReceipt(query, next) {
  const receipt = receipts.get(query);
  if (receipt === void 0 || !Object.is(receipt.data, next)) return;
  receipts.delete(query);
  return receipt;
}
function refreshedBy(receipt, layer) {
  return layer.acceptedAt !== null && receipt.started > layer.acceptedAt;
}
function taggedStructuralSharing(client, queryKey, previous, next) {
  const query = client.getQueryCache().get(client.defaultQueryOptions({ queryKey }).queryHash);
  if (query !== void 0 && Object.is(previous, query.state.data)) {
    const receipt = consumeReceipt(query, next);
    const state = predictions.get(query);
    if (state !== void 0) {
      if (receipt !== void 0) {
        const refreshed = /* @__PURE__ */ new Set();
        for (const layer of state.layers) {
          if (refreshedBy(receipt, layer)) {
            layer.fresh = true;
            refreshed.add(layer);
          }
        }
        state.layers = state.layers.filter(
          (layer) => !layer.settled || !refreshed.has(layer) || olderPending(state, layer)
        );
      }
      if (receipt !== void 0) {
        state.guards = state.guards.filter(
          (guard) => !refreshedBy(receipt, guard)
        );
        state.base = state.guards.reduce(applyLayer, next);
      } else {
        confirmBeforeWrite(query, state);
        state.base = rebase(state.base, previous, next);
      }
      next = projected(state);
      state.visible = next;
      if (isIdle(state)) untrack(query, state);
    }
  }
  const sharing = client.defaultQueryOptions({ queryKey }).structuralSharing;
  return sharing === false ? next : typeof sharing === "function" ? sharing(previous, next) : replaceEqualDeep2(previous, next);
}
function getTaggedReadData(client, queryKey) {
  const query = client.getQueryCache().get(client.defaultQueryOptions({ queryKey }).queryHash);
  const state = query === void 0 ? void 0 : predictions.get(query);
  return state === void 0 ? query?.state.data : state.base;
}
function isKeyedUpdate(update) {
  return "collection" in update;
}
function beginKeyedPredictions(client, updates, result) {
  const byCollection = /* @__PURE__ */ new Map();
  for (const update of updates) {
    const byKey = byCollection.get(update.collection) ?? /* @__PURE__ */ new Map();
    byKey.set(update.key, [...byKey.get(update.key) ?? [], update]);
    byCollection.set(update.collection, byKey);
  }
  return [...byCollection].map(
    ([collection, byKey]) => predictKeyed(
      client,
      collection,
      new Set(byKey.keys()),
      (entity, key) => (byKey.get(key) ?? []).reduce(
        (current, update) => update.update(current, result()),
        entity
      )
    )
  );
}
function beginOptimisticMutation(client, allUpdates) {
  const owner = {};
  const mutationOrder = tick();
  let accepted;
  let done = false;
  const updates = allUpdates.filter(
    (update) => !isKeyedUpdate(update)
  );
  const keyed = beginKeyedPredictions(
    client,
    allUpdates.filter(isKeyedUpdate),
    () => accepted?.result.value === void 0 ? void 0 : accepted.result
  );
  const affected = /* @__PURE__ */ new Map();
  const attached = new Map(
    updates.map((update) => [update, /* @__PURE__ */ new Set()])
  );
  const attach = (query, update) => {
    const queries = attached.get(update);
    if (queries.has(query) || query.state.data === void 0) return;
    const state = predictions.get(query) ?? {
      client,
      base: query.state.data,
      visible: query.state.data,
      layers: [],
      guards: []
    };
    const current = valueAt(projected(state), update.path);
    if (current === void 0) return;
    queries.add(query);
    const layer = {
      owner,
      order: mutationOrder,
      path: update.path,
      initial: current.value,
      update: (value) => update.update(value, accepted?.result),
      acceptedAt: accepted?.at ?? null,
      fresh: false,
      settled: false
    };
    const index = state.layers.findIndex((other) => other.order > layer.order);
    if (index < 0) state.layers.push(layer);
    else state.layers.splice(index, 0, layer);
    track(query, state);
    affected.set(query, state);
    publish(query, state);
  };
  const unsubscribe = updates.length === 0 ? () => {
  } : client.getQueryCache().subscribe((event) => {
    if (event.type !== "updated" || event.action.type !== "success")
      return;
    for (const update of updates)
      if (matchQuery(
        { queryKey: update.queryKey, exact: true },
        event.query
      ))
        attach(event.query, update);
  });
  const finish = () => {
    done = true;
    unsubscribe();
  };
  const rollback = () => notifyManager2.batch(() => {
    if (accepted !== void 0 || done) return;
    finish();
    for (const prediction of keyed) prediction.remove();
    for (const [query, state] of affected) {
      state.layers = state.layers.filter((layer) => layer.owner !== owner);
      publish(query, state);
    }
  });
  try {
    notifyManager2.batch(() => {
      for (const update of updates)
        for (const query of client.getQueryCache().findAll({
          queryKey: update.queryKey,
          exact: true
        }))
          attach(query, update);
    });
  } catch (error) {
    rollback();
    throw error;
  }
  return {
    rollback,
    accept(result) {
      accepted = { at: tick(), result: { value: result } };
      notifyManager2.batch(() => {
        for (const prediction of keyed) prediction.accept();
        for (const [query, state] of affected) {
          for (const layer of state.layers)
            if (layer.owner === owner) layer.acceptedAt = accepted.at;
          publish(query, state);
        }
      });
    },
    settle() {
      if (done) return;
      finish();
      notifyManager2.batch(() => {
        for (const [query, state] of affected) {
          const tagged = isTaggedQuery(query);
          state.layers = state.layers.filter((layer) => {
            if (layer.owner !== owner) return true;
            layer.settled = true;
            if (!tagged) return true;
            if (!layer.fresh) return true;
            if (!olderPending(state, layer)) return false;
            const current = valueAt(state.base, layer.path);
            if (current !== void 0) {
              const update = layer.update;
              const predicted = update(current.value);
              layer.update = (value) => confirmedValue(update(value), predicted, current.value);
            }
            return true;
          });
          publish(query, state);
        }
      });
    }
  };
}

// ../query-tags/src/index.ts
function useTaggedQuery(options, client) {
  const queryClient = useQueryClient(client);
  const result = useQuery(options, queryClient);
  const query = queryClient.getQueryCache().get(queryClient.defaultQueryOptions(options).queryHash);
  const subscribed = options.subscribed !== false;
  const subscribe = useCallback(
    (listener) => subscribed ? subscribeOptimisticQuery(query, listener) : () => {
    },
    [query, subscribed]
  );
  const snapshot = useCallback(() => query?.state.data, [query]);
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return result;
}
var registrations = /* @__PURE__ */ new WeakMap();
var reads = /* @__PURE__ */ new WeakMap();
function taggedQueryOptions(client, queryKey, registration) {
  const meta = {};
  markTaggedQueryMeta(meta);
  registrations.set(meta, {
    scope: registration.scope,
    tagsOf: (data) => registration.tagsOf(data),
    onInvalidate: (data, tags) => registration.onInvalidate?.(data, tags)
  });
  return {
    meta,
    structuralSharing: (previous, next) => taggedStructuralSharing(client, queryKey, previous, next)
  };
}
function registrationOf(query) {
  return query.meta === void 0 ? void 0 : registrations.get(query.meta);
}
async function runTaggedRead(client, queryKey, read) {
  const query = client.getQueryCache().get(client.defaultQueryOptions({ queryKey }).queryHash);
  if (query === void 0) return read();
  const registration = registrationOf(query);
  for (; ; ) {
    const pending = { tags: /* @__PURE__ */ new Set(), restart: false };
    reads.set(query, pending);
    const started = tick();
    try {
      const result = await read();
      const overlap = registration?.tagsOf(result).some((tag) => pending.tags.has(tag));
      if (overlap) registration?.onInvalidate?.(result, [...pending.tags]);
      if (pending.restart || overlap) continue;
      commitTaggedReadReceipt(query, result, started);
      return result;
    } catch (error) {
      if (pending.restart) continue;
      throw error;
    } finally {
      if (reads.get(query) === pending) reads.delete(query);
    }
  }
}
async function invalidateTags(client, scope, tags) {
  if (tags?.length === 0) return;
  const matched = /* @__PURE__ */ new Set();
  const pendingReads = [];
  for (const query of client.getQueryCache().getAll()) {
    const registration = registrationOf(query);
    if (registration?.scope !== scope) continue;
    const pending = reads.get(query);
    const data = getTaggedReadData(client, query.queryKey);
    const matches = tags === null || data === void 0 && pending === void 0 || data !== void 0 && registration.tagsOf(data).some((tag) => tags.includes(tag));
    if (matches) registration.onInvalidate?.(data, tags);
    if (pending !== void 0) {
      if (matches) pending.restart = true;
      else for (const tag of tags ?? []) pending.tags.add(tag);
      if (query.isActive() && query.promise !== void 0)
        pendingReads.push(query.promise);
    }
    if (matches) {
      matched.add(query);
      if (pending === void 0 && query.isActive() && query.state.fetchStatus === "fetching" && query.promise !== void 0) {
        const refetch = () => client.invalidateQueries(
          { predicate: (candidate) => candidate === query },
          { cancelRefetch: false }
        );
        pendingReads.push(query.promise.then(refetch, refetch));
      }
    }
  }
  await Promise.allSettled([
    client.invalidateQueries(
      { predicate: (query) => matched.has(query) },
      { cancelRefetch: false }
    ),
    ...pendingReads
  ]);
}
async function executeTaggedMutation(invalidate, call, prediction) {
  const { result, invalidated } = await call();
  prediction?.accept(result);
  const refresh = async () => {
    try {
      if (invalidate !== void 0 && invalidated.length > 0)
        await invalidate(invalidated);
    } finally {
      prediction?.settle();
    }
  };
  void refresh().catch(() => {
  });
  return result;
}
var pluginTagScope = (pluginId) => `plugin:${pluginId}`;
function restartTaggedRead(query) {
  const pending = reads.get(query);
  if (pending) pending.restart = true;
}
function useTaggedMutation({
  client,
  invalidate,
  call,
  optimistic,
  meta
}) {
  const [owner] = useState(() => ({}));
  const predict = useRef(optimistic);
  useEffect(() => {
    predict.current = optimistic;
  }, [optimistic]);
  const mutation = useMutation(
    {
      meta: { ...meta, taggedMutationOwner: owner },
      mutationFn: ({ input, prediction }) => executeTaggedMutation(invalidate, () => call(input), prediction)
    },
    client
  );
  const pendingInputs = useMutationState(
    {
      filters: {
        status: "pending",
        predicate: (entry) => entry.options.meta?.taggedMutationOwner === owner
      },
      select: (entry) => entry.state.variables.input
    },
    client
  );
  const { mutateAsync } = mutation;
  const mutate = useCallback(
    (input) => {
      const prediction = beginOptimisticMutation(
        client,
        predict.current?.(input) ?? []
      );
      return mutateAsync({ input, prediction }).catch((error) => {
        prediction.rollback();
        throw error;
      });
    },
    [client, mutateAsync]
  );
  return {
    mutate,
    pendingInputs,
    isPending: pendingInputs.length > 0,
    error: mutation.error,
    reset: mutation.reset
  };
}
function hasRows(data) {
  return typeof data === "object" && data !== null && "result" in data && typeof data.result === "object" && data.result !== null;
}
var rowKey = (item) => Array.isArray(item) && typeof item[0] === "string" ? item[0] : void 0;
var rowValue = (item) => Array.isArray(item) ? item[1] : void 0;
function keyedRowsView(collection) {
  return {
    collection,
    slots: (data) => hasRows(data) ? [{ key: "result", items: Object.entries(data.result) }] : void 0,
    rebuild: (data, items) => hasRows(data) ? {
      ...data,
      result: Object.fromEntries(
        (items.get("result") ?? []).flatMap((item) => {
          const key = rowKey(item);
          return key === void 0 ? [] : [[key, rowValue(item)]];
        })
      )
    } : data,
    keyOf: rowKey,
    read: (item, current, fresh) => current === void 0 || fresh ? rowValue(item) : current,
    write: rowValue,
    render: (item, entity) => Object.is(rowValue(item), entity) ? item : [rowKey(item), entity]
  };
}
function createTaggedKeyedQueryOwner(options) {
  const { client, queryKey, scope, collection, read } = options;
  registerKeyedView(client, queryKey, keyedRowsView(collection));
  const keys = /* @__PURE__ */ new Map();
  let readingKeys = /* @__PURE__ */ new Set();
  let missingOnly = false;
  let refreshAll = false;
  const dirtyKeys = /* @__PURE__ */ new Set();
  const collectSubscribedKeys = () => new Promise((resolve) => {
    queueMicrotask(() => resolve([...keys.keys()]));
  });
  const observer = new QueryObserver(client, {
    queryKey,
    ...taggedQueryOptions(client, queryKey, {
      scope,
      tagsOf: (data) => [
        ...data.tags,
        ...Object.values(data.keyTags).flat()
      ],
      onInvalidate: (data, tags) => {
        if (tags === null || data === void 0 || data.tags.some((tag) => tags.includes(tag))) {
          refreshAll = true;
        } else {
          for (const [key, ownTags] of Object.entries(data.keyTags))
            if (ownTags.some((tag) => tags.includes(tag))) dirtyKeys.add(key);
        }
      }
    }),
    queryFn: () => {
      let previous = getTaggedReadData(client, queryKey);
      const startedAt = /* @__PURE__ */ new Map();
      let refresh = !missingOnly && ![...keys.keys()].some((key) => dirtyKeys.has(key));
      missingOnly = false;
      const refreshedKeys = /* @__PURE__ */ new Set();
      let refreshedAll = false;
      return runTaggedRead(client, queryKey, async () => {
        const subscribed = await collectSubscribedKeys();
        const all = refreshAll || refresh;
        refresh = false;
        const dirty = new Set(dirtyKeys);
        refreshedAll ||= all;
        if (all)
          for (const key of Object.keys(previous?.result ?? {}))
            dirtyKeys.add(key);
        refreshAll = false;
        const requested = subscribed.filter(
          (key) => all || dirty.has(key) || !Object.hasOwn(previous?.result ?? {}, key)
        );
        for (const key of requested) {
          refreshedKeys.add(key);
          dirtyKeys.delete(key);
        }
        readingKeys = new Set(requested);
        const started = tick();
        try {
          const results = await Promise.all(
            Array.from(
              { length: Math.ceil(requested.length / 200) },
              async (_, i) => {
                const batch2 = requested.slice(i * 200, (i + 1) * 200);
                const response = await read(batch2);
                for (const key of batch2)
                  if (!Object.hasOwn(response.result, key))
                    throw new Error(`Keyed read omitted key ${key}`);
                return response;
              }
            )
          );
          const retained = (key) => !readingKeys.has(key);
          for (const key of requested) startedAt.set(key, started);
          previous = {
            result: Object.fromEntries([
              ...Object.entries(previous?.result ?? {}).filter(
                ([key]) => retained(key)
              ),
              ...results.flatMap((response) => Object.entries(response.result))
            ]),
            tags: [
              .../* @__PURE__ */ new Set([
                ...all ? [] : previous?.tags ?? [],
                ...results.flatMap((r) => r.tags)
              ])
            ],
            keyTags: Object.fromEntries([
              ...Object.entries(previous?.keyTags ?? {}).filter(
                ([key]) => retained(key)
              ),
              ...results.flatMap(
                (response) => Object.entries(response.keyTags)
              )
            ])
          };
          return previous;
        } catch (error) {
          for (const key of refreshedKeys) dirtyKeys.add(key);
          refreshAll ||= refreshedAll;
          throw error;
        }
      }).then((data) => {
        recordKeyedRead(client, queryKey, startedAt);
        return data;
      });
    }
  });
  const listeners = /* @__PURE__ */ new Set();
  let stop;
  return {
    observer,
    subscribe(requested, listener) {
      let added = false;
      for (const key of requested) {
        if (!keys.has(key)) added = true;
        keys.set(key, (keys.get(key) ?? 0) + 1);
      }
      const cached = getTaggedReadData(client, queryKey);
      const pending = requested.filter(
        (key) => dirtyKeys.has(key) || !Object.hasOwn(cached?.result ?? {}, key)
      );
      if (!stop) missingOnly = cached === void 0;
      listeners.add(listener);
      if (!stop) {
        stop = observer.subscribe(() => {
          for (const notify of listeners) notify();
        });
      }
      if (added && pending.length > 0) {
        if (observer.getCurrentResult().isFetching) {
          if (readingKeys.size > 0 && pending.some((key) => !readingKeys.has(key)))
            restartTaggedRead(observer.getCurrentQuery());
        } else {
          missingOnly = true;
          void observer.refetch({ cancelRefetch: false });
        }
      }
      return () => {
        listeners.delete(listener);
        for (const key of requested) {
          const count = (keys.get(key) ?? 1) - 1;
          if (count > 0) keys.set(key, count);
          else keys.delete(key);
        }
        queueMicrotask(() => {
          if (listeners.size === 0) {
            stop?.();
            stop = void 0;
          }
        });
      };
    }
  };
}
function useQuerySelection(subscribe, getSnapshot, select) {
  const committed = useRef(null);
  const getSelection = useMemo(() => {
    let cached;
    return () => {
      const snapshot = getSnapshot();
      if (cached && Object.is(cached.snapshot, snapshot)) return cached.value;
      cached = {
        snapshot,
        value: replaceEqualDeep3(
          cached?.value ?? committed.current?.value,
          select(snapshot)
        )
      };
      return cached.value;
    };
  }, [getSnapshot, select]);
  const value = useSyncExternalStore(subscribe, getSelection, getSelection);
  useEffect(() => {
    committed.current = { value };
  }, [value]);
  return value;
}

// src/testing/app.tsx
import { QueryClient } from "@tanstack/react-query";

// src/internal/rpc-query-host.ts
import { useCallback as useCallback2, useEffect as useEffect2, useMemo as useMemo2 } from "react";
import { useIsFetching } from "@tanstack/react-query";

// ../domain/src/shared-types.ts
import { z as z2 } from "zod";

// ../domain/src/json-value.ts
import { z } from "zod";
var jsonValueSchema = z.lazy(
  () => z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema)
  ])
);
var jsonObjectSchema = z.record(
  z.string(),
  jsonValueSchema
);

// ../domain/src/shared-types.ts
var reasoningLevelSchema = z2.string().min(1);
var serviceTierSchema = z2.string().min(1);
var instructionModeValues = ["append", "replace"];
var instructionModeSchema = z2.enum(instructionModeValues);
var permissionModeValues = ["accept-edits", "auto", "full"];
var permissionModeSchema = z2.enum(permissionModeValues);
var permissionModeInputSchema = z2.union([permissionModeSchema, z2.literal("workspace-write")]).transform(
  (permissionMode) => permissionMode === "workspace-write" ? "accept-edits" : permissionMode
);
var legacyRecordedPermissionModeValues = [
  "workspace-write",
  "readonly"
];
var recordedPermissionModeSchema = z2.enum([
  ...permissionModeValues,
  ...legacyRecordedPermissionModeValues
]);
var permissionEscalationValues = ["ask", "deny"];
var permissionEscalationSchema = z2.enum(permissionEscalationValues);
var promptInputVisibilityValues = ["agent-only"];
var promptInputVisibilitySchema = z2.enum(promptInputVisibilityValues);
var promptInputVisibilityFields = {
  visibility: promptInputVisibilitySchema.optional()
};
var promptMentionPathSourceValues = ["workspace", "thread-storage"];
var promptMentionPathSourceSchema = z2.enum(promptMentionPathSourceValues);
var promptMentionPathEntryKindValues = ["file", "directory"];
var promptMentionPathEntryKindSchema = z2.enum(
  promptMentionPathEntryKindValues
);
var promptMentionCommandTriggerValues = ["/", "$"];
var promptMentionCommandTriggerSchema = z2.enum(
  promptMentionCommandTriggerValues
);
var promptMentionCommandSourceValues = ["skill", "command"];
var promptMentionCommandSourceSchema = z2.enum(
  promptMentionCommandSourceValues
);
var promptMentionCommandOriginValues = [
  "builtin",
  "project",
  "user"
];
var promptMentionCommandOriginSchema = z2.enum(
  promptMentionCommandOriginValues
);
var canonicalPromptMentionResourceSchema = z2.discriminatedUnion("kind", [
  z2.object({
    kind: z2.literal("thread"),
    threadId: z2.string(),
    projectId: z2.string().optional(),
    label: z2.string()
  }),
  z2.object({
    kind: z2.literal("project"),
    projectId: z2.string(),
    label: z2.string()
  }),
  z2.object({
    kind: z2.literal("section"),
    sectionId: z2.string(),
    label: z2.string()
  }),
  z2.object({
    kind: z2.literal("path"),
    source: promptMentionPathSourceSchema,
    entryKind: promptMentionPathEntryKindSchema,
    path: z2.string(),
    label: z2.string()
  }),
  z2.object({
    kind: z2.literal("command"),
    trigger: promptMentionCommandTriggerSchema,
    name: z2.string(),
    source: promptMentionCommandSourceSchema,
    origin: promptMentionCommandOriginSchema,
    label: z2.string(),
    argumentHint: z2.string().nullable()
  }),
  z2.object({
    kind: z2.literal("plugin"),
    pluginId: z2.string(),
    icon: z2.string().nullable().optional(),
    itemId: z2.string(),
    label: z2.string()
  }),
  z2.object({
    kind: z2.literal("attachment"),
    path: z2.string(),
    label: z2.string()
  })
]);
function normalizeLegacyPromptMentionResource(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }
  const record = value;
  if (record.kind !== "folder" || typeof record.folderId !== "string") {
    return value;
  }
  const { folderId, ...rest } = record;
  return { ...rest, kind: "section", sectionId: folderId };
}
var promptMentionResourceSchema = z2.preprocess(
  normalizeLegacyPromptMentionResource,
  canonicalPromptMentionResourceSchema
);
var promptTextMentionSchema = z2.object({
  start: z2.number().int().nonnegative(),
  end: z2.number().int().nonnegative(),
  resource: promptMentionResourceSchema
});
var promptInputSchema = z2.discriminatedUnion("type", [
  z2.object({
    type: z2.literal("text"),
    text: z2.string(),
    mentions: z2.array(promptTextMentionSchema).default([]),
    ...promptInputVisibilityFields
  }),
  z2.object({
    type: z2.literal("image"),
    url: z2.string().url(),
    ...promptInputVisibilityFields
  }),
  z2.object({
    type: z2.literal("localImage"),
    path: z2.string(),
    sourceProjectId: z2.string().min(1).optional(),
    hostId: z2.string().min(1).optional(),
    ...promptInputVisibilityFields
  }),
  z2.object({
    type: z2.literal("localFile"),
    path: z2.string(),
    sourceProjectId: z2.string().min(1).optional(),
    hostId: z2.string().min(1).optional(),
    name: z2.string().optional(),
    sizeBytes: z2.number().int().nonnegative().optional(),
    mimeType: z2.string().optional(),
    ...promptInputVisibilityFields
  })
]);
var threadExecutionSourceSchema = z2.enum([
  "client/thread/start",
  "client/turn/requested",
  "client/turn/start"
]);
var callerExecutionInputSourceValues = [
  "explicit",
  "client-preference"
];
var callerExecutionInputSourceSchema = z2.enum(
  callerExecutionInputSourceValues
);
var threadExecutionOptionsSchema = z2.object({
  model: z2.string().optional(),
  serviceTier: serviceTierSchema.optional(),
  reasoningLevel: reasoningLevelSchema.optional(),
  permissionMode: permissionModeSchema.optional(),
  source: threadExecutionSourceSchema.optional(),
  seq: z2.number().int().optional()
});
var resolvedThreadExecutionOptionsSchema = threadExecutionOptionsSchema.extend({
  model: z2.string().min(1),
  serviceTier: serviceTierSchema,
  reasoningLevel: reasoningLevelSchema,
  permissionMode: permissionModeSchema,
  source: threadExecutionSourceSchema
});
var recordedThreadExecutionOptionsSchema = resolvedThreadExecutionOptionsSchema.extend({
  permissionMode: recordedPermissionModeSchema
});
var runtimePermissionScopeValues = ["workspace", "full"];
var runtimePermissionScopeSchema = z2.enum(runtimePermissionScopeValues);
var runtimePermissionPolicySchema = z2.discriminatedUnion(
  "permissionMode",
  [
    z2.object({
      permissionMode: z2.literal("accept-edits"),
      permissionScope: z2.literal("workspace"),
      approvalReviewer: z2.literal("user"),
      permissionEscalation: permissionEscalationSchema
    }),
    z2.object({
      permissionMode: z2.literal("auto"),
      permissionScope: z2.literal("workspace"),
      approvalReviewer: z2.literal("automatic"),
      permissionEscalation: permissionEscalationSchema
    }),
    z2.object({
      permissionMode: z2.literal("full"),
      permissionScope: z2.literal("full"),
      approvalReviewer: z2.null(),
      permissionEscalation: z2.null()
    })
  ]
);
var promptModeSchema = z2.literal("plan");
var sessionOptionValueSchema = z2.union([z2.string(), z2.boolean()]);
var sessionOptionSelectionsSchema = z2.record(
  z2.string().min(1),
  sessionOptionValueSchema
);
var runtimeThreadExecutionBaseOptionsSchema = z2.object({
  model: z2.string().min(1),
  serviceTier: serviceTierSchema,
  reasoningLevel: reasoningLevelSchema,
  promptMode: promptModeSchema.optional(),
  sessionOptions: sessionOptionSelectionsSchema.optional(),
  providerOptions: jsonObjectSchema
});
var runtimeThreadExecutionOptionsSchema = runtimeThreadExecutionBaseOptionsSchema.and(runtimePermissionPolicySchema);
var projectExecutionDefaultsSchema = z2.object({
  providerId: z2.string().min(1),
  model: z2.string().min(1),
  serviceTier: serviceTierSchema,
  reasoningLevel: reasoningLevelSchema,
  permissionMode: permissionModeSchema
});

// ../domain/src/change-kinds.ts
import { z as z17 } from "zod";

// ../domain/src/thread-event-types.ts
import { z as z3 } from "zod";
var systemEventTypeValues = [
  "client/thread/start",
  "client/turn/requested",
  "client/turn/rejected",
  "client/turn/start",
  "system/error",
  "system/manager/user_message",
  "system/thread/interrupted",
  "system/operation",
  "system/interaction/lifecycle",
  "system/permissionGrant/lifecycle",
  "system/userQuestion/lifecycle",
  "system/thread-provisioning",
  "system/provider-turn-watchdog"
];
var providerEventTypeValues = [
  "thread/started",
  "thread/identity",
  "turn/started",
  "turn/completed",
  "turn/input/accepted",
  "thread/name/updated",
  "thread/compacted",
  "thread/context/cleared",
  "thread/goal/updated",
  "thread/goal/cleared",
  "item/started",
  "item/completed",
  "item/agentMessage/delta",
  "item/commandExecution/outputDelta",
  "item/fileChange/outputDelta",
  "item/reasoning/summaryTextDelta",
  "item/reasoning/textDelta",
  "item/plan/delta",
  "item/mcpToolCall/progress",
  "item/toolCall/progress",
  "item/backgroundTask/progress",
  "item/backgroundTask/completed",
  "item/delegation/progress",
  "item/delegation/completed",
  "thread/tokenUsage/updated",
  "thread/contextWindowUsage/updated",
  "turn/plan/updated",
  "turn/mainRun/updated",
  "turn/diff/updated",
  "provider/error",
  "provider/rateLimits/updated",
  "provider.env-resolved",
  "thread/extensionState/updated",
  "provider/warning",
  "provider/modelFallback",
  "provider/unhandled"
];
var threadEventTypeValues = [
  ...providerEventTypeValues,
  ...systemEventTypeValues
];
var threadEventTypeSet = new Set(threadEventTypeValues);
var threadEventTypeSchema = z3.string().refine(
  (value) => threadEventTypeSet.has(value),
  "Invalid thread event type"
);

// ../domain/src/thread.ts
import { z as z16 } from "zod";

// ../domain/src/thread-create-origin.ts
import { z as z4 } from "zod";
var threadCreateOriginValues = ["app", "cli", "sdk", "plugin"];
var threadCreateOriginSchema = z4.enum(threadCreateOriginValues);

// ../domain/src/environment.ts
import { z as z5 } from "zod";
var environmentMachineSelectionSchema = z5.discriminatedUnion("type", [
  z5.object({ type: z5.literal("existing"), hostId: z5.string().min(1) }),
  z5.object({
    type: z5.literal("new"),
    machineProviderId: z5.string().min(1),
    inputs: jsonValueSchema.nullable()
  })
]);
var environmentProviderSelectionSchema = z5.object({
  machine: environmentMachineSelectionSchema,
  inputs: jsonValueSchema.nullable()
});
var environmentStatusValues = [
  "creating",
  "provisioning",
  "ready",
  "error",
  "destroyed"
];
var environmentStatusSchema = z5.enum(environmentStatusValues);
var environmentHostLifecycleValues = [
  "active",
  "removing",
  "cleanup-failed",
  "removed"
];
var environmentHostLifecycleSchema = z5.enum(
  environmentHostLifecycleValues
);
var WORKSPACE_PROVISION_TYPES = [
  "unmanaged",
  "managed-worktree",
  "personal"
];
var workspaceProvisionTypeSchema = z5.enum(WORKSPACE_PROVISION_TYPES);
var environmentWorkspaceDisplayKindValues = [
  "managed-worktree",
  "unmanaged-worktree",
  "other"
];
var environmentWorkspaceDisplayKindSchema = z5.enum(
  environmentWorkspaceDisplayKindValues
);
var discoveredWorkspacePropertiesSchema = z5.object({
  path: z5.string().min(1),
  isGitRepo: z5.boolean(),
  isWorktree: z5.boolean(),
  branchName: z5.string().nullable(),
  defaultBranch: z5.string().nullable()
});
var environmentLifecycleSchema = z5.object({
  phase: z5.enum(["active", "retiring", "teardown", "destroyed"]),
  retireAt: z5.number().nullable(),
  teardown: z5.object({
    status: z5.enum(["running", "failed", "removed"]),
    attempt: z5.number().int().nonnegative(),
    message: z5.string().optional()
  }).nullable()
});
var environmentSchema = z5.object({
  id: z5.string(),
  name: z5.string().nullable(),
  projectId: z5.string(),
  hostId: z5.string(),
  path: z5.string().nullable(),
  isGitRepo: z5.boolean(),
  isWorktree: z5.boolean(),
  branchName: z5.string().nullable(),
  baseBranch: z5.string().nullable(),
  defaultBranch: z5.string().nullable(),
  mergeBaseBranch: z5.string().nullable(),
  status: environmentStatusSchema,
  environmentProviderId: z5.string().nullable(),
  lifecycle: environmentLifecycleSchema,
  hostLifecycle: environmentHostLifecycleSchema,
  environmentProviderSelection: environmentProviderSelectionSchema.nullable(),
  environmentProviderInstanceKey: z5.string().nullable(),
  managed: z5.boolean(),
  workspaceProvisionType: workspaceProvisionTypeSchema.nullable(),
  createdAt: z5.number(),
  updatedAt: z5.number()
});

// ../domain/src/queued-message.ts
import { z as z9 } from "zod";

// ../domain/src/plugin-id.ts
import { z as z6 } from "zod";
var pluginIdSchema = z6.string().regex(/^[a-z0-9][a-z0-9-]*$/u);
var LEGACY_PREFIX = ["b", "b"].join("");
var RENAMED_BUILTIN_NAMES = Object.freeze(
  Object.fromEntries(
    ["account", "ai", "guide"].map((name) => [
      `${LEGACY_PREFIX}-${name}`,
      `core-${name}`
    ])
  )
);
var RENAMED_PLUGIN_IDS = Object.freeze({
  ...RENAMED_BUILTIN_NAMES,
  ...Object.fromEntries(
    [
      "composer",
      "connect-next",
      "git",
      "github-pr-status",
      "mcp",
      "prompt-library",
      "provider-usage",
      "storage-retention"
    ].map((name) => [`${LEGACY_PREFIX}--${name}`, `core--${name}`])
  )
});
var RENAMED_MARKETPLACE_NAMES = Object.freeze({
  [`${LEGACY_PREFIX}-official`]: "core-official",
  [`${LEGACY_PREFIX}-community`]: "core-community"
});

// ../domain/src/protocol-ids.ts
import { z as z7 } from "zod";
var clientTurnRequestIdSchema = z7.string().regex(/^creq_[23456789abcdefghijkmnpqrstuvwxyz]{10}$/u);

// ../domain/src/system-message.ts
import { z as z8 } from "zod";
var systemMessageKindValues = [
  "ownership-assigned",
  "ownership-removed",
  "child-needs-attention",
  "child-completed",
  "child-failed",
  "child-interrupted",
  "child-outcome-batch",
  "tool-result-delivered",
  "environment-directory-updated",
  "unlabeled"
];
var systemMessageKindSchema = z8.enum(systemMessageKindValues);
var systemThreadInterruptedReasonSchema = z8.enum([
  "manual-stop",
  "host-daemon-restarted",
  "host-removed",
  "provider-turn-idle"
]);
var childThreadOutcomeSchema = z8.object({
  threadId: z8.string(),
  status: z8.enum(["completed", "failed", "interrupted"]),
  interruption: z8.object({
    reason: systemThreadInterruptedReasonSchema,
    cause: z8.literal("host-connection-lost").optional()
  }).optional()
});
var systemMessageSubjectSchema = z8.discriminatedUnion("kind", [
  z8.object({
    kind: z8.literal("thread"),
    threadId: z8.string(),
    threadName: z8.string(),
    outcomes: z8.array(childThreadOutcomeSchema).optional()
  }),
  z8.object({
    kind: z8.literal("thread-batch"),
    count: z8.number(),
    outcomes: z8.array(childThreadOutcomeSchema).optional()
  }),
  z8.object({
    kind: z8.literal("tool-call"),
    toolName: z8.string(),
    suppress: z8.boolean()
  }),
  z8.object({
    kind: z8.literal("directory"),
    path: z8.string()
  })
]);

// ../domain/src/queued-message.ts
var queuedMessageWaitingOnKindValues = [
  "time",
  "thread-busy",
  "stopping",
  "turn-starting",
  "provisioning",
  "host-offline",
  "interaction",
  "plugin"
];
var queuedMessageWaitingOnKindSchema = z9.enum(
  queuedMessageWaitingOnKindValues
);
var queuedMessageWaitHostNameSchema = z9.string().min(1).max(200);
var QUEUED_MESSAGE_WAIT_REASON_MAX_LENGTH = 200;
var queuedMessageWaitReasonSchema = z9.string().min(1).max(QUEUED_MESSAGE_WAIT_REASON_MAX_LENGTH);
var queuedMessageWaitingOnSchema = z9.discriminatedUnion("kind", [
  z9.object({ kind: z9.literal("time") }),
  z9.object({ kind: z9.literal("thread-busy") }),
  z9.object({ kind: z9.literal("stopping") }),
  z9.object({ kind: z9.literal("turn-starting") }),
  z9.object({ kind: z9.literal("provisioning") }),
  z9.object({
    kind: z9.literal("host-offline"),
    hostName: queuedMessageWaitHostNameSchema
  }),
  z9.object({ kind: z9.literal("interaction") }),
  z9.object({
    kind: z9.literal("plugin"),
    pluginId: pluginIdSchema,
    reason: queuedMessageWaitReasonSchema
  })
]);
var QUEUED_MESSAGE_FAILURE_REASON_MAX_LENGTH = 200;
var queuedMessageFailureReasonSchema = z9.string().min(1).max(QUEUED_MESSAGE_FAILURE_REASON_MAX_LENGTH);
var QUEUED_MESSAGE_PLUGIN_WAIT_HOLDER_PREFIX = "plugin:";
var queuedMessageWaitHolderSchema = z9.templateLiteral([
  QUEUED_MESSAGE_PLUGIN_WAIT_HOLDER_PREFIX,
  pluginIdSchema
]);
var queuedMessagePayloadKindValues = ["inline", "retry"];
var queuedMessagePayloadKindSchema = z9.enum(
  queuedMessagePayloadKindValues
);
var queuedMessagePayloadSchema = z9.discriminatedUnion("kind", [
  z9.object({ kind: z9.literal("inline") }),
  z9.object({
    kind: z9.literal("retry"),
    /**
     * The ORIGINAL request, not the attempt that just failed. Retrying a retry
     * re-submits the same original blocks, so this id is carried forward
     * unchanged across attempts and `attempt` is what distinguishes them.
     */
    retryOfTurnRequestId: clientTurnRequestIdSchema,
    /** Which attempt this row will dispatch: 2 is the first retry. */
    attempt: z9.number().int().min(2),
    /**
     * Why this turn is being retried, in the retrier's words ("Rate limited"),
     * as the row's card and `bb thread queue list` render it.
     *
     * It lives on the payload rather than on `waitingOn` because a retry can
     * wait on the clock, on a limiter, or on nothing at all, and the reason
     * outlives all three: it is a fact about the retry, not about what is
     * currently holding it. Filled at the boundary, so every row has one.
     */
    reason: queuedMessageWaitReasonSchema
  })
]);
var queuedMessageSystemNoticeSchema = z9.object({
  kind: systemMessageKindSchema,
  subject: systemMessageSubjectSchema.nullable()
});

// ../domain/src/queued-message-lifecycle.ts
import { z as z10 } from "zod";
var queuedMessageStateValues = [
  "queued",
  "scheduled",
  "waiting",
  "failed_retrying",
  "failed_exhausted",
  "claimed"
];
var queuedMessageStateSchema = z10.enum(queuedMessageStateValues);

// ../domain/src/thread-status.ts
import { z as z11 } from "zod";
var threadStatusValues = [
  "pending",
  "idle",
  "starting",
  "active",
  "stopping",
  "error"
];
var threadStatusSchema = z11.enum(threadStatusValues);

// ../domain/src/thread-origin-kind.ts
import { z as z12 } from "zod";
var threadOriginKindValues = ["fork"];
var threadOriginKindSchema = z12.enum(threadOriginKindValues);

// ../domain/src/thread-parent-notifications.ts
import { z as z13 } from "zod";
var threadParentNotificationsValues = [
  "auto",
  "stuck",
  "off"
];
var threadParentNotificationsSchema = z13.enum(
  threadParentNotificationsValues
);

// ../domain/src/thread-visibility.ts
import { z as z14 } from "zod";
var threadVisibilityValues = ["visible", "hidden"];
var threadVisibilitySchema = z14.enum(threadVisibilityValues);

// ../domain/src/thread-runtime-state.ts
import { z as z15 } from "zod";
var threadRuntimeDisplayStatusValues = [
  ...threadStatusValues,
  "provisioning",
  "waiting-for-host"
];
var threadRuntimeDisplayStatusSchema = z15.enum(
  threadRuntimeDisplayStatusValues
);
var threadRuntimeStateSchema = z15.object({
  displayStatus: threadRuntimeDisplayStatusSchema
});
var threadActivityStateSchema = z15.object({
  activeWorkflowCount: z15.number().int().nonnegative(),
  activeBackgroundAgentCount: z15.number().int().nonnegative(),
  activeBackgroundCommandCount: z15.number().int().nonnegative(),
  activePlanModeCount: z15.number().int().nonnegative(),
  activeGoalCount: z15.number().int().nonnegative()
});

// ../domain/src/thread.ts
var threadQueuedMessageSchema = z16.object({
  id: z16.string(),
  origin: threadCreateOriginSchema.nullable(),
  originPluginId: z16.string().nullable(),
  initiator: z16.enum(["user", "agent", "system"]),
  senderThreadId: z16.string().nullable(),
  /**
   * The thread this row is waiting on. Redundant on the thread-scoped list
   * route that first served this DTO, and load-bearing everywhere else it is
   * now served: a `queue.*` plugin event and a cross-thread wait-holder query
   * both hand out rows with no surrounding thread to read it from.
   */
  threadId: z16.string(),
  content: z16.array(promptInputSchema).min(1),
  model: z16.string().min(1),
  reasoningLevel: reasoningLevelSchema,
  permissionMode: permissionModeSchema,
  serviceTier: serviceTierSchema,
  groupWithNext: z16.boolean(),
  /**
   * Epoch ms this row is scheduled to attempt dispatch, or null when it is
   * eligible as soon as its other waits clear.
   */
  sendAt: z16.number().int().nonnegative().nullable(),
  state: queuedMessageStateSchema,
  /**
   * Why this row is queued, or null for a `queued` row that is simply next in
   * line behind the running turn.
   */
  waitingOn: queuedMessageWaitingOnSchema.nullable(),
  /**
   * Why this row's last DRAIN attempt failed outright, or null when it has not
   * failed one — which is every row that has never been re-attempted, and
   * every row whose latest attempt merely queued again. An inline attempt
   * reports its failure to the sender that is still listening and never lands
   * here.
   *
   * Independent of `waitingOn`, not folded into it: the row is still waiting on
   * whatever it was waiting on, and writing a wait rewrites it wholesale, so a
   * failure stored there would not survive the next attempt.
   */
  failureReason: queuedMessageFailureReasonSchema.nullable(),
  payload: queuedMessagePayloadSchema,
  /**
   * Whether the sender may still rewrite this row's input. Not derivable from
   * `payload` alone: a `retry` row is never editable, and an `inline` row
   * stops being editable once the drain has claimed it — and the claim is
   * deliberately not part of this response, since it is drain bookkeeping and
   * not something a client should reason about. The server folds both into
   * this one answer.
   */
  editable: z16.boolean(),
  createdAt: z16.number(),
  updatedAt: z16.number()
});
var threadSchema = z16.object({
  id: z16.string(),
  projectId: z16.string(),
  environmentId: z16.string().nullable(),
  providerId: z16.string(),
  title: z16.string().nullable(),
  titleFallback: z16.string().nullable(),
  sectionId: z16.string().nullable(),
  status: threadStatusSchema,
  parentThreadId: z16.string().nullable(),
  lifecycleOwnerThreadId: z16.string().nullable(),
  sourceThreadId: z16.string().nullable(),
  originKind: threadOriginKindSchema.nullable(),
  originPluginId: z16.string().nullable(),
  visibility: threadVisibilitySchema,
  parentNotifications: threadParentNotificationsSchema,
  archivedAt: z16.number().nullable(),
  pinnedAt: z16.number().nullable(),
  deletedAt: z16.number().nullable(),
  lastReadAt: z16.number().nullable(),
  latestAttentionAt: z16.number(),
  createdAt: z16.number(),
  updatedAt: z16.number()
});
var threadWithRuntimeSchema = threadSchema.extend({
  runtime: threadRuntimeStateSchema
});
var threadQueuedWorkValues = ["none", "waiting", "failed"];
var threadQueuedWorkSchema = z16.enum(threadQueuedWorkValues);
var threadListEntrySchema = threadWithRuntimeSchema.extend({
  activity: threadActivityStateSchema,
  queuedWork: threadQueuedWorkSchema,
  pinSortKey: z16.string().nullable(),
  hasPendingInteraction: z16.boolean(),
  environmentHostId: z16.string().nullable(),
  environmentName: z16.string().nullable(),
  environmentBranchName: z16.string().nullable(),
  environmentPath: z16.string().nullable(),
  environmentProviderId: z16.string().nullable(),
  environmentIsWorktree: z16.boolean().nullable(),
  environmentWorkspaceDisplayKind: environmentWorkspaceDisplayKindSchema
});

// ../domain/src/change-kinds.ts
var THREAD_CHANGE_KINDS = [
  "thread-created",
  "thread-deleted",
  "events-appended",
  "history-rewritten",
  "history-compacted",
  "interactions-changed",
  "status-changed",
  "title-changed",
  "queue-changed",
  "archived-changed",
  "pin-state-changed",
  "parent-changed",
  "environment-changed",
  "read-state-changed",
  "tabs-changed",
  "terminals-changed"
];
var PROJECT_CHANGE_KINDS = [
  "project-created",
  "project-updated",
  "project-deleted",
  "project-sources-changed",
  "threads-changed",
  "project-order-changed"
];
var ENVIRONMENT_CHANGE_KINDS = [
  "environment-created",
  "environment-deleted",
  "metadata-changed",
  "status-changed",
  "work-status-changed",
  "git-refs-changed",
  "thread-storage-changed",
  "diff-viewed-changed"
];
var HOST_CHANGE_KINDS = [
  "host-connected",
  "host-disconnected",
  "provider-model-catalog-changed",
  "provider-commands-changed"
];
var SYSTEM_CHANGE_KINDS = [
  "config-changed",
  "plugins-changed",
  "plugin-install-jobs-changed",
  "plugin-update-jobs-changed",
  "provider-registrations-changed",
  "environment-availability-changed",
  "server-move-changed",
  "app-update-changed"
];
var threadChangeKindSchema = z17.enum(THREAD_CHANGE_KINDS);
var projectChangeKindSchema = z17.enum(PROJECT_CHANGE_KINDS);
var environmentChangeKindSchema = z17.enum(ENVIRONMENT_CHANGE_KINDS);
var hostChangeKindSchema = z17.enum(HOST_CHANGE_KINDS);
var systemChangeKindSchema = z17.enum(SYSTEM_CHANGE_KINDS);
var threadTimelineSubscriptionTargetSchema = z17.object({
  kind: z17.literal("thread-timeline"),
  threadId: z17.string().min(1),
  segmentLimit: z17.number().int().positive().nullable(),
  deferContent: z17.boolean()
}).strict();
function canonicalPluginReadInput(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map(canonicalPluginReadInput).join(",")}]`;
  return `{${Object.keys(value).sort().map(
    (key) => `${JSON.stringify(key)}:${canonicalPluginReadInput(value[key])}`
  ).join(",")}}`;
}
var pluginReadSubscriptionTargetSchema = z17.object({
  kind: z17.literal("plugin-read"),
  pluginId: z17.string().min(1),
  method: z17.string().min(1),
  read: z17.union([
    z17.object({ input: jsonValueSchema }).strict(),
    z17.object({ key: z17.string() }).strict()
  ]).refine(
    (read) => new TextEncoder().encode(canonicalPluginReadInput(read)).byteLength <= 16384,
    "Plugin read input exceeds 16 KiB"
  )
}).strict();
var realtimeSubscriptionTargetSchema = z17.discriminatedUnion("kind", [
  pluginReadSubscriptionTargetSchema,
  z17.object({ kind: z17.literal("plugin"), pluginId: z17.string().min(1) }).strict(),
  z17.object({
    kind: z17.literal("thread-detail"),
    threadId: z17.string().min(1)
  }).strict(),
  threadTimelineSubscriptionTargetSchema,
  z17.object({
    kind: z17.literal("thread-list")
  }).strict(),
  z17.object({
    kind: z17.literal("project-detail"),
    projectId: z17.string().min(1)
  }).strict(),
  z17.object({
    kind: z17.literal("project-list")
  }).strict(),
  z17.object({
    kind: z17.literal("environment-detail"),
    environmentId: z17.string().min(1)
  }).strict(),
  z17.object({
    kind: z17.literal("environment-list")
  }).strict(),
  z17.object({
    kind: z17.literal("host-detail"),
    hostId: z17.string().min(1)
  }).strict(),
  z17.object({
    kind: z17.literal("host-list")
  }).strict(),
  z17.object({
    kind: z17.literal("system")
  }).strict()
]);
function isValidSubscriptionTarget(value) {
  return realtimeSubscriptionTargetSchema.safeParse(value).success;
}
var validSubscriptionTargetsSchema = z17.preprocess(
  (value) => Array.isArray(value) ? value.filter(isValidSubscriptionTarget) : value,
  z17.array(realtimeSubscriptionTargetSchema)
);
var validSubscriptionTargetSchema = z17.preprocess(
  (value) => value === void 0 || isValidSubscriptionTarget(value) ? value : null,
  realtimeSubscriptionTargetSchema.nullable().optional()
);
var subscriptionFields = {
  target: validSubscriptionTargetSchema,
  targets: validSubscriptionTargetsSchema.optional()
};
var hasSubscriptionTargets = (value) => value.target !== void 0 !== (value.targets !== void 0);
var subscribeMessageSchema = z17.object({
  type: z17.literal("subscribe"),
  ...subscriptionFields,
  timelineTags: z17.record(z17.string(), z17.string().min(1).nullable()).optional()
}).refine(hasSubscriptionTargets);
var unsubscribeMessageSchema = z17.object({ type: z17.literal("unsubscribe"), ...subscriptionFields }).refine(hasSubscriptionTargets);
var pingMessageSchema = z17.object({
  type: z17.literal("ping")
});
var visibilityMessageSchema = z17.object({
  type: z17.literal("visibility"),
  visible: z17.boolean()
});
var clientMessageSchema = z17.discriminatedUnion("type", [
  subscribeMessageSchema,
  unsubscribeMessageSchema,
  pingMessageSchema,
  visibilityMessageSchema
]);
var pongMessageSchema = z17.object({
  type: z17.literal("pong")
}).strict();
var pongMessageLenientSchema = z17.object({
  type: z17.literal("pong")
});
var threadStatusChangeMetadataSchema = z17.object({
  status: threadStatusSchema,
  runtime: threadRuntimeStateSchema,
  activity: threadActivityStateSchema,
  latestAttentionAt: z17.number(),
  updatedAt: z17.number()
}).strict();
var threadChangeMetadataSchema = z17.object({
  backgroundActivityChanged: z17.boolean().optional(),
  eventTypes: z17.array(threadEventTypeSchema).readonly().optional(),
  timelineSequence: z17.number().int().nonnegative().optional(),
  hasPendingInteraction: z17.boolean().optional(),
  projectId: z17.string().optional(),
  statusChange: threadStatusChangeMetadataSchema.optional()
}).strict();
var threadChangedMessageSchema = z17.object({
  type: z17.literal("changed"),
  entity: z17.literal("thread"),
  id: z17.string().optional(),
  metadata: threadChangeMetadataSchema.optional(),
  changes: z17.array(threadChangeKindSchema).readonly()
}).strict();
var projectChangedMessageSchema = z17.object({
  type: z17.literal("changed"),
  entity: z17.literal("project"),
  id: z17.string().optional(),
  changes: z17.array(projectChangeKindSchema).readonly()
}).strict();
var environmentChangedMessageSchema = z17.object({
  type: z17.literal("changed"),
  entity: z17.literal("environment"),
  id: z17.string().optional(),
  changes: z17.array(environmentChangeKindSchema).readonly()
}).strict();
var hostChangedMessageSchema = z17.object({
  type: z17.literal("changed"),
  entity: z17.literal("host"),
  id: z17.string().optional(),
  changes: z17.array(hostChangeKindSchema).readonly()
}).strict();
var systemChangedMessageSchema = z17.object({
  type: z17.literal("changed"),
  entity: z17.literal("system"),
  changes: z17.array(systemChangeKindSchema).readonly()
}).strict();
var tagsChangedMessageSchema = z17.object({
  type: z17.literal("changed"),
  entity: z17.literal("tags"),
  tags: z17.array(z17.string().min(1)).min(1)
}).strict();
var pluginChangedMessageSchema = z17.object({
  type: z17.literal("changed"),
  entity: z17.literal("plugin"),
  pluginId: z17.string().min(1),
  tags: z17.array(z17.string().min(1)).min(1).nullable()
}).strict();
var changedMessageSchema = z17.discriminatedUnion("entity", [
  threadChangedMessageSchema,
  projectChangedMessageSchema,
  environmentChangedMessageSchema,
  hostChangedMessageSchema,
  systemChangedMessageSchema,
  tagsChangedMessageSchema,
  pluginChangedMessageSchema
]);
function lenientKinds(kinds) {
  const known = new Set(kinds);
  return z17.array(z17.string()).transform(
    (values) => values.filter((value) => known.has(value))
  );
}
var knownThreadEventTypes = new Set(
  threadEventTypeValues
);
var threadChangeMetadataLenientSchema = z17.object({
  timelineSequence: z17.number().int().nonnegative().optional(),
  backgroundActivityChanged: z17.boolean().optional(),
  eventTypes: z17.array(z17.string()).transform(
    (values) => values.filter(
      (value) => knownThreadEventTypes.has(value)
    )
  ).optional(),
  hasPendingInteraction: z17.boolean().optional(),
  projectId: z17.string().optional(),
  statusChange: threadStatusChangeMetadataSchema.optional().catch(void 0)
});
var threadChangedMessageLenientSchema = z17.object({
  type: z17.literal("changed"),
  entity: z17.literal("thread"),
  id: z17.string().optional(),
  metadata: threadChangeMetadataLenientSchema.optional(),
  changes: lenientKinds(THREAD_CHANGE_KINDS)
});
var projectChangedMessageLenientSchema = z17.object({
  type: z17.literal("changed"),
  entity: z17.literal("project"),
  id: z17.string().optional(),
  changes: lenientKinds(PROJECT_CHANGE_KINDS)
});
var environmentChangedMessageLenientSchema = z17.object({
  type: z17.literal("changed"),
  entity: z17.literal("environment"),
  id: z17.string().optional(),
  changes: lenientKinds(ENVIRONMENT_CHANGE_KINDS)
});
var hostChangedMessageLenientSchema = z17.object({
  type: z17.literal("changed"),
  entity: z17.literal("host"),
  id: z17.string().optional(),
  changes: lenientKinds(HOST_CHANGE_KINDS)
});
var systemChangedMessageLenientSchema = z17.object({
  type: z17.literal("changed"),
  entity: z17.literal("system"),
  changes: lenientKinds(SYSTEM_CHANGE_KINDS)
});
var changedMessageLenientSchema = z17.discriminatedUnion("entity", [
  threadChangedMessageLenientSchema,
  projectChangedMessageLenientSchema,
  environmentChangedMessageLenientSchema,
  hostChangedMessageLenientSchema,
  systemChangedMessageLenientSchema,
  tagsChangedMessageSchema.strip(),
  pluginChangedMessageSchema.strip()
]);

// src/internal/rpc-tags.ts
import { z as z18 } from "zod";
var rpcInvalidationTags = z18.array(z18.string().min(1)).min(1);
function rpcResponseTags(declarations, input, output) {
  const tags = z18.array(z18.string().min(1)).parse(declarations.tags?.(input, output) ?? []);
  const keyTags = {};
  if (declarations.keyTags && typeof output === "object" && output !== null && !Array.isArray(output)) {
    for (const [key, value] of Object.entries(output)) {
      keyTags[key] = z18.array(z18.string().min(1)).parse(declarations.keyTags(key, value));
    }
  }
  const invalidated = z18.array(z18.string().min(1)).parse(declarations.invalidates?.(input, output) ?? []);
  return { tags, keyTags, invalidated };
}

// src/internal/rpc-query-host.ts
import { z as z19 } from "zod";
var rpcQueryKey = (pluginId, method, input) => [
  "plugin-rpc",
  pluginId,
  method,
  input
];
var keyedQueryKey = (pluginId, method) => rpcQueryKey(pluginId, method, { keyed: true });
var keyedCollections = /* @__PURE__ */ new Map();
function keyedCollection(pluginId, method) {
  const name = JSON.stringify([pluginId, method]);
  let collection = keyedCollections.get(name);
  if (!collection) {
    collection = new KeyedCollection(name);
    keyedCollections.set(name, collection);
  }
  return collection;
}
function parsedUpdate(update) {
  return (current) => jsonValueSchema.parse(update(current));
}
function optimisticCache(pluginId, updates) {
  return {
    update(method, input, update) {
      updates.push(
        optimisticQueryUpdate(
          rpcQueryKey(pluginId, method, jsonValueSchema.parse(input ?? null)),
          parsedUpdate(update),
          ["result"]
        )
      );
    },
    updateKey(method, key, update) {
      updates.push(
        optimisticKeyedUpdate(
          keyedCollection(pluginId, method),
          key,
          parsedUpdate(update)
        )
      );
    }
  };
}
async function callRpc(host, pluginId, contract, method, input) {
  let raw;
  try {
    raw = await host.call(pluginId, method, input);
  } catch (error) {
    throw experimental_PluginRpcCallError.from(error);
  }
  const result = jsonValueSchema.safeParse(raw);
  if (!result.success)
    throw new experimental_PluginRpcCallError({
      code: "invalid_response",
      message: `Invalid RPC response for ${method}`
    });
  const methodContract = contract[method];
  if (methodContract === void 0)
    throw new experimental_PluginRpcCallError({
      code: "unknown_method",
      message: `rpc method "${method}" isn't in the contract`
    });
  const parsedInput = await methodContract.input["~standard"].validate(input);
  if (parsedInput.issues !== void 0)
    throw new experimental_PluginRpcCallError({
      code: "invalid_input",
      message: `rpc input validation failed for ${method}`
    });
  return {
    result: result.data,
    ...rpcResponseTags(methodContract, parsedInput.value, result.data)
  };
}
function resolvePluginId(host, pluginId) {
  const resolved = pluginId ?? host.pluginId;
  if (resolved === null) {
    throw new Error(
      "plugin RPC hooks outside a plugin slot component need an explicit pluginId"
    );
  }
  return resolved;
}
var tagsOf = (data) => [
  ...data.tags,
  ...Object.values(data.keyTags).flat()
];
var owners = /* @__PURE__ */ new WeakMap();
function createRpcQueryHooks(useHost) {
  function useSubscription(host, pluginId, enabled) {
    useEffect2(
      () => enabled ? host.subscribe(pluginId) : void 0,
      [host, pluginId, enabled]
    );
  }
  const experimental_useRpcQuery = (options) => {
    const host = useHost();
    const pluginId = resolvePluginId(host, options.pluginId);
    const input = jsonValueSchema.parse(options.input ?? null);
    const queryKey = rpcQueryKey(pluginId, options.method, input);
    useSubscription(host, pluginId, options.enabled ?? true);
    const watchIdentity = canonicalPluginReadInput(input);
    useEffect2(() => {
      if (options.enabled === false) return;
      return host.watch?.(pluginId, options.method, {
        input: jsonValueSchema.parse(JSON.parse(watchIdentity))
      });
    }, [host, pluginId, options.method, watchIdentity, options.enabled]);
    const query = useTaggedQuery(
      {
        queryKey,
        enabled: options.enabled,
        ...taggedQueryOptions(host.queryClient, queryKey, {
          scope: pluginTagScope(pluginId),
          tagsOf
        }),
        queryFn: () => runTaggedRead(
          host.queryClient,
          queryKey,
          async () => callRpc(host, pluginId, options.contract, options.method, input)
        )
      },
      host.queryClient
    );
    return {
      data: query.data?.result,
      error: query.error === null ? null : experimental_PluginRpcCallError.from(
        query.error,
        "invalid_response"
      ),
      isLoading: (options.enabled ?? true) && query.isLoading,
      isFetching: query.isFetching,
      refetch: async () => {
        await query.refetch();
      }
    };
  };
  function experimental_useRpcKeyedQuery(options) {
    const host = useHost();
    const pluginId = resolvePluginId(host, options.pluginId);
    const enabled = options.enabled ?? true;
    const identity = JSON.stringify([...new Set(options.keys)].sort());
    const keys = useMemo2(
      () => z19.array(z19.string()).parse(JSON.parse(identity)),
      [identity]
    );
    let cache = owners.get(host.queryClient);
    if (!cache) {
      cache = /* @__PURE__ */ new Map();
      owners.set(host.queryClient, cache);
    }
    const id = JSON.stringify([pluginId, options.method]);
    let owner = cache.get(id);
    if (!owner) {
      owner = createTaggedKeyedQueryOwner({
        client: host.queryClient,
        queryKey: keyedQueryKey(pluginId, options.method),
        scope: pluginTagScope(pluginId),
        collection: keyedCollection(pluginId, options.method),
        read: async (keys2) => {
          const response = await callRpc(
            host,
            pluginId,
            options.contract,
            options.method,
            { keys: [...keys2] }
          );
          return {
            ...response,
            result: z19.record(z19.string(), jsonValueSchema).parse(response.result)
          };
        }
      });
      cache.set(id, owner);
    }
    const current = owner;
    useSubscription(host, pluginId, enabled && keys.length > 0);
    const subscribe = useCallback2(
      (listener) => enabled && keys.length > 0 ? current.subscribe(keys, listener) : () => {
      },
      [current, keys, enabled]
    );
    const getSnapshot = useCallback2(
      () => current.observer.getCurrentResult(),
      [current]
    );
    const { select: selectRows } = options;
    const select = useCallback2(
      (query2) => {
        const rows = query2.data?.result ?? {};
        const data = Object.fromEntries(
          keys.filter((key) => Object.hasOwn(rows, key)).map((key) => [key, rows[key]])
        );
        return {
          data: selectRows ? selectRows(data) : data,
          error: query2.error === null ? null : experimental_PluginRpcCallError.from(
            query2.error,
            "invalid_response"
          ),
          isLoading: enabled && keys.some((key) => !Object.hasOwn(rows, key)) && query2.isFetching,
          isFetching: query2.isFetching
        };
      },
      [keys, enabled, selectRows]
    );
    const query = useQuerySelection(subscribe, getSnapshot, select);
    useEffect2(() => {
      if (!enabled) return;
      const releases = keys.map(
        (key) => host.watch?.(pluginId, options.method, { key })
      );
      return () => {
        releases.forEach((release) => release?.());
      };
    }, [host, pluginId, options.method, keys, enabled]);
    const refetch = useCallback2(async () => {
      await current.observer.refetch();
    }, [current]);
    return {
      ...query,
      refetch
    };
  }
  function experimental_useRpcMutation(options) {
    const host = useHost();
    const pluginId = resolvePluginId(host, options.pluginId);
    const mutation = useTaggedMutation({
      client: host.queryClient,
      invalidate: (tags) => invalidateTags(host.queryClient, pluginTagScope(pluginId), tags),
      call: async (input) => {
        const response = await callRpc(
          host,
          pluginId,
          options.contract,
          options.method,
          jsonValueSchema.parse(input)
        );
        return {
          ...response,
          result: response.result
        };
      },
      optimistic: (input) => {
        const updates = [];
        options.optimistic?.(
          input,
          optimisticCache(pluginId, updates)
        );
        return updates;
      }
    });
    const { mutate } = mutation;
    return {
      ...mutation,
      error: mutation.error === null ? null : experimental_PluginRpcCallError.from(
        mutation.error,
        "invalid_input"
      ),
      mutate: useCallback2(
        async (...args) => {
          try {
            return await mutate(
              args[0] ?? null
            );
          } catch (error) {
            throw experimental_PluginRpcCallError.from(error);
          }
        },
        [mutate]
      )
    };
  }
  function experimental_useRpcRefresh() {
    const host = useHost();
    const pluginId = resolvePluginId(host, void 0);
    const isRefreshing = useIsFetching({ queryKey: ["plugin-rpc", pluginId] }, host.queryClient) > 0;
    return {
      isRefreshing,
      refresh: () => {
        void invalidateTags(host.queryClient, pluginTagScope(pluginId), null);
      }
    };
  }
  return {
    experimental_useRpcQuery,
    experimental_useRpcKeyedQuery,
    experimental_useRpcMutation,
    experimental_useRpcRefresh
  };
}

// src/testing/app.tsx
import * as React from "react";
import {
  createContext,
  Fragment,
  useCallback as useCallback3,
  useContext,
  useLayoutEffect,
  useEffect as useEffect3,
  useMemo as useMemo3,
  useRef as useRef2,
  useState as useState2,
  useSyncExternalStore as useSyncExternalStore2
} from "react";
import { act, render } from "@testing-library/react";

// src/internal/composer-view.ts
function isComposerDraftEmpty(text, attachmentCount) {
  return text.trim().length === 0 && attachmentCount === 0;
}

// src/internal/composer-draft-transforms.ts
function removeComposerMentions(draft, matches) {
  const removed = draft.mentions.filter(matches).sort((a, b) => a.from - b.from);
  if (removed.length === 0) return draft;
  let text = "";
  let cursor = 0;
  for (const mention of removed) {
    text += draft.text.slice(cursor, mention.from);
    cursor = mention.to;
  }
  const removedSet = new Set(removed);
  const mentions = draft.mentions.filter((mention) => !removedSet.has(mention)).map((mention) => {
    const offset = removed.reduce(
      (sum, item) => sum + (item.to <= mention.from ? item.to - item.from : 0),
      0
    );
    return offset === 0 ? mention : { ...mention, from: mention.from - offset, to: mention.to - offset };
  });
  return { ...draft, text: text + draft.text.slice(cursor), mentions };
}
function setComposerText(draft, text) {
  if (text === draft.text) return draft;
  return {
    ...draft,
    text,
    mentions: reconcileComposerMentions(draft.text, text, draft.mentions)
  };
}
function reconcileComposerMentions(currentText, nextText, mentions) {
  if (currentText === nextText) return [...mentions];
  let unchangedPrefixLength = 0;
  const maximumPrefixLength = Math.min(currentText.length, nextText.length);
  while (unchangedPrefixLength < maximumPrefixLength && currentText[unchangedPrefixLength] === nextText[unchangedPrefixLength]) {
    unchangedPrefixLength += 1;
  }
  let unchangedSuffixLength = 0;
  while (unchangedSuffixLength < currentText.length - unchangedPrefixLength && unchangedSuffixLength < nextText.length - unchangedPrefixLength && currentText[currentText.length - unchangedSuffixLength - 1] === nextText[nextText.length - unchangedSuffixLength - 1]) {
    unchangedSuffixLength += 1;
  }
  const replacedCurrentEnd = currentText.length - unchangedSuffixLength;
  const replacementDelta = nextText.length - currentText.length;
  return mentions.flatMap((mention) => {
    if (mention.to <= unchangedPrefixLength) return [mention];
    if (mention.from >= replacedCurrentEnd) {
      return [
        {
          ...mention,
          from: mention.from + replacementDelta,
          to: mention.to + replacementDelta
        }
      ];
    }
    return [];
  });
}

// src/internal/composer-draft-actions.ts
import { z as z20 } from "zod";
var range = {
  from: z20.number().int().nonnegative(),
  to: z20.number().int().nonnegative(),
  label: z20.string()
};
var mentionSchema = z20.discriminatedUnion("kind", [
  z20.object({
    ...range,
    kind: z20.literal("thread"),
    threadId: z20.string(),
    projectId: z20.string().optional()
  }),
  z20.object({ ...range, kind: z20.literal("project"), projectId: z20.string() }),
  z20.object({ ...range, kind: z20.literal("section"), sectionId: z20.string() }),
  z20.object({
    ...range,
    kind: z20.literal("path"),
    path: z20.string(),
    source: z20.enum(["workspace", "thread-storage"]),
    entryKind: z20.enum(["file", "directory"])
  }),
  z20.object({
    ...range,
    kind: z20.literal("command"),
    trigger: z20.enum(["/", "$"]),
    name: z20.string(),
    source: z20.enum(["skill", "command"]),
    origin: z20.enum(["builtin", "project", "user"]),
    argumentHint: z20.string().nullable()
  }),
  z20.object({ ...range, kind: z20.literal("attachment"), path: z20.string() }),
  z20.object({
    ...range,
    kind: z20.literal("plugin"),
    pluginId: z20.string(),
    provider: z20.string().min(1).refine((value) => !value.includes(":")),
    id: z20.string(),
    icon: z20.string().nullable().optional()
  })
]);
var attachmentFields = {
  type: z20.enum(["localImage", "localFile"]),
  path: z20.string().min(1),
  name: z20.string(),
  mimeType: z20.string().optional(),
  sizeBytes: z20.number().nonnegative().optional()
};
var attachmentsSchema = z20.array(
  z20.union([
    z20.object({
      ...attachmentFields,
      hostId: z20.string().min(1),
      sourceProjectId: z20.undefined().optional()
    }),
    z20.object({
      ...attachmentFields,
      sourceProjectId: z20.string().min(1).optional(),
      hostId: z20.undefined().optional()
    })
  ])
);
var replacementSchema = z20.object({
  text: z20.string(),
  mentions: z20.array(mentionSchema),
  attachments: attachmentsSchema.optional()
}).superRefine((draft, context) => {
  let end = 0;
  for (const mention of [...draft.mentions].sort((a, b) => a.from - b.from)) {
    if (mention.from < end || mention.to <= mention.from || mention.to > draft.text.length) {
      context.addIssue({
        code: "custom",
        message: "Mention ranges must be non-overlapping and inside the draft text."
      });
    }
    end = mention.to;
  }
});
function createComposerDraftActions(target) {
  let cached = null;
  const snapshotOf = (current) => {
    const content = current.getDraft();
    if (cached?.content === content) return cached.snapshot;
    const snapshot = Object.freeze({
      text: content.text,
      mentions: Object.freeze(
        content.mentions.map((mention) => Object.freeze({ ...mention }))
      ),
      attachments: Object.freeze(
        content.attachments.map(
          (attachment) => Object.freeze({ ...attachment })
        )
      )
    });
    cached = { content, snapshot };
    return snapshot;
  };
  const requireAvailable = (current) => {
    if (!current.isAvailable())
      throw new Error("This composer is no longer available.");
  };
  return {
    get draft() {
      return snapshotOf(target());
    },
    replace(next) {
      const current = target();
      requireAvailable(current);
      const snapshot = snapshotOf(current);
      const result = typeof next === "function" ? next(snapshot) : next;
      requireAvailable(current);
      if (result === snapshot) return;
      const parsed = replacementSchema.safeParse(result);
      if (!parsed.success)
        throw new Error(
          "Invalid composer draft: text, mention ranges, or attachments are invalid."
        );
      current.setDraft(parsed.data);
    },
    focus() {
      const current = target();
      requireAvailable(current);
      current.focus();
    }
  };
}

// src/internal/composer-handle.ts
var UNAVAILABLE_MESSAGE = "This composer is no longer available.";
var OFF_SCREEN_MESSAGE = "This composer isn't on screen.";
var warnedAliases = /* @__PURE__ */ new Set();
function warnDeprecatedComposerMember(oldName, newName) {
  if (warnedAliases.has(oldName)) return;
  warnedAliases.add(oldName);
  console.warn(
    `useComposer().${oldName} is deprecated; use useComposer().${newName}.`
  );
}
function appendComposerDraft(current, value, block) {
  const base = block ? current.text.replace(/\s+$/u, "") : current.text;
  const separator = block && base.length > 0 ? "\n\n" : "";
  const offset = base.length + separator.length;
  return {
    text: `${base}${separator}${value.text}`,
    mentions: [
      ...current.mentions.filter((mention) => mention.to <= base.length),
      ...value.mentions.map((mention) => ({
        ...mention,
        from: mention.from + offset,
        to: mention.to + offset
      }))
    ]
  };
}
function validProviderId(provider) {
  const trimmed = provider.trim();
  return trimmed.length === 0 || trimmed.includes(":") ? null : trimmed;
}
function insertValue(parts, controller) {
  const list = Array.isArray(parts) ? parts : [parts];
  let text = "";
  const mentions = [];
  for (const part of list) {
    if (typeof part === "string") {
      text += part;
      continue;
    }
    let mention;
    if ("kind" in part) {
      mention = part;
    } else {
      const provider = validProviderId(part.provider);
      if (provider === null) {
        throw new Error(`Invalid mention provider id "${part.provider}".`);
      }
      mention = {
        from: 0,
        to: 0,
        label: part.label.trim() || part.id,
        kind: "plugin",
        pluginId: controller.pluginId,
        provider,
        id: part.id,
        icon: null
      };
    }
    const serialized = controller.mentionText(mention);
    mentions.push({
      ...mention,
      from: text.length,
      to: text.length + serialized.length
    });
    text += serialized;
  }
  return { text, mentions };
}
function isDraftEmpty(draft, attachmentCount) {
  return draft.text.trim().length === 0 && draft.mentions.length === 0 && attachmentCount === 0;
}
var legacyDrafts = /* @__PURE__ */ new WeakMap();
function withLegacyDraftFields(draft, attachmentCount) {
  const cached = legacyDrafts.get(draft);
  if (cached) return cached;
  const snapshot = { ...draft };
  Object.defineProperties(snapshot, {
    isEmpty: { value: isDraftEmpty(draft, attachmentCount), enumerable: false },
    attachmentCount: { value: attachmentCount, enumerable: false }
  });
  Object.freeze(snapshot);
  legacyDrafts.set(draft, snapshot);
  return snapshot;
}
function waitForUploads(target) {
  return new Promise((resolve) => {
    if (!target.getEditorState().isAttaching) {
      resolve();
      return;
    }
    const unsubscribe = target.subscribeEditorState(() => {
      if (target.getEditorState().isAttaching) return;
      unsubscribe();
      resolve();
    });
  });
}
function createComposerHandleBinding(key, initial) {
  let controller = initial;
  const target = () => controller.target;
  const editorState = () => target().getEditorState();
  const requireAvailable = () => {
    if (!target().isAvailable()) throw new Error(UNAVAILABLE_MESSAGE);
  };
  const legacyAvailable = (method) => {
    if (target().isAvailable()) return true;
    console.warn(
      `[plugin:${controller.pluginId}] useComposer().${method}: ${UNAVAILABLE_MESSAGE}`
    );
    return false;
  };
  const replaceText = (nextText) => {
    const current = target().getDraft();
    if (nextText === current.text) return;
    target().setDraft(setComposerText(current, nextText));
  };
  const insertMention = (mention) => {
    warnDeprecatedComposerMember("insertMention", "insert");
    const provider = validProviderId(mention.provider);
    if (provider === null) {
      console.warn(
        `[plugin:${controller.pluginId}] useComposer().insertMention: invalid provider id "${mention.provider}"`
      );
      return;
    }
    if (!legacyAvailable("insertMention")) return;
    const label = mention.label.trim() || mention.id;
    const current = target().getDraft();
    const separator = current.text.length === 0 || /\s$/u.test(current.text) ? "" : " ";
    const from = current.text.length + separator.length;
    target().setDraft({
      text: `${current.text}${separator}${label} `,
      mentions: [
        ...current.mentions,
        {
          from,
          to: from + label.length,
          label,
          kind: "plugin",
          pluginId: controller.pluginId,
          provider,
          id: mention.id,
          icon: null
        }
      ]
    });
    target().focus();
  };
  const removeMentionFrom = (mention) => {
    const current = target().getDraft();
    const next = removeComposerMentions(
      current,
      (item) => item.kind === "plugin" && item.pluginId === controller.pluginId && item.provider === mention.provider && item.id === mention.id
    );
    if (next !== current) target().setDraft(next);
  };
  const removeMention = (mention) => {
    warnDeprecatedComposerMember("removeMention", "replace");
    requireAvailable();
    removeMentionFrom(mention);
  };
  const insert = (parts, options = {}) => {
    requireAvailable();
    const value = insertValue(parts, controller);
    const block = options.block === true;
    if ((options.at ?? "cursor") === "cursor") {
      if (!target().insertAtCursor(value, block)) {
        throw new Error(OFF_SCREEN_MESSAGE);
      }
      return;
    }
    target().setDraft(appendComposerDraft(target().getDraft(), value, block));
  };
  const submit = async (options = {}) => {
    requireAvailable();
    if (options.sendAt !== void 0 && (!Number.isFinite(options.sendAt) || options.sendAt <= Date.now())) {
      throw new Error("Pick a time in the future.");
    }
    const errorBefore = editorState().attachmentError;
    if (editorState().isAttaching) await waitForUploads(target());
    const state = editorState();
    if (state.attachmentError !== null && state.attachmentError !== errorBefore) {
      throw new Error(state.attachmentError);
    }
    const submission = target().editorSubmit({
      mode: options.experimental_mode ?? "enter",
      ...options.sendAt === void 0 ? {} : { sendAt: options.sendAt },
      ...options.experimental_data === void 0 ? {} : {
        pluginSubmission: {
          pluginId: controller.pluginId,
          data: options.experimental_data
        }
      }
    });
    if (submission === null) throw new Error(OFF_SCREEN_MESSAGE);
    await submission;
  };
  const setSelection = async (selection) => {
    requireAvailable();
    const hostSetSelection = target().setSelection;
    if (hostSetSelection === void 0) {
      throw new Error("This composer has no pickers to set.");
    }
    return hostSetSelection(selection);
  };
  const submittedListeners = /* @__PURE__ */ new Set();
  let submittedSubscription = null;
  const syncSubmittedSubscription = () => {
    const scope = submittedListeners.size === 0 ? null : JSON.stringify(target().scope);
    if (submittedSubscription?.scope === scope) return;
    submittedSubscription?.unsubscribe();
    submittedSubscription = scope === null ? null : {
      scope,
      unsubscribe: controller.onSubmitted(() => {
        for (const listener of [...submittedListeners]) {
          try {
            listener();
          } catch (error) {
            console.error("Composer submission listener failed", error);
          }
        }
      })
    };
  };
  const onSubmitted = (listener) => {
    const entry = () => listener();
    submittedListeners.add(entry);
    syncSubmittedSubscription();
    return () => {
      submittedListeners.delete(entry);
      syncSubmittedSubscription();
    };
  };
  const draftActions = createComposerDraftActions(target);
  const handle = {
    replace: draftActions.replace,
    get scope() {
      return target().scope;
    },
    get key() {
      return target().key;
    },
    get layout() {
      return editorState().layout;
    },
    get isRunning() {
      return editorState().isRunning;
    },
    get isSubmitting() {
      return editorState().isSubmitting;
    },
    get isSubmittingBlocked() {
      return editorState().isSubmittingBlocked;
    },
    get submittingBlockedReason() {
      return editorState().submittingBlockedReason;
    },
    get isEmpty() {
      return isDraftEmpty(target().getDraft(), target().getAttachmentCount());
    },
    get attachmentCount() {
      return target().getAttachmentCount();
    },
    get text() {
      return target().getDraft().text;
    },
    get draft() {
      return withLegacyDraftFields(
        draftActions.draft,
        target().getAttachmentCount()
      );
    },
    get selection() {
      return target().getSelection();
    },
    setText: (next) => {
      warnDeprecatedComposerMember("setText", "replace");
      if (legacyAvailable("setText")) replaceText(next);
    },
    updateText: (updater) => {
      warnDeprecatedComposerMember("updateText", "replace");
      if (legacyAvailable("updateText")) {
        replaceText(updater(target().getDraft().text));
      }
    },
    clear: () => {
      warnDeprecatedComposerMember("clear", "replace");
      if (legacyAvailable("clear")) replaceText("");
    },
    insert,
    setTextEffect: (effect) => controller.setTextEffect(effect),
    setInputLock: (locked) => controller.setInputLock(locked),
    addQuote: (text) => {
      warnDeprecatedComposerMember("addQuote", "replace");
      if (!legacyAvailable("addQuote")) return;
      target().addQuote(text);
      target().focus();
    },
    insertMention,
    removeMention,
    onSubmitted,
    focus: () => target().focus(),
    experimental_openPopup: (id) => target().openPopup?.(controller.pluginId, id) ?? false,
    experimental_closePopup: () => target().closePopup?.(controller.pluginId) ?? false,
    submit,
    setSelection,
    experimental_removeMention: (mention) => {
      warnDeprecatedComposerMember("experimental_removeMention", "replace");
      if (!legacyAvailable("experimental_removeMention")) return;
      removeMentionFrom(mention);
    },
    experimental_onSubmitted: (listener) => {
      warnDeprecatedComposerMember("experimental_onSubmitted", "onSubmitted");
      return onSubmitted(listener);
    },
    experimental_submit: (options) => {
      warnDeprecatedComposerMember("experimental_submit", "submit");
      return submit(options);
    },
    experimental_setSelection: (selection) => {
      warnDeprecatedComposerMember("experimental_setSelection", "setSelection");
      return setSelection(selection);
    }
  };
  Object.defineProperties(handle, {
    run: {
      enumerable: false,
      get: () => {
        const state = editorState();
        return { isRunning: state.isRunning, isSubmitting: state.isSubmitting };
      }
    },
    setThreadRowStatus: { enumerable: false, value: () => {
    } }
  });
  return {
    key,
    handle,
    update(next) {
      controller = next;
      syncSubmittedSubscription();
    }
  };
}

// src/internal/composer-customization-validation.ts
var PLUGIN_SLOT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
var PLUGIN_MESSAGE_DIRECTIVE_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
function normalizePluginThreadRowStatus(value, onRejected) {
  const kind = "contentScript.experimental_setThreadRowStatus";
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    onRejected(`${kind}: status must be null or a non-array object`);
    return void 0;
  }
  const status = value;
  const icon = status.icon;
  if (typeof icon !== "string" || icon.trim() === "") {
    onRejected(`${kind}: "icon" must be a non-blank string`);
    return void 0;
  }
  const label = status.label;
  if (typeof label !== "string" || label.trim() === "") {
    onRejected(`${kind}: "label" must be a non-blank string`);
    return void 0;
  }
  const tone = status.tone;
  if (tone !== void 0 && tone !== "default" && tone !== "running" && tone !== "success" && tone !== "error") {
    onRejected(
      `${kind}: "tone" must be "default", "running", "success", or "error" when set`
    );
    return void 0;
  }
  return {
    icon: icon.trim(),
    label: label.trim(),
    ...tone !== void 0 ? { tone } : {}
  };
}
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

// src/internal/file-navigation-validation.ts
var FILE_PATH_MAX_LENGTH = 32768;
var WINDOWS_DRIVE_ABSOLUTE_PATH = /^[A-Za-z]:[\\/]/u;
var WINDOWS_UNC_ABSOLUTE_PATH = /^\\\\/u;
var REVISION_REF = /^(?:HEAD|[0-9a-f]{4,40})$/iu;
function isJsonObject(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function hasExactKeys(value, keys) {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}
function isNonEmptyIdentity(value) {
  return typeof value === "string" && value.length > 0 && value.length <= FILE_PATH_MAX_LENGTH && value.trim() === value;
}
function hasControlCharacter(value) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint !== void 0 && codePoint < 32) return true;
  }
  return false;
}
function hasUnpairedSurrogate(value) {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 55296 && codeUnit <= 56319) {
      if (index + 1 >= value.length) return true;
      const nextCodeUnit = value.charCodeAt(index + 1);
      if (nextCodeUnit < 56320 || nextCodeUnit > 57343) return true;
      index += 1;
    } else if (codeUnit >= 56320 && codeUnit <= 57343) {
      return true;
    }
  }
  return false;
}
function isValidPathSegment(segment) {
  return segment.length > 0 && segment !== "." && segment !== "..";
}
function isValidRevisionRef(value) {
  return typeof value === "string" && REVISION_REF.test(value);
}
function isPositiveSafeInteger(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
function isValidRelativeFilePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > FILE_PATH_MAX_LENGTH || value.trim() !== value || value.includes("\\") || hasControlCharacter(value) || hasUnpairedSurrogate(value)) {
    return false;
  }
  return value.split("/").every(isValidPathSegment);
}
function isValidAbsoluteHostFilePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > FILE_PATH_MAX_LENGTH || value.trim() !== value || hasControlCharacter(value) || hasUnpairedSurrogate(value)) {
    return false;
  }
  if (value.startsWith("/") && !value.startsWith("//")) {
    const segments = value.slice(1).split("/");
    return segments.length > 0 && segments.every(isValidPathSegment);
  }
  if (WINDOWS_DRIVE_ABSOLUTE_PATH.test(value)) {
    const segments = value.slice(3).split(/[\\/]/u);
    return segments.length > 0 && segments.every(isValidPathSegment);
  }
  if (WINDOWS_UNC_ABSOLUTE_PATH.test(value)) {
    const segments = value.slice(2).split(/[\\/]/u);
    return segments.length >= 3 && segments.every(isValidPathSegment);
  }
  return false;
}
function normalizeExperimentalLiveFileTarget(value) {
  if (!isJsonObject(value) || typeof value.kind !== "string") return null;
  switch (value.kind) {
    case "workspace": {
      const ref = value.experimental_ref;
      if (!hasExactKeys(
        value,
        ref === void 0 ? ["kind", "environmentId", "path"] : ["kind", "environmentId", "path", "experimental_ref"]
      ) || !isNonEmptyIdentity(value.environmentId) || !isValidRelativeFilePath(value.path)) {
        return null;
      }
      const target = {
        kind: value.kind,
        environmentId: value.environmentId,
        path: value.path
      };
      if (ref === void 0) return target;
      return isValidRevisionRef(ref) ? { ...target, experimental_ref: ref } : null;
    }
    case "host":
      if (!hasExactKeys(value, ["kind", "hostId", "path"]) || !isNonEmptyIdentity(value.hostId) || !isValidAbsoluteHostFilePath(value.path)) {
        return null;
      }
      return { kind: value.kind, hostId: value.hostId, path: value.path };
    case "thread-storage":
      if (!hasExactKeys(value, ["kind", "threadId", "path"]) || !isNonEmptyIdentity(value.threadId) || !isValidRelativeFilePath(value.path)) {
        return null;
      }
      return { kind: value.kind, threadId: value.threadId, path: value.path };
    default:
      return null;
  }
}
function normalizeExperimentalFileLocation(value) {
  if (value === null) return null;
  if (!isJsonObject(value) || typeof value.kind !== "string") return void 0;
  switch (value.kind) {
    case "line":
      if (!hasExactKeys(value, ["kind", "line", "column"]) || !isPositiveSafeInteger(value.line) || value.column !== null && !isPositiveSafeInteger(value.column)) {
        return void 0;
      }
      return {
        kind: value.kind,
        line: value.line,
        column: value.column
      };
    case "range":
      if (!hasExactKeys(value, ["kind", "startLine", "endLine"]) || !isPositiveSafeInteger(value.startLine) || !isPositiveSafeInteger(value.endLine) || value.endLine < value.startLine) {
        return void 0;
      }
      return {
        kind: value.kind,
        startLine: value.startLine,
        endLine: value.endLine
      };
    default:
      return void 0;
  }
}
function normalizeExperimentalFileOpenOptions(value) {
  if (!isJsonObject(value) || !hasExactKeys(value, ["target", "location"])) {
    return null;
  }
  const target = normalizeExperimentalLiveFileTarget(value.target);
  const location = normalizeExperimentalFileLocation(value.location);
  if (target === null || location === void 0) return null;
  return { target, location };
}

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

// src/internal/plugin-app-registration-collector.ts
import { z as z21 } from "zod";
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
  return z21.object({
    key: z21.string().min(1).max(32).refine(
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
    mod: z21.boolean().default(false),
    meta: z21.boolean().default(false),
    control: z21.boolean().default(false),
    alt: z21.boolean().default(false),
    shift: z21.boolean().default(false)
  }).strict().refine(
    (shortcut) => shortcut.mod || shortcut.meta || shortcut.control || shortcut.alt || /^F(?:[1-9]|1[0-9]|2[0-4])$/u.test(shortcut.key),
    "Use Command, Control, or Alt with a key, or a function key"
  );
}
function requireOptionalOrder(kind, order2) {
  if (order2 === void 0) return {};
  if (!Number.isFinite(order2)) {
    throw new Error(`${kind}: "order" must be a finite number`);
  }
  return { order: order2 };
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
      ...availability === "action" && registration.params !== void 0 ? { params: z21.json().parse(registration.params) } : {}
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

// src/testing/app.tsx
import { Fragment as Fragment2, jsx, jsxs } from "react/jsx-runtime";
function TestSidebarNavigationIcon({
  icon,
  className
}) {
  return /* @__PURE__ */ jsx(
    "span",
    {
      "aria-hidden": "true",
      className,
      "data-sidebar-navigation-icon": icon.kind === "host" ? icon.name : `${icon.pluginId}/${icon.icon ?? ""}`
    }
  );
}
function testComposerKey(scope) {
  switch (scope.kind) {
    case "thread":
      return `test-composer:thread:${scope.threadId}`;
    case "queued-message":
      return `test-composer:queued-message:${scope.threadId}:${scope.queuedMessageId}`;
    case "new-thread":
      return `test-composer:new-thread:${scope.projectId ?? ""}`;
  }
}
function testComposerMentionText(mention) {
  switch (mention.kind) {
    case "thread":
      return `@thread:${mention.threadId}`;
    case "project":
      return `@project:${mention.projectId}`;
    case "section":
      return `@section:${mention.sectionId}`;
    case "command":
      return `${mention.trigger}${mention.name}`;
    case "plugin":
    case "attachment":
      return `@${mention.label}`;
    case "path": {
      const path = mention.source === "thread-storage" ? `thread-storage:${mention.path}` : mention.path;
      return `@${path}${mention.entryKind === "directory" && !path.endsWith("/") ? "/" : ""}`;
    }
  }
}
function createSdkFakeNode(provided, path, calls) {
  const callable = function sdkFakeNode() {
  };
  return new Proxy(callable, {
    apply(_target, _thisArg, args) {
      calls.push({ method: path, args });
      if (typeof provided !== "function") {
        throw new Error(
          `no sdk fake for "${path}" \u2014 add it to renderSlot options.sdk`
        );
      }
      return provided(...args);
    },
    get(_target, key) {
      if (typeof key !== "string" || key === "then") return void 0;
      const next = provided !== null && typeof provided === "object" && !Array.isArray(provided) ? provided[key] : void 0;
      return createSdkFakeNode(
        next,
        path === "" ? key : `${path}.${key}`,
        calls
      );
    }
  });
}
function createSdkFake(fakes, calls) {
  return createSdkFakeNode(fakes, "", calls);
}
function TestThreadTitle({ threadId }) {
  const env = useSlotEnv("ThreadTitle");
  const thread = env.sidebarThreads.threads.find((row) => row.id === threadId);
  if (thread === void 0) return null;
  return /* @__PURE__ */ jsx("span", { "data-thread-title": threadId, children: thread.displayTitle });
}
function TestThreadStatusGlyph({
  indicator,
  archived = false,
  rowStatus = null,
  hideIdleDraftLabel = false,
  size = "default"
}) {
  if (!archived && indicator === "none" && rowStatus === null) return null;
  return /* @__PURE__ */ jsx(
    "span",
    {
      "data-thread-status-glyph": archived ? "archived" : indicator,
      "data-row-status": rowStatus?.label,
      "data-row-status-tone": rowStatus?.tone,
      "data-hide-idle-draft-label": hideIdleDraftLabel ? "" : void 0,
      "data-size": size
    }
  );
}
function SlotLifecycleGuard({
  children,
  onUnmount
}) {
  useEffect3(() => () => onUnmount(), [onUnmount]);
  return children;
}
var SlotEnvContext = createContext(null);
var NO_THREAD_ACTIONS = () => [];
var NO_THREAD_BULK_ACTIONS = () => [];
var NO_THREAD_ACTION_REGISTRATIONS = [];
function noRenameEditor() {
}
function useTestThreadActions(hook, thread, options) {
  const entries = useSlotEnv(hook).threadActions(thread, {
    requestRename: options?.requestRename ?? noRenameEditor
  });
  const keys = options?.keys;
  if (keys === void 0) return entries;
  return keys.flatMap((key) => {
    const entry = entries.find((candidate) => candidate.key === key);
    return entry === void 0 ? [] : [entry];
  });
}
function TestThreadActionsMenuItems({
  hook,
  thread,
  inline = [],
  requestRename,
  onClose
}) {
  const rename = requestRename ?? noRenameEditor;
  const entries = useTestThreadActions(hook, thread, { requestRename: rename });
  return /* @__PURE__ */ jsx(
    TestThreadActionRows,
    {
      label: "Thread actions",
      entries,
      inline,
      rename,
      onClose
    }
  );
}
function TestThreadActionRows({
  label,
  entries,
  inline,
  rename,
  onClose,
  onKeyDown
}) {
  const rows = [
    ...entries.map((entry) => ({
      key: entry.key,
      action: entry.action,
      run: () => entry.action.run()
    })),
    ...inline.map((item) => ({
      key: item.key,
      action: item.action,
      run: () => item.action.run({ requestRename: rename })
    }))
  ];
  return /* @__PURE__ */ jsx("div", { role: "menu", "aria-label": label, onKeyDown, children: rows.map((row) => /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      role: "menuitem",
      "data-thread-action": row.key,
      disabled: row.action.disabled,
      onClick: () => {
        void row.run();
        onClose();
      },
      children: row.action.label
    },
    row.key
  )) });
}
function useTestMenuOpenState({
  onOpenChange,
  onCloseAutoFocus
}) {
  const [open, setOpen] = useState2(false);
  return {
    open,
    show: () => {
      setOpen(true);
      onOpenChange?.(true);
    },
    close: () => {
      setOpen(false);
      onOpenChange?.(false);
      onCloseAutoFocus?.(new Event("focus", { cancelable: true }));
    }
  };
}
var TEST_TRIGGER_HOST_CLASS = "bb-test-thread-actions-trigger";
function TestThreadActionsMenu({
  thread,
  trigger,
  inline,
  requestRename,
  onOpenChange,
  onCloseAutoFocus
}) {
  const menu = useTestMenuOpenState({ onOpenChange, onCloseAutoFocus });
  const triggerElement = useRef2(null);
  useLayoutEffect(() => {
    const element = triggerElement.current;
    if (element?.getAttribute("aria-haspopup") !== "menu") {
      throw new Error(
        "experimental_ThreadActionsMenu: `trigger` must spread the props and ref it receives onto the button it renders, or the menu never opens"
      );
    }
    if (!element.classList.contains(TEST_TRIGGER_HOST_CLASS)) {
      throw new Error(
        "experimental_ThreadActionsMenu: `trigger` replaced the host's className; merge props.className into its own"
      );
    }
  });
  return /* @__PURE__ */ jsxs("span", { "data-testid": "bb-thread-actions-menu", "data-thread-id": thread.id, children: [
    trigger({
      ref: triggerElement,
      type: "button",
      className: TEST_TRIGGER_HOST_CLASS,
      "aria-haspopup": "menu",
      "aria-expanded": menu.open,
      onClick: menu.show
    }),
    menu.open ? /* @__PURE__ */ jsx(
      TestThreadActionsMenuItems,
      {
        hook: "experimental_ThreadActionsMenu",
        thread,
        inline,
        requestRename,
        onClose: menu.close
      }
    ) : null
  ] });
}
function TestThreadActionsContextMenu({
  thread,
  children,
  inline = [],
  requestRename,
  onOpenChange,
  onCloseAutoFocus,
  onEscapeKeyDown,
  disabled,
  dragging,
  experimental_bulkThreads
}) {
  const menu = useTestMenuOpenState({ onOpenChange, onCloseAutoFocus });
  const resolveSelection = useSlotEnv(
    "experimental_ThreadActionsContextMenu"
  ).threadBulkActions;
  const selection = experimental_bulkThreads !== void 0 && experimental_bulkThreads.length > 1 ? experimental_bulkThreads : null;
  const onKeyDown = (event) => {
    if (event.key !== "Escape") return;
    onEscapeKeyDown?.(event.nativeEvent);
    menu.close();
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-testid": "bb-thread-actions-context-menu",
      "data-thread-id": thread.id,
      "data-selection-thread-ids": selection === null ? void 0 : selection.map((target) => target.id).join(" "),
      "data-disabled": disabled === true ? "true" : "false",
      "data-dragging": dragging === true ? "true" : "false",
      className: "contents",
      onContextMenu: (event) => {
        if (disabled === true || dragging === true) return;
        event.preventDefault();
        menu.show();
      },
      children: [
        children,
        menu.open && selection !== null ? /* @__PURE__ */ jsx(
          TestThreadActionRows,
          {
            label: `Actions for ${selection.length} threads`,
            entries: resolveSelection(selection),
            inline,
            rename: requestRename ?? noRenameEditor,
            onClose: menu.close,
            onKeyDown
          }
        ) : null,
        menu.open && selection === null ? /* @__PURE__ */ jsx(
          TestThreadActionsMenuItems,
          {
            hook: "experimental_ThreadActionsContextMenu",
            thread,
            inline,
            requestRename,
            onClose: menu.close
          }
        ) : null
      ]
    }
  );
}
function useSlotEnv(hook) {
  const env = useContext(SlotEnvContext);
  if (!env) {
    throw new Error(
      `${hook}() needs the test slot environment \u2014 mount the component via renderSlot(...) from @workspace-core/plugin-sdk/testing/app`
    );
  }
  return env;
}
function definePluginApp(setup) {
  if (typeof setup !== "function") {
    throw new Error("definePluginApp expects a setup function");
  }
  return Object.freeze({ __bbPluginApp: true, setup });
}
function isPluginAppDefinition(value) {
  return typeof value === "object" && value !== null && value.__bbPluginApp === true && typeof value.setup === "function";
}
function TestThreadChat({
  threadId,
  variant = "full",
  layout = "contained",
  focusRequest,
  permissionPolicy = "inherit",
  className,
  leadingContent,
  messageActions
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-testid": "bb-thread-chat",
      "data-thread-id": threadId,
      "data-variant": variant,
      "data-layout": layout,
      "data-focus-request": focusRequest ?? 0,
      "data-permission-policy": permissionPolicy,
      "data-message-actions": (messageActions ?? []).map((action) => action.id).join(" "),
      className,
      children: [
        leadingContent === void 0 ? null : /* @__PURE__ */ jsx("div", { "data-testid": "bb-thread-chat-leading-content", children: leadingContent }),
        "ThreadChat stub (",
        threadId,
        ")",
        (messageActions ?? []).map((action) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "data-testid": `bb-thread-chat-action-${action.id}`,
            "data-roles": action.roles === void 0 ? "" : action.roles.join(" "),
            onClick: () => {
              void action.run({
                id: "test-message",
                threadId,
                role: action.roles?.[0] ?? "assistant",
                text: "test message text",
                sourceSeqEnd: 1,
                experimental_messageSeq: 1
              });
            },
            children: action.title
          },
          action.id
        ))
      ]
    }
  );
}
function TestMarkdown({ content, className }) {
  return /* @__PURE__ */ jsx("div", { "data-testid": "bb-markdown", className, children: content });
}
function TestUrlLink({
  href,
  onClick,
  rel,
  target,
  ...anchorProps
}) {
  const navigate = useSlotEnv("UrlLink").navigate;
  const normalizedTarget = target?.toLowerCase();
  const opensNewBrowsingContext = normalizedTarget !== void 0 && normalizedTarget !== "" && normalizedTarget !== "_self" && normalizedTarget !== "_parent" && normalizedTarget !== "_top" && normalizedTarget !== "_unfencedtop";
  const relTokens = rel?.split(/\s+/u).filter(Boolean) ?? [];
  const normalizedRelTokens = relTokens.map((token) => token.toLowerCase());
  const resolvedRel = opensNewBrowsingContext && !normalizedRelTokens.includes("opener") ? [
    ...relTokens,
    ...normalizedRelTokens.includes("noopener") ? [] : ["noopener"],
    ...normalizedRelTokens.includes("noreferrer") ? [] : ["noreferrer"]
  ].join(" ") : rel;
  return /* @__PURE__ */ jsx(
    "a",
    {
      ...anchorProps,
      href,
      target,
      rel: resolvedRel,
      onClick: (event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.currentTarget.hasAttribute("download") || event.currentTarget.hasAttribute("target")) {
          return;
        }
        if (navigate.openUrl(href)) event.preventDefault();
      }
    }
  );
}
function TestFileLink({
  target,
  location = null,
  onClick,
  ...anchorProps
}) {
  const navigate = useSlotEnv("experimental_FileLink").navigate;
  const options = normalizeExperimentalFileOpenOptions({ target, location });
  const href = options === null ? void 0 : `./${encodeURIComponent(options.target.path)}`;
  return /* @__PURE__ */ jsx(
    "a",
    {
      ...anchorProps,
      href,
      onClick: (event) => {
        onClick?.(event);
        if (options === null || event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.currentTarget.hasAttribute("download")) {
          return;
        }
        event.preventDefault();
        navigate.experimental_openFilePreview(options);
      }
    }
  );
}
function TestNewThreadComposer({
  defaultProjectId,
  defaultProviderId,
  defaultModel,
  defaultReasoningLevel,
  defaultServiceTier,
  defaultPermissionMode,
  defaultEnvironment,
  initialPrompt,
  placeholder,
  layout = "contained",
  focusRequest,
  className,
  draftKey,
  onSubmit
}) {
  const [text, setText] = useState2(initialPrompt ?? "");
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-testid": "bb-new-thread-composer",
      "data-default-project-id": defaultProjectId ?? "",
      "data-default-provider-id": defaultProviderId ?? "",
      "data-default-model": defaultModel ?? "",
      "data-default-reasoning-level": defaultReasoningLevel ?? "",
      "data-default-service-tier": defaultServiceTier ?? "",
      "data-default-permission-mode": defaultPermissionMode ?? "",
      "data-default-environment": defaultEnvironment === void 0 ? "" : JSON.stringify(defaultEnvironment),
      "data-layout": layout,
      "data-focus-request": focusRequest ?? 0,
      "data-draft-key": draftKey ?? "",
      className,
      children: [
        /* @__PURE__ */ jsx(
          "textarea",
          {
            "data-testid": "bb-new-thread-composer-input",
            placeholder,
            value: text,
            onChange: (event) => setText(event.target.value)
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "data-testid": "bb-new-thread-composer-submit",
            onClick: () => {
              void onSubmit({
                projectId: defaultProjectId ?? "project-test",
                providerId: defaultProviderId ?? "codex",
                model: defaultModel ?? "gpt-5",
                reasoningLevel: defaultReasoningLevel ?? "medium",
                permissionMode: defaultPermissionMode ?? "auto",
                ...defaultServiceTier !== void 0 ? { serviceTier: defaultServiceTier } : {},
                executionInputSources: {},
                environment: defaultEnvironment ?? { type: "project-default" },
                input: [{ type: "text", text, mentions: [] }]
              });
            },
            children: "Start thread"
          }
        )
      ]
    }
  );
}
function TestProviderModelPicker({
  value,
  onChange,
  routing,
  allowProviderChange = true,
  align = "start",
  disabled,
  className
}) {
  const [draft, setDraft] = useState2(value);
  const { providerId, model, reasoningLevel, serviceTier } = value;
  useEffect3(
    () => setDraft({
      providerId,
      model,
      reasoningLevel,
      ...serviceTier === void 0 ? {} : { serviceTier }
    }),
    [providerId, model, reasoningLevel, serviceTier]
  );
  const reasoningLevels = [
    "none",
    "low",
    "medium",
    "high",
    "xhigh",
    "ultracode",
    "max",
    "ultra"
  ];
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-testid": "bb-provider-model-picker",
      "data-routing-kind": routing?.kind ?? "primary",
      "data-routing-id": routing === void 0 ? "" : routing.kind === "host" ? routing.hostId : routing.environmentId,
      "data-disabled": disabled ? "true" : "false",
      "data-provider-change-allowed": allowProviderChange ? "true" : "false",
      "data-align": align,
      className,
      children: /* @__PURE__ */ jsxs("fieldset", { disabled, className: "contents", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            "aria-label": "Provider ID",
            disabled: !allowProviderChange,
            value: draft.providerId,
            onChange: (event) => setDraft((current) => ({
              ...current,
              providerId: event.target.value
            }))
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            "aria-label": "Model",
            value: draft.model,
            onChange: (event) => setDraft((current) => ({ ...current, model: event.target.value }))
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            "aria-label": "Reasoning level",
            value: draft.reasoningLevel,
            onChange: (event) => {
              const reasoningLevel2 = reasoningLevels.find(
                (candidate) => candidate === event.target.value
              );
              if (reasoningLevel2 === void 0) return;
              setDraft((current) => ({ ...current, reasoningLevel: reasoningLevel2 }));
            }
          }
        ),
        /* @__PURE__ */ jsxs(
          "select",
          {
            "aria-label": "Service tier",
            value: draft.serviceTier ?? "",
            onChange: (event) => setDraft((current) => {
              const serviceTier2 = event.target.value;
              if (serviceTier2 === "") {
                const next = { ...current };
                delete next.serviceTier;
                return next;
              }
              return { ...current, serviceTier: serviceTier2 };
            }),
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "Unsupported" }),
              /* @__PURE__ */ jsx("option", { value: "default", children: "Default" }),
              /* @__PURE__ */ jsx("option", { value: "fast", children: "Fast" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onChange(draft), children: "Apply execution selection" })
      ] })
    }
  );
}
function TestBranchPicker({
  hostId,
  projectId,
  value,
  onChange,
  label,
  placeholder,
  disabled
}) {
  const inert = hostId === null || projectId === null || disabled === true;
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-testid": "bb-branch-picker",
      "data-host-id": hostId ?? "",
      "data-project-id": projectId ?? "",
      "data-disabled": inert ? "true" : "false",
      children: /* @__PURE__ */ jsx(
        "input",
        {
          "aria-label": label ?? "Branch",
          placeholder: placeholder ?? "Select branch",
          disabled: inert,
          value: value ?? "",
          onChange: (event) => {
            const next = event.target.value;
            if (next.length === 0) {
              onChange(null);
            } else {
              onChange(next);
            }
          }
        }
      )
    }
  );
}
function TestPermissionModePicker({
  providerId,
  value,
  onChange,
  routing,
  align = "end",
  disabled,
  className
}) {
  return /* @__PURE__ */ jsxs(
    "select",
    {
      "aria-label": "Permission mode",
      value,
      disabled,
      "data-testid": "bb-permission-mode-picker",
      "data-provider-id": providerId,
      "data-align": align,
      "data-routing-kind": routing?.kind ?? "primary",
      "data-routing-id": routing === void 0 ? "" : routing.kind === "host" ? routing.hostId : routing.environmentId,
      className,
      onChange: (event) => {
        const permissionMode = event.target.value;
        if (permissionMode === "accept-edits" || permissionMode === "auto" || permissionMode === "full") {
          onChange(permissionMode);
        }
      },
      children: [
        /* @__PURE__ */ jsx("option", { value: "accept-edits", children: "Accept Edits" }),
        /* @__PURE__ */ jsx("option", { value: "auto", children: "Approve for me" }),
        /* @__PURE__ */ jsx("option", { value: "full", children: "Full Access" })
      ]
    }
  );
}
function TestComposerRoot(_props) {
  return null;
}
function TestComposerPluginActions() {
  return null;
}
function TestComposerPluginPopup({
  contribution
}) {
  return /* @__PURE__ */ jsx(contribution.popup.component, {});
}
function TestComposerMenuEntry({
  contribution
}) {
  return /* @__PURE__ */ jsx("div", { role: "menuitem", children: contribution.item.label });
}
var IDLE_COMPOSER_MENTION_SEARCH = {
  status: "idle",
  refreshing: false,
  groups: [],
  search: () => {
  }
};
var IDLE_COMPOSER_COMMAND_SEARCH = {
  status: "idle",
  refreshing: false,
  groups: [],
  search: () => {
  }
};
var TEST_COMPOSER_CONTRIBUTIONS = {
  popups: [],
  plusMenuItems: [],
  sendMenuItems: [],
  Actions: TestComposerPluginActions,
  Popup: TestComposerPluginPopup,
  MenuEntry: TestComposerMenuEntry
};
function TestVoiceInputButton({
  warning: _warning,
  variant: _variant,
  size: _size,
  ...props
}) {
  return /* @__PURE__ */ jsx("button", { ...props });
}
function TestVoiceRecordingBar({
  state,
  onConfirm,
  onCancel
}) {
  return /* @__PURE__ */ jsxs("div", { "data-voice-recording-state": state, children: [
    /* @__PURE__ */ jsx("button", { type: "button", onClick: onConfirm, children: "Finish voice input" }),
    /* @__PURE__ */ jsx("button", { type: "button", onClick: onCancel, children: "Cancel voice input" })
  ] });
}
function TestFailedVoiceRecordings({
  recordings,
  className
}) {
  return /* @__PURE__ */ jsx("ul", { className, children: recordings.map((recording) => /* @__PURE__ */ jsx("li", { children: recording.errorMessage }, recording.id)) });
}
function TestShortcutHint({
  shortcut,
  className
}) {
  return shortcut === null ? null : /* @__PURE__ */ jsx("kbd", { className, children: shortcut.label });
}
function TestImageLightbox({
  imageSrc,
  imageAlt,
  isOpen
}) {
  const visible = isOpen ?? imageSrc !== null;
  return visible && imageSrc !== null ? /* @__PURE__ */ jsx("img", { alt: imageAlt, src: imageSrc }) : null;
}
function TestPromptMentionIcon({
  className
}) {
  return /* @__PURE__ */ jsx("span", { className, "aria-hidden": true });
}
var TEST_PROMPT_MENTION_ATTRIBUTE = "data-test-prompt-mention";
function testPromptMentionClipboardAttributes(mention, text) {
  return { [TEST_PROMPT_MENTION_ATTRIBUTE]: JSON.stringify({ mention, text }) };
}
function readTestPromptMentionClipboard(element) {
  const value = element.getAttribute(TEST_PROMPT_MENTION_ATTRIBUTE);
  if (value === null) return null;
  const pill = JSON.parse(value);
  return pill;
}
function TestPluginIcon({ className }) {
  return /* @__PURE__ */ jsx("span", { className, "aria-hidden": true });
}
function TestThreadTitleText({
  title,
  className
}) {
  return /* @__PURE__ */ jsx("span", { className, children: title });
}
function TestVoiceInputTextarea({
  onValueChange,
  onVoiceInputActiveChange: _onVoiceInputActiveChange,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      ...props,
      onChange: (event) => onValueChange(event.target.value)
    }
  );
}
function TestSourceCode({
  content,
  path,
  overflow = "scroll",
  highlightedLines = null,
  className
}) {
  return /* @__PURE__ */ jsx(
    "pre",
    {
      "data-testid": "bb-source-code",
      "data-path": path,
      "data-overflow": overflow,
      "data-highlighted-lines": highlightedLines === null ? "" : `${highlightedLines.start}-${highlightedLines.end}`,
      className,
      children: content
    }
  );
}
function TestDiff({
  patch,
  path,
  view = "unified",
  overflow = "scroll",
  showLineNumbers = true,
  experimental_fullFileContents,
  className
}) {
  return /* @__PURE__ */ jsx(
    "pre",
    {
      "data-testid": "bb-diff",
      "data-path": path,
      "data-view": view,
      "data-overflow": overflow,
      "data-show-line-numbers": showLineNumbers ? "true" : "false",
      "data-has-full-file-contents": experimental_fullFileContents === void 0 ? "false" : "true",
      className,
      children: patch
    }
  );
}
function TestInfoSection({
  label,
  count,
  accessory,
  trailing,
  children
}) {
  return /* @__PURE__ */ jsxs("section", { "aria-label": label, "data-testid": "bb-info-section", children: [
    /* @__PURE__ */ jsxs("h3", { children: [
      label,
      count === void 0 ? null : /* @__PURE__ */ jsx("span", { children: count })
    ] }),
    accessory,
    trailing,
    children
  ] });
}
function TestDetailRow({ label, icon, children }) {
  return /* @__PURE__ */ jsxs("div", { "data-testid": "bb-detail-row", "data-icon": icon, children: [
    /* @__PURE__ */ jsx("dt", { children: label }),
    /* @__PURE__ */ jsx("dd", { children })
  ] });
}
function TestInfoList({
  items,
  getKey,
  renderItem,
  limit
}) {
  return /* @__PURE__ */ jsx("ul", { "data-limit": limit, children: items.map((item) => /* @__PURE__ */ jsx(Fragment, { children: renderItem(item) }, getKey(item))) });
}
function TestInfoListRow({
  leading,
  name,
  title,
  context,
  trailing,
  onSelect
}) {
  return /* @__PURE__ */ jsxs("li", { children: [
    leading,
    onSelect === void 0 ? /* @__PURE__ */ jsx("span", { title, children: name }) : /* @__PURE__ */ jsx("button", { type: "button", title, onClick: onSelect, children: name }),
    context === void 0 ? null : /* @__PURE__ */ jsx("span", { children: context }),
    trailing
  ] });
}
var activeClipboard = null;
function captureClipboardWrites(result) {
  const writes = [];
  activeClipboard = (content) => {
    writes.push({ ...content });
    return result?.(content) ?? Promise.resolve(true);
  };
  return writes;
}
var testPluginSdkApp = {
  definePluginApp,
  ...createRpcQueryHooks(() => useSlotEnv("rpc query").rpcQueryHost),
  useRpc() {
    return useSlotEnv("useRpc").rpcClient;
  },
  useRealtime(channel, handler) {
    const env = useSlotEnv("useRealtime");
    const handlerRef = useRef2(handler);
    useEffect3(() => {
      handlerRef.current = handler;
    });
    useEffect3(() => {
      const listener = (payload) => handlerRef.current(payload);
      let listeners = env.realtimeHandlers.get(channel);
      if (!listeners) {
        listeners = /* @__PURE__ */ new Set();
        env.realtimeHandlers.set(channel, listeners);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, [env, channel]);
  },
  useRealtimeConnectionState() {
    const connection = useSlotEnv(
      "useRealtimeConnectionState"
    ).realtimeConnection;
    return useSyncExternalStore2(
      connection.subscribe,
      connection.getSnapshot,
      connection.getSnapshot
    );
  },
  useSettings() {
    return useSlotEnv("useSettings").settingsState;
  },
  experimental_useExperiment(key) {
    return useSlotEnv("experimental_useExperiment").experiments.has(key);
  },
  useBbContext() {
    return useSlotEnv("useBbContext").bbContext;
  },
  experimental_usePluginId() {
    return useSlotEnv("experimental_usePluginId").pluginId;
  },
  experimental_useQuestionFormHost() {
    return useSlotEnv("experimental_useQuestionFormHost").questionFormHost;
  },
  useBbNavigate() {
    return useSlotEnv("useBbNavigate").navigate;
  },
  experimental_useAppPanel() {
    return useSlotEnv("experimental_useAppPanel").appPanel;
  },
  experimental_useFixedTabTarget(tab) {
    const store = useSlotEnv("experimental_useFixedTabTarget").fixedTabTarget;
    const state = useSyncExternalStore2(
      store.subscribe,
      store.getSnapshot,
      store.getSnapshot
    );
    if (state === null || state.panelId !== ("context" in tab ? tab.context.kind === "nav-panel" ? tab.context.panelId : null : tab.panelId) || state.tabId !== tab.id || tab.experimental_target === void 0) {
      return null;
    }
    try {
      if (!tab.experimental_target.validate(state.target)) return null;
    } catch {
      return null;
    }
    return {
      clear: () => store.clear(state.sequence),
      sequence: state.sequence,
      target: state.target
    };
  },
  useComposer() {
    const composer = useSlotEnv("useComposer").composer;
    useSyncExternalStore2(
      composer.subscribe,
      composer.getVersionSnapshot,
      composer.getVersionSnapshot
    );
    return composer.api;
  },
  useComposers() {
    const composer = useSlotEnv("useComposers").composer;
    useSyncExternalStore2(
      composer.subscribe,
      composer.getVersionSnapshot,
      composer.getVersionSnapshot
    );
    return composer.apiList;
  },
  ThreadChat: TestThreadChat,
  Markdown: TestMarkdown,
  experimental_FileLink: TestFileLink,
  experimental_Icon: ({ name, fallback, ...props }) => /* @__PURE__ */ jsx("span", { ...props, "data-icon": name, "data-icon-fallback": fallback }),
  experimental_ProviderIcon: ({
    providerKind,
    provider,
    fallback,
    ...props
  }) => /* @__PURE__ */ jsx(
    "span",
    {
      ...props,
      "data-provider-kind": providerKind,
      "data-provider-id": provider.id,
      "data-provider-logo": provider.logoUrl ?? void 0,
      "data-provider-glyph": (typeof provider.icon === "string" ? provider.icon : provider.icon?.glyph) ?? void 0,
      "data-provider-tint": provider.strings?.iconTint == null ? void 0 : JSON.stringify(provider.strings.iconTint),
      "data-provider-fallback": fallback
    }
  ),
  UrlLink: TestUrlLink,
  experimental_NewThreadComposer: TestNewThreadComposer,
  experimental_VoiceInputTextarea: TestVoiceInputTextarea,
  experimental_ComposerRoot: TestComposerRoot,
  experimental_VoiceInputButton: TestVoiceInputButton,
  experimental_VoiceRecordingBar: TestVoiceRecordingBar,
  experimental_FailedVoiceRecordings: TestFailedVoiceRecordings,
  experimental_ShortcutHint: TestShortcutHint,
  experimental_ImageLightbox: TestImageLightbox,
  experimental_PromptMentionIcon: TestPromptMentionIcon,
  experimental_describePromptMention(mention) {
    return {
      className: "prompt-mention-pill",
      title: mention.label,
      text: `${mention.kind}: ${mention.label}`
    };
  },
  experimental_promptMentionClipboardAttributes: testPromptMentionClipboardAttributes,
  experimental_readPromptMentionClipboard: readTestPromptMentionClipboard,
  experimental_PluginIcon: TestPluginIcon,
  experimental_ThreadTitleText: TestThreadTitleText,
  experimental_useThreadTitleDisplayText(title) {
    return title;
  },
  experimental_ProviderModelPicker: TestProviderModelPicker,
  experimental_PermissionModePicker: TestPermissionModePicker,
  experimental_BranchPicker: TestBranchPicker,
  experimental_useBranches() {
    return useSlotEnv("experimental_useBranches").branchesState;
  },
  experimental_useCheckoutState() {
    return useSlotEnv("experimental_useCheckoutState").checkoutState;
  },
  experimental_SourceCode: TestSourceCode,
  experimental_Diff: TestDiff,
  experimental_InfoSection: TestInfoSection,
  experimental_DetailRow: TestDetailRow,
  experimental_InfoList: TestInfoList,
  experimental_InfoListRow: TestInfoListRow,
  experimental_useSidebarThreads() {
    return useSlotEnv("experimental_useSidebarThreads").sidebarThreads;
  },
  experimental_useProviders() {
    return useSlotEnv("experimental_useProviders").providers;
  },
  experimental_useCodeTheme() {
    return useSlotEnv("experimental_useCodeTheme").codeTheme;
  },
  experimental_useCanOpenFileExternally(target) {
    return useSlotEnv(
      "experimental_useCanOpenFileExternally"
    ).canOpenFileExternally(target);
  },
  experimental_copyToClipboard(content) {
    return activeClipboard?.(content) ?? Promise.resolve(true);
  },
  experimental_saveFile() {
    return Promise.resolve("started");
  },
  experimental_useSidebarThreadActions() {
    return useSlotEnv("experimental_useSidebarThreadActions").sidebarActions;
  },
  experimental_useThreadActions(thread, options) {
    return useTestThreadActions(
      "experimental_useThreadActions",
      thread,
      options
    );
  },
  experimental_useArchiveEnvironmentThreads() {
    const calls = useSlotEnv(
      "experimental_useArchiveEnvironmentThreads"
    ).environmentArchiveCalls;
    return useCallback3(
      async (environmentId) => {
        calls.push(environmentId);
      },
      [calls]
    );
  },
  experimental_useThreadActionRegistrations() {
    return useSlotEnv("experimental_useThreadActionRegistrations").threadActionRegistrations;
  },
  experimental_ThreadActionsMenu: TestThreadActionsMenu,
  experimental_ThreadActionsContextMenu: TestThreadActionsContextMenu,
  experimental_PluginRpcCallError,
  experimental_THREAD_ACTION_GROUPS,
  experimental_THREAD_CONTEXT_SEGMENT_GROUPS,
  experimental_THREAD_INFO_ROW_GROUPS,
  experimental_THREAD_INFO_SECTION_GROUPS,
  experimental_useSidebarNavigation() {
    return useSlotEnv("experimental_useSidebarNavigation").sidebarNavigation;
  },
  experimental_useSidebarNavigationSplit(itemId, _options) {
    const env = useSlotEnv("experimental_useSidebarNavigationSplit");
    const kind = env.sidebarNavigation.items.find((item) => item.id === itemId)?.action.kind;
    const isAvailable = kind === "new-thread" || kind === "open-plugin-panel";
    return useMemo3(
      () => ({
        splitProps: isAvailable ? {
          onPointerDown: () => {
            env.sidebarNavigationCalls.push({
              method: "beginSplitDrag",
              itemId
            });
          }
        } : {},
        isAvailable,
        layout: null
      }),
      [env, isAvailable, itemId]
    );
  },
  experimental_SidebarNavigationIcon: TestSidebarNavigationIcon,
  experimental_useSidebarThreadSplit(threadId) {
    const env = useSlotEnv("experimental_useSidebarThreadSplit");
    return useMemo3(
      () => ({
        splitProps: {
          onPointerDown: () => {
            env.sidebarActionCalls.push({ method: "open", threadId });
          }
        },
        isAvailable: true,
        layout: null
      }),
      [env, threadId]
    );
  },
  useSidebarThreadDraft(threadId) {
    const env = useSlotEnv("useSidebarThreadDraft");
    return useMemo3(
      () => ({ hasUnsubmittedDraft: env.sidebarDraftThreadIds.has(threadId) }),
      [env, threadId]
    );
  },
  useSidebarThreadDraftIds() {
    return useSlotEnv("useSidebarThreadDraftIds").sidebarDraftThreadIds;
  },
  useSidebarThreadRowStatus(threadId) {
    const env = useSlotEnv("useSidebarThreadRowStatus");
    return env.sidebarRowStatuses.get(threadId) ?? null;
  },
  useSidebarThreadRowStatuses() {
    return useSlotEnv("useSidebarThreadRowStatuses").sidebarRowStatuses;
  },
  useSidebarSplitLayout() {
    return useSlotEnv("useSidebarSplitLayout").sidebarSplitLayout;
  },
  useSidebarThreadShortcut(threadId) {
    const env = useSlotEnv("useSidebarThreadShortcut");
    return env.sidebarShortcuts.get(threadId) ?? null;
  },
  ThreadTitle: TestThreadTitle,
  experimental_ThreadStatusGlyph: TestThreadStatusGlyph,
  useEnvironmentProviders() {
    return useSlotEnv("useEnvironmentProviders").environmentProviders;
  },
  useSdk() {
    return useSlotEnv("useSdk").sdk;
  },
  experimental_useComposerRenderer() {
    const renderer = useSlotEnv(
      "experimental_useComposerRenderer"
    ).composerRenderer;
    if (renderer === null) {
      throw new Error(
        "experimental_useComposerRenderer() is only available inside an experimental_composer component; pass composerRenderer to mount it as one."
      );
    }
    return renderer;
  },
  experimental_useComposerContributions() {
    if (useSlotEnv("experimental_useComposerContributions").composerRenderer === null) {
      throw new Error(
        "experimental_useComposerContributions() is only available inside an experimental_composer component; pass composerRenderer to mount it as one."
      );
    }
    return TEST_COMPOSER_CONTRIBUTIONS;
  },
  experimental_useComposerMentionSearch() {
    return IDLE_COMPOSER_MENTION_SEARCH;
  },
  experimental_useComposerCommandSearch() {
    return IDLE_COMPOSER_COMMAND_SEARCH;
  },
  useComposerView() {
    const composer = useSlotEnv("useComposerView").composer;
    const version = useSyncExternalStore2(
      composer.subscribe,
      composer.getVersionSnapshot,
      composer.getVersionSnapshot
    );
    return useMemo3(() => {
      const text = composer.getText();
      const attachmentCount = composer.getAttachmentCount();
      return {
        scope: composer.getScope(),
        layout: composer.getLayout(),
        draft: {
          text,
          isEmpty: isComposerDraftEmpty(text, attachmentCount),
          attachmentCount
        },
        run: composer.getRun()
      };
    }, [composer, version]);
  }
};
function installTestPluginRuntime() {
  const host = globalThis;
  host.__bbPluginRuntime = {
    ...host.__bbPluginRuntime,
    react: host.__bbPluginRuntime?.react ?? React,
    pluginSdkApp: testPluginSdkApp
  };
}
async function loadPluginApp(source) {
  installTestPluginRuntime();
  const resolved = typeof source === "function" ? await source() : source;
  const definition = isPluginAppDefinition(resolved) ? resolved : resolved.default;
  if (!isPluginAppDefinition(definition)) {
    throw new Error(
      "the bundle's default export is not definePluginApp(...) from @workspace-core/plugin-sdk/app"
    );
  }
  return collectPluginAppRegistrations(definition);
}
async function mountPluginContentScripts(app, options) {
  const controller = new AbortController();
  const generation = options.generation ?? 1;
  const mounted = [];
  const threadRowStatuses = /* @__PURE__ */ new Map();
  const threadRowStatusCalls = [];
  const experimental_clipboardWrites = captureClipboardWrites(
    options.experimental_copyToClipboard
  );
  let disposed = false;
  const setThreadRowStatus = (threadId, status) => {
    if (controller.signal.aborted) return;
    if (typeof threadId !== "string" || threadId.trim().length === 0) {
      console.warn(
        `bb plugin "${options.pluginId}": contentScript.experimental_setThreadRowStatus: "threadId" must be a non-empty string`
      );
      return;
    }
    const normalizedThreadId = threadId.trim();
    const normalizedStatus = normalizePluginThreadRowStatus(
      status,
      (reason) => console.warn(`bb plugin "${options.pluginId}": ${reason}`)
    );
    if (normalizedStatus === void 0) return;
    const recordedStatus = normalizedStatus === null ? null : { ...normalizedStatus };
    threadRowStatusCalls.push({
      threadId: normalizedThreadId,
      status: recordedStatus
    });
    if (recordedStatus === null) {
      threadRowStatuses.delete(normalizedThreadId);
    } else {
      threadRowStatuses.set(normalizedThreadId, recordedStatus);
    }
  };
  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    controller.abort();
    for (const script of [...mounted].reverse()) {
      if (script.dispose === null) continue;
      try {
        await script.dispose();
      } catch (error) {
        console.warn(
          `[plugin:${options.pluginId}] content script "${script.id}" cleanup failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    threadRowStatuses.clear();
  };
  try {
    for (const registration of app.contentScripts) {
      const result = await registration.mount({
        pluginId: options.pluginId,
        generation,
        signal: controller.signal,
        ...!options.omitExperimentalThreadRowStatus ? { experimental_setThreadRowStatus: setThreadRowStatus } : {}
      });
      if (result !== void 0 && typeof result !== "function") {
        throw new Error(
          `content script "${registration.id}" mount must return a cleanup function, a promise of one, or nothing`
        );
      }
      mounted.push({ id: registration.id, dispose: result ?? null });
    }
  } catch (error) {
    await dispose();
    throw error;
  }
  return {
    inspection: {
      get mountedIds() {
        return mounted.map(({ id }) => id);
      },
      signal: controller.signal,
      get disposed() {
        return disposed;
      },
      get threadRowStatusCalls() {
        return threadRowStatusCalls.map(({ threadId, status }) => ({
          threadId,
          status: status === null ? null : { ...status }
        }));
      },
      getThreadRowStatus(threadId) {
        const status = threadRowStatuses.get(threadId);
        return status === void 0 ? null : { ...status };
      },
      experimental_clipboardWrites
    },
    lifecycle: { dispose }
  };
}
function strictJsonRoundTrip(value, label) {
  const ancestors = /* @__PURE__ */ new Set();
  function visit(current, path) {
    if (current === null || typeof current === "string" || typeof current === "boolean") {
      return;
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current)) {
        throw new Error(`${label} at ${path} contains a non-finite number`);
      }
      return;
    }
    if (typeof current !== "object") {
      throw new Error(`${label} at ${path} is not a JSON value`);
    }
    if (ancestors.has(current)) {
      throw new Error(`${label} at ${path} is cyclic`);
    }
    ancestors.add(current);
    try {
      if (Array.isArray(current)) {
        current.forEach((item, index) => visit(item, `${path}[${index}]`));
        return;
      }
      const prototype = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new Error(`${label} at ${path} must be a plain JSON object`);
      }
      if (Reflect.ownKeys(current).some((key) => typeof key === "symbol")) {
        throw new Error(`${label} at ${path} contains a symbol key`);
      }
      for (const [key, child] of Object.entries(current)) {
        visit(child, `${path}.${key}`);
      }
    } finally {
      ancestors.delete(current);
    }
  }
  visit(value, "$");
  return JSON.parse(JSON.stringify(value));
}
function renderSlot(registration, props, options = {}) {
  installTestPluginRuntime();
  const rpcCalls = [];
  const rpcHandlers = options.rpc ?? {};
  const parseRpcValue = async (schema, value, code) => {
    const parsed = await schema["~standard"].validate(value);
    if (parsed.issues !== void 0)
      throw new experimental_PluginRpcCallError({
        code,
        message: parsed.issues.map((issue) => issue.message).join("; ")
      });
    return parsed.value;
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  const callRpc2 = async (method, input) => {
    const normalizedInput = input === void 0 ? null : strictJsonRoundTrip(input, `rpc "${method}" input`);
    rpcCalls.push({ method, input: normalizedInput });
    const handler = rpcHandlers[method];
    if (!handler) {
      throw new experimental_PluginRpcCallError({
        code: "unknown_method",
        message: `no rpc handler for "${method}" \u2014 add it to renderSlot options.rpc`
      });
    }
    const declaration = options.experimental_rpcContract?.[method];
    const parsedInput = declaration ? await parseRpcValue(declaration.input, normalizedInput, "invalid_input") : normalizedInput;
    let result2;
    try {
      result2 = await handler(parsedInput);
    } catch (error) {
      throw experimental_PluginRpcCallError.from(error, "handler_error");
    }
    const parsedOutput = declaration ? await parseRpcValue(declaration.output, result2, "invalid_output") : result2;
    return strictJsonRoundTrip(parsedOutput, `rpc "${method}" result`);
  };
  const rpcClient = {
    call: (method, input) => callRpc2(method, input)
  };
  const realtimeHandlers = /* @__PURE__ */ new Map();
  let realtimeConnectionState = options.realtimeConnectionState ?? "connected";
  const realtimeConnectionListeners = /* @__PURE__ */ new Set();
  const realtimeConnection = {
    getSnapshot: () => realtimeConnectionState,
    subscribe(listener) {
      realtimeConnectionListeners.add(listener);
      return () => realtimeConnectionListeners.delete(listener);
    },
    setState(state) {
      if (state === realtimeConnectionState) return;
      realtimeConnectionState = state;
      for (const listener of realtimeConnectionListeners) listener();
    }
  };
  const navigateCalls = [];
  const retired = options;
  const experimental_panelCalls = [];
  const experimental_fixedTabOpenCalls = [];
  const experimental_tabOpenCalls = [];
  let fixedTabTargetSnapshot = options.experimental_fixedTabTarget === void 0 ? null : {
    panelId: options.experimental_fixedTabTarget.panelId ?? null,
    sequence: 1,
    tabId: options.experimental_fixedTabTarget.tabId,
    target: strictJsonRoundTrip(
      options.experimental_fixedTabTarget.target,
      "fixed tab target"
    )
  };
  const fixedTabTargetListeners = /* @__PURE__ */ new Set();
  const fixedTabTarget = {
    getSnapshot: () => fixedTabTargetSnapshot,
    subscribe(listener) {
      fixedTabTargetListeners.add(listener);
      return () => fixedTabTargetListeners.delete(listener);
    },
    clear(sequence) {
      if (fixedTabTargetSnapshot?.sequence !== sequence) return;
      fixedTabTargetSnapshot = null;
      for (const listener of fixedTabTargetListeners) listener();
    }
  };
  function openTabWithRetiredHosts(tabOptions) {
    if (retired.experimental_openTab !== void 0)
      return retired.experimental_openTab({
        surface: { kind: "current" },
        ...tabOptions
      });
    if (tabOptions.tab.availability === "action") {
      navigateCalls.push({
        method: "openThreadPanel",
        options: {
          actionId: tabOptions.tab.id,
          ...tabOptions.title === void 0 ? {} : { title: tabOptions.title },
          ...tabOptions.params === void 0 ? {} : { params: tabOptions.params }
        }
      });
      return retired.openThreadPanel?.({
        actionId: tabOptions.tab.id,
        ...tabOptions.title === void 0 ? {} : { title: tabOptions.title },
        ...tabOptions.params === void 0 ? {} : { params: tabOptions.params }
      }) ?? false;
    }
    const call = {
      surface: { kind: "current" },
      ...tabOptions.tab.context.kind === "nav-panel" ? { panelId: tabOptions.tab.context.panelId } : {},
      tabId: tabOptions.tab.id,
      ...tabOptions.target === void 0 ? {} : { target: tabOptions.target }
    };
    experimental_fixedTabOpenCalls.push(call);
    return retired.experimental_openFixedTab?.(call) ?? false;
  }
  function jsonTabOptions(tabOptions) {
    try {
      if (tabOptions.tab.availability === "fixed")
        return tabOptions.target === void 0 ? { tab: tabOptions.tab } : {
          tab: tabOptions.tab,
          target: strictJsonRoundTrip(tabOptions.target, "tab target")
        };
      return {
        tab: tabOptions.tab,
        ...tabOptions.title === void 0 ? {} : { title: tabOptions.title },
        ...tabOptions.params === void 0 ? {} : { params: strictJsonRoundTrip(tabOptions.params, "tab params") }
      };
    } catch {
      return null;
    }
  }
  const panelController = {
    openTab(tabOptions) {
      experimental_panelCalls.push({ method: "openTab", options: tabOptions });
      const json = jsonTabOptions(tabOptions);
      if (json === null) return false;
      const accepted = options.experimental_panel?.openTab?.(json) ?? openTabWithRetiredHosts(json);
      if (accepted && json.tab.availability === "fixed" && json.target !== void 0) {
        fixedTabTargetSnapshot = {
          panelId: json.tab.context.kind === "nav-panel" ? json.tab.context.panelId : null,
          sequence: (fixedTabTargetSnapshot?.sequence ?? 0) + 1,
          tabId: json.tab.id,
          target: json.target
        };
        for (const listener of fixedTabTargetListeners) listener();
      }
      return accepted;
    },
    toggleTab(tabOptions) {
      experimental_panelCalls.push({
        method: "toggleTab",
        options: tabOptions
      });
      const json = jsonTabOptions(tabOptions);
      if (json === null) return false;
      return options.experimental_panel?.toggleTab?.(json) ?? false;
    },
    close() {
      experimental_panelCalls.push({ method: "close" });
      return options.experimental_panel?.close?.() ?? false;
    }
  };
  const appPanel = {
    ...panelController,
    experimental_openTab(tabOptions) {
      experimental_tabOpenCalls.push(tabOptions);
      return panelController.openTab(tabOptions);
    },
    openFixedTab(panelOptions) {
      let target;
      if (panelOptions.target !== void 0) {
        try {
          target = strictJsonRoundTrip(
            panelOptions.target,
            "fixed tab open target"
          );
        } catch {
          return false;
        }
        if (panelOptions.tab.experimental_target === void 0) return false;
        try {
          if (!panelOptions.tab.experimental_target.validate(target)) {
            return false;
          }
        } catch {
          return false;
        }
      }
      if (panelOptions.tab.panelId === void 0 && target !== void 0)
        return false;
      return appPanel.experimental_openTab({
        surface: panelOptions.surface,
        tab: {
          id: panelOptions.tab.id,
          context: panelOptions.tab.panelId === void 0 ? { kind: "thread" } : { kind: "nav-panel", panelId: panelOptions.tab.panelId },
          availability: "fixed"
        },
        ...target === void 0 ? {} : { target }
      });
    }
  };
  const sidebarActionCalls = [];
  const sidebarNavigationCalls = [];
  const sidebarNavigation = {
    items: options.sidebarNavigation?.items ?? [],
    activeItemId: options.sidebarNavigation?.activeItemId ?? null,
    isHomeActive: options.sidebarNavigation?.isHomeActive ?? true,
    isShortcutModifierHeld: options.sidebarNavigation?.isShortcutModifierHeld ?? false,
    actions: {
      activate(itemId, activationOptions) {
        sidebarNavigationCalls.push({
          method: "activate",
          itemId,
          target: activationOptions.target
        });
      },
      goHome(activationOptions) {
        sidebarNavigationCalls.push({
          method: "goHome",
          target: activationOptions?.target ?? "current"
        });
      },
      setVisible(itemId, isVisible) {
        sidebarNavigationCalls.push({
          method: "setVisible",
          itemId,
          isVisible
        });
      },
      setOrder(itemIds) {
        sidebarNavigationCalls.push({
          method: "setOrder",
          itemIds: [...itemIds]
        });
      },
      openCustomize() {
        sidebarNavigationCalls.push({ method: "openCustomize" });
      },
      openDetails(itemId) {
        sidebarNavigationCalls.push({ method: "openDetails", itemId });
      },
      async disablePlugin(itemId) {
        sidebarNavigationCalls.push({ method: "disablePlugin", itemId });
      }
    }
  };
  const environmentArchiveCalls = [];
  const sidebarDraftThreadIds = new Set(
    options.sidebarDraftThreadIds ?? []
  );
  const sidebarRowStatuses = new Map(
    Object.entries(options.sidebarRowStatuses ?? {})
  );
  const sidebarShortcuts = new Map(
    Object.entries(options.sidebarShortcuts ?? {})
  );
  const sidebarThreads = {
    experimental_archived: options.sidebarThreads?.experimental_archived ?? null,
    status: options.sidebarThreads?.status ?? "ready",
    threads: options.sidebarThreads?.threads ?? [],
    experimental_hosts: options.sidebarThreads?.experimental_hosts ?? [],
    projects: options.sidebarThreads?.projects ?? [],
    sections: options.sidebarThreads?.sections ?? []
  };
  const providers = {
    status: options.providers?.status ?? "ready",
    providers: options.providers?.providers ?? []
  };
  const environmentProviders = {
    status: options.environmentProviders?.status ?? "ready",
    providers: options.environmentProviders?.providers ?? []
  };
  const sdkCalls = [];
  const sdk = createSdkFake(options.sdk ?? {}, sdkCalls);
  const codeTheme = {
    mode: options.codeTheme?.mode ?? "light",
    name: options.codeTheme?.name ?? "pierre-light",
    theme: options.codeTheme?.theme ?? null
  };
  const experimental_clipboardWrites = captureClipboardWrites(
    options.experimental_copyToClipboard
  );
  const sidebarActions = {
    open(threadId2, openOptions) {
      sidebarActionCalls.push({
        method: "open",
        threadId: threadId2,
        ...openOptions ? { options: { ...openOptions } } : {}
      });
    },
    openNewThread(newThreadOptions) {
      sidebarActionCalls.push({
        method: "openNewThread",
        ...newThreadOptions ? { options: { ...newThreadOptions } } : {}
      });
    },
    async setPinned(threadId2, pinned) {
      sidebarActionCalls.push({ method: "setPinned", threadId: threadId2, pinned });
    },
    async setRead(threadId2, read) {
      sidebarActionCalls.push({ method: "setRead", threadId: threadId2, read });
    },
    async rename(threadId2, title) {
      sidebarActionCalls.push({ method: "rename", threadId: threadId2, title });
    },
    archive(threadId2) {
      sidebarActionCalls.push({ method: "archive", threadId: threadId2 });
    },
    async experimental_archiveEnvironmentThreads(environmentId) {
      sidebarActionCalls.push({
        method: "experimental_archiveEnvironmentThreads",
        environmentId
      });
    },
    requestDelete(threadId2) {
      sidebarActionCalls.push({ method: "requestDelete", threadId: threadId2 });
    }
  };
  const navigate = {
    toThread(threadId2, threadOptions) {
      navigateCalls.push({
        method: "toThread",
        threadId: threadId2,
        ...threadOptions !== void 0 ? { options: threadOptions } : {}
      });
    },
    toProject(projectId2) {
      navigateCalls.push({ method: "toProject", projectId: projectId2 });
    },
    toPluginPanel(path, panelOptions) {
      navigateCalls.push({
        method: "toPluginPanel",
        path,
        ...panelOptions !== void 0 ? { options: panelOptions } : {}
      });
    },
    toCompose(composeOptions) {
      navigateCalls.push({
        method: "toCompose",
        ...composeOptions !== void 0 ? { options: composeOptions } : {}
      });
    },
    openThreadPanel(panelOptions) {
      return panelController.openTab({
        tab: {
          id: panelOptions.actionId,
          context: { kind: "thread" },
          availability: "action"
        },
        ...panelOptions.title === void 0 ? {} : { title: panelOptions.title },
        ...panelOptions.params === void 0 ? {} : { params: panelOptions.params }
      });
    },
    openUrl(url) {
      navigateCalls.push({ method: "openUrl", url });
      return options.openUrl?.(url) ?? false;
    },
    experimental_openFilePreview(fileOptions) {
      navigateCalls.push({
        method: "experimental_openFilePreview",
        options: fileOptions
      });
      return options.openFilePreview?.(fileOptions) ?? false;
    },
    experimental_openFileExternally(fileOptions) {
      navigateCalls.push({
        method: "experimental_openFileExternally",
        options: fileOptions
      });
      return options.openFileExternally?.(fileOptions) ?? false;
    },
    async experimental_openTerminal(terminalOptions) {
      navigateCalls.push({
        method: "experimental_openTerminal",
        options: terminalOptions
      });
      return options.openTerminal?.(terminalOptions) ?? false;
    }
  };
  const projectId = options.context?.projectId ?? null;
  const threadId = options.context?.threadId ?? null;
  let composerScope = options.composer?.scope ?? (threadId !== null ? { kind: "thread", threadId } : { kind: "new-thread", projectId });
  let composerSelection = composerScope.kind === "queued-message" ? null : {
    ...composerScope.kind === "new-thread" && projectId !== null ? { projectId } : {},
    ...options.composer?.selection
  };
  let composerText = options.composer?.text ?? "";
  let composerMentions = [
    ...options.composer?.mentions ?? []
  ];
  let composerAttachments = [...options.composer?.attachments ?? []];
  let composerAttachmentCount = options.composer?.attachmentCount ?? composerAttachments.length;
  const composerLayout = options.composer?.layout ?? "expanded";
  const composerIsRunning = options.composer?.isRunning ?? false;
  const composerIsSubmitting = options.composer?.isSubmitting ?? false;
  const composerPluginId = options.pluginId ?? "test-plugin";
  let composerVersion = 0;
  const composerListeners = /* @__PURE__ */ new Set();
  const notifyComposerListeners = () => {
    composerVersion += 1;
    for (const listener of composerListeners) listener();
  };
  const commitComposerDraft = (nextText, nextMentions) => {
    if (nextText === composerText && nextMentions === composerMentions) return;
    composerText = nextText;
    composerMentions = nextMentions;
    notifyComposerListeners();
  };
  const commitComposerText = (next) => {
    if (next === composerText) return;
    commitComposerDraft(
      next,
      reconcileComposerMentions(composerText, next, composerMentions)
    );
  };
  const composerBlockedReason = () => {
    if (options.composer?.submittingBlockedReason !== void 0) {
      return options.composer.submittingBlockedReason;
    }
    if (composerIsSubmitting) return "Submitting...";
    return composerText.trim() === "" && composerAttachmentCount === 0 ? "Type a message first." : null;
  };
  let composerDraftCache = null;
  const composerDraft = () => {
    if (composerDraftCache?.version !== composerVersion) {
      composerDraftCache = {
        version: composerVersion,
        draft: {
          text: composerText,
          mentions: composerMentions,
          attachments: composerAttachments
        }
      };
    }
    return composerDraftCache.draft;
  };
  const composerLog = {
    get text() {
      return composerText;
    },
    get draft() {
      return composerHandle.draft;
    },
    get key() {
      return testComposerKey(composerScope);
    },
    get scope() {
      return composerScope;
    },
    get selection() {
      return composerSelection;
    },
    get attachmentCount() {
      return composerAttachmentCount;
    },
    textEffect: null,
    textEffectCalls: [],
    inputLocked: false,
    inputLockCalls: [],
    quotes: [],
    mentions: [],
    focusCount: 0,
    submits: [],
    selections: []
  };
  const composerOwnership = { active: true };
  const composerIsAvailable = () => composerOwnership.active || composerScope.kind !== "queued-message";
  const submissionListeners = /* @__PURE__ */ new Set();
  const composerTarget = {
    get key() {
      return testComposerKey(composerScope);
    },
    get scope() {
      return composerScope;
    },
    getDraft: composerDraft,
    getAttachmentCount: () => composerAttachmentCount,
    getSelection: () => composerSelection,
    setDraft: (next) => {
      if (next.attachments !== void 0) {
        composerAttachments = [...next.attachments];
        composerAttachmentCount = composerAttachments.length;
      }
      commitComposerDraft(next.text, [...next.mentions]);
    },
    addQuote(text) {
      const trimmed = text.replace(/\r\n|\r/gu, "\n").trim();
      if (trimmed === "") return;
      const block = trimmed.split("\n").map((line) => line.length > 0 ? `> ${line}` : ">").join("\n");
      commitComposerText(
        composerText === "" ? `${block}
` : `${composerText}
${block}
`
      );
      composerLog.quotes.push(text);
    },
    getEditorState: () => {
      const reason = composerBlockedReason();
      return {
        layout: composerLayout,
        isRunning: composerIsRunning,
        isSubmitting: composerIsSubmitting,
        isSubmittingBlocked: reason !== null,
        submittingBlockedReason: reason,
        isAttaching: false,
        attachmentError: null
      };
    },
    subscribeEditorState: () => () => {
    },
    async editorSubmit({ mode, sendAt, pluginSubmission }) {
      const reason = composerBlockedReason();
      if (reason !== null) throw new Error(reason);
      composerLog.submits.push({
        ...mode === "enter" ? {} : { experimental_mode: mode },
        ...sendAt === void 0 ? {} : { sendAt },
        ...pluginSubmission === void 0 ? {} : { experimental_data: pluginSubmission.data }
      });
      commitComposerDraft("", []);
      for (const listener of submissionListeners) listener();
    },
    insertAtCursor(value, block) {
      composerTarget.setDraft(
        appendComposerDraft(composerDraft(), value, block)
      );
      return true;
    },
    isAvailable: composerIsAvailable,
    focus() {
      composerLog.focusCount += 1;
    },
    async setSelection(selection) {
      if (composerScope.kind === "queued-message") {
        throw new Error("This composer has no pickers to set.");
      }
      const {
        projectId: _projectId,
        environment: _environment,
        ...rest
      } = selection;
      const accepted = composerScope.kind === "thread" ? rest : { ...selection };
      composerLog.selections.push(accepted);
      composerSelection = { ...composerSelection, ...accepted };
      notifyComposerListeners();
      return composerSelection;
    }
  };
  const composerHandle = createComposerHandleBinding(
    testComposerKey(composerScope),
    {
      pluginId: composerPluginId,
      target: composerTarget,
      mentionText: testComposerMentionText,
      setTextEffect(effect) {
        if (!composerOwnership.active) return;
        composerLog.textEffect = effect;
        composerLog.textEffectCalls.push(effect);
      },
      setInputLock(locked) {
        if (!composerOwnership.active) return;
        composerLog.inputLocked = locked;
        composerLog.inputLockCalls.push(locked);
      },
      onSubmitted(listener) {
        submissionListeners.add(listener);
        return () => {
          submissionListeners.delete(listener);
        };
      }
    }
  ).handle;
  const forgetLoggedMention = ({
    provider,
    id
  }) => {
    for (let index = composerLog.mentions.length - 1; index >= 0; index -= 1) {
      const mention = composerLog.mentions[index];
      if (mention?.provider === provider && mention.id === id) {
        composerLog.mentions.splice(index, 1);
      }
    }
  };
  const { insertMention, removeMention, experimental_removeMention } = composerHandle;
  Object.assign(composerHandle, {
    insertMention(mention) {
      insertMention(mention);
      composerLog.mentions.push(mention);
    },
    removeMention(mention) {
      removeMention(mention);
      forgetLoggedMention(mention);
    },
    experimental_removeMention(mention) {
      experimental_removeMention(mention);
      forgetLoggedMention(mention);
    }
  });
  const composer = {
    api: composerHandle,
    apiList: [composerHandle],
    getAttachmentCount: () => composerAttachmentCount,
    getLayout: () => composerLayout,
    getRun: () => ({
      isRunning: composerIsRunning,
      isSubmitting: composerIsSubmitting
    }),
    getScope: () => composerScope,
    getText: () => composerText,
    getVersionSnapshot: () => composerVersion,
    subscribe(listener) {
      composerListeners.add(listener);
      return () => composerListeners.delete(listener);
    }
  };
  const rpcQueryHost = {
    pluginId: options.pluginId ?? "test-plugin",
    queryClient,
    subscribe: () => () => {
    },
    call: (_pluginId, method, input) => callRpc2(method, input)
  };
  const env = {
    rpcQueryHost,
    rpcClient,
    rpcCalls,
    realtimeHandlers,
    realtimeConnection,
    settingsState: { values: options.settings, isLoading: false },
    bbContext: { projectId, threadId },
    pluginId: options.pluginId ?? "test-plugin",
    questionFormHost: {
      shortcuts: /* @__PURE__ */ new Map(),
      registerChoiceHandler: () => () => {
      }
    },
    navigate,
    navigateCalls,
    appPanel,
    fixedTabTarget,
    composer,
    composerLog,
    sidebarThreads,
    sidebarActions,
    sidebarActionCalls,
    sidebarNavigation,
    sidebarNavigationCalls,
    environmentArchiveCalls,
    threadActions: options.threadActions ?? NO_THREAD_ACTIONS,
    threadBulkActions: options.threadBulkActions ?? NO_THREAD_BULK_ACTIONS,
    threadActionRegistrations: options.threadActionRegistrations ?? NO_THREAD_ACTION_REGISTRATIONS,
    sidebarDraftThreadIds,
    experiments: new Set(options.experiments ?? []),
    sidebarRowStatuses,
    sidebarShortcuts,
    sidebarSplitLayout: options.sidebarSplitLayout ?? null,
    composerRenderer: options.composerRenderer ?? null,
    environmentProviders,
    sdk,
    sdkCalls,
    providers,
    codeTheme,
    canOpenFileExternally: options.canOpenFileExternally ?? (() => false),
    branchesState: {
      branches: options.branchesState?.branches ?? [],
      remoteBranches: options.branchesState?.remoteBranches ?? [],
      isLoading: options.branchesState?.isLoading ?? false,
      refresh: options.branchesState?.refresh ?? (() => Promise.resolve())
    },
    checkoutState: {
      isGit: true,
      unborn: false,
      detached: false,
      dirty: false,
      currentBranch: "main",
      operation: { kind: "none" },
      ...options.checkoutState
    }
  };
  const releaseComposerOwnership = () => {
    if (!composerOwnership.active) return;
    composerOwnership.active = false;
    composerLog.textEffect = null;
    composerLog.inputLocked = false;
  };
  let pageTitle = null;
  const usePageTitle = registration.experimental_usePageTitle;
  function SlotPageTitle({ children }) {
    const value = usePageTitle ? usePageTitle(props) : null;
    useLayoutEffect(() => {
      pageTitle = value;
      return () => {
        pageTitle = null;
      };
    }, [value]);
    return /* @__PURE__ */ jsx(Fragment2, { children });
  }
  const renderSlotTree = (ui) => /* @__PURE__ */ jsx(SlotEnvContext.Provider, { value: env, children: /* @__PURE__ */ jsx(SlotLifecycleGuard, { onUnmount: releaseComposerOwnership, children: /* @__PURE__ */ jsx(SlotPageTitle, { children: ui }) }) });
  const Component = registration.component;
  const element = renderSlotTree(/* @__PURE__ */ jsx(Component, { ...props }));
  const result = render(element);
  const rerenderSlot = (ui) => {
    result.rerender(renderSlotTree(ui));
  };
  const emitRealtime = async (channel, payload) => {
    const normalized = payload === void 0 ? null : strictJsonRoundTrip(payload, `realtime "${channel}" payload`);
    const listeners = realtimeHandlers.get(channel);
    await act(async () => {
      for (const listener of [...listeners ?? []]) {
        listener(normalized);
      }
    });
  };
  const setRealtimeConnectionState = async (state) => {
    await act(async () => {
      realtimeConnection.setState(state);
      if (state === "connected")
        await invalidateTags(
          queryClient,
          pluginTagScope(options.pluginId ?? "test-plugin"),
          null
        );
    });
  };
  const setComposerText2 = async (text) => {
    await act(async () => commitComposerText(text));
  };
  const setComposerScope = async (scope) => {
    await act(async () => {
      composerScope = scope;
      notifyComposerListeners();
    });
  };
  const experimental_invalidateRpc = async (tags, pluginId = options.pluginId ?? "test-plugin") => {
    await act(async () => {
      await invalidateTags(queryClient, pluginTagScope(pluginId), tags);
    });
  };
  const unmountSlot = () => {
    if (!composerOwnership.active) return;
    result.unmount();
  };
  const retiredLogs = {
    experimental_fixedTabOpenCalls,
    experimental_tabOpenCalls
  };
  return {
    ...result,
    rerender: rerenderSlot,
    unmount: unmountSlot,
    rpcCalls,
    experimental_invalidateRpc,
    emitRealtime,
    setRealtimeConnectionState,
    setComposerText: setComposerText2,
    setComposerScope,
    navigateCalls,
    experimental_panelCalls,
    ...retiredLogs,
    sidebarActionCalls,
    sidebarNavigationCalls,
    experimental_environmentArchiveCalls: environmentArchiveCalls,
    sdkCalls,
    experimental_clipboardWrites,
    composer: composerLog,
    behavior: {
      experimental_invalidateRpc,
      emitRealtime,
      setRealtimeConnectionState,
      setComposerText: setComposerText2,
      setComposerScope
    },
    inspection: {
      get experimental_pageTitle() {
        return pageTitle;
      },
      rpcCalls,
      navigateCalls,
      experimental_panelCalls,
      ...retiredLogs,
      sidebarActionCalls,
      sidebarNavigationCalls,
      experimental_environmentArchiveCalls: environmentArchiveCalls,
      sdkCalls,
      experimental_clipboardWrites,
      composer: composerLog
    },
    get experimental_pageTitle() {
      return pageTitle;
    },
    lifecycle: { rerender: rerenderSlot, unmount: unmountSlot }
  };
}
export {
  installTestPluginRuntime,
  loadPluginApp,
  mountPluginContentScripts,
  renderSlot
};
