export type ValueStore<T> = {
  get: () => T;
  /** Updates the value and notifies every subscriber. */
  set: (value: T) => void;
  /** Returns an unsubscribe function. */
  subscribe: (listener: (value: T) => void) => () => void;
};

/**
 * Minimal observable value for state that must be visible across separate
 * render roots (e.g. the top and bottom work toolbars). Not for state a
 * single component tree owns — use component state there.
 */
export function createValueStore<T>(initial: T): ValueStore<T> {
  let value = initial;
  const listeners = new Set<(value: T) => void>();

  return {
    get: () => value,
    set(next: T) {
      value = next;
      listeners.forEach((listener) => {
        listener(next);
      });
    },
    subscribe(listener: (value: T) => void) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
