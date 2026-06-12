// Tiny pub/sub toast store. Call toast.success/warning/error from any client
// component; <Toaster /> (mounted in the root layout) renders them.

export type ToastType = "success" | "warning" | "error";
export type ToastItem = { id: number; type: ToastType; message: string; leaving?: boolean };

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<(items: ToastItem[]) => void>();

function emit() {
  for (const l of listeners) l(items);
}

function add(type: ToastType, message: string) {
  const id = ++seq;
  items = [...items, { id, type, message }];
  emit();
  setTimeout(() => dismiss(id), 4000);
  return id;
}

export function dismiss(id: number) {
  items = items.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  emit();
  setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 220);
}

export function subscribe(fn: (items: ToastItem[]) => void) {
  listeners.add(fn);
  fn(items);
  return () => {
    listeners.delete(fn);
  };
}

export const toast = {
  success: (message: string) => add("success", message),
  warning: (message: string) => add("warning", message),
  error: (message: string) => add("error", message),
};
