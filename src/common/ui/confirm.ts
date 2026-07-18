import { ref } from "vue";

export type ConfirmOptions = {
  message: string;
  header?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  accept?: () => void;
  reject?: () => void;
};

/**
 * Module-level store: `useConfirm().require(...)` queues a confirmation,
 * the single <ConfirmDialog /> mounted in App.vue renders it.
 */
export const pendingConfirm = ref<ConfirmOptions | null>(null);

export function useConfirm(): { require: (options: ConfirmOptions) => void } {
  return {
    require(options: ConfirmOptions) {
      pendingConfirm.value = options;
    },
  };
}
