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

// src/internal/rpc-query-host.ts
import { useCallback as useCallback2, useEffect as useEffect2, useMemo as useMemo2 } from "react";
import { useIsFetching } from "@tanstack/react-query";

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
export {
  createRpcQueryHooks
};
