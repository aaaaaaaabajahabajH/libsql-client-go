/**
 * Barrel export for the hooks/ directory.
 * Import from "@/hooks" throughout the app.
 */

export { useClipboard } from "./use-clipboard";
export { useDebounce } from "./use-debounce";
export { useMobile } from "./use-mobile";
export { dismissToast, toast, useToast } from "./use-toast";
export type { Toast, ToastVariant } from "./use-toast";
