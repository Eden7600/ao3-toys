import { createValueStore } from "@src/common/value-store";
import { describe, expect, it, vi } from "vitest";

describe("createValueStore", () => {
  it("round-trips get/set", () => {
    const store = createValueStore(1);

    expect(store.get()).toBe(1);

    store.set(2);

    expect(store.get()).toBe(2);
  });

  it("notifies every subscriber with the new value", () => {
    const store = createValueStore("a");
    const first = vi.fn();
    const second = vi.fn();

    store.subscribe(first);
    store.subscribe(second);
    store.set("b");

    expect(first).toHaveBeenCalledExactlyOnceWith("b");
    expect(second).toHaveBeenCalledExactlyOnceWith("b");
  });

  it("stops notifying after unsubscribe", () => {
    const store = createValueStore(0);
    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.set(1);

    expect(listener).not.toHaveBeenCalled();
    expect(store.get()).toBe(1);
  });

  it("keeps other subscribers when one unsubscribes", () => {
    const store = createValueStore(0);
    const removed = vi.fn();
    const kept = vi.fn();

    const unsubscribe = store.subscribe(removed);
    store.subscribe(kept);
    unsubscribe();
    store.set(5);

    expect(removed).not.toHaveBeenCalled();
    expect(kept).toHaveBeenCalledExactlyOnceWith(5);
  });
});
