/* App-themed confirm dialog. The host (src/components/confirm-dialog.tsx)
   registers a handler at the app root; callers stay decoupled from React. */

export interface ConfirmOpts {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type Handler = (opts: ConfirmOpts, onConfirm: () => void) => void;

let handler: Handler | null = null;

export function registerConfirm(h: Handler | null) {
  handler = h;
}

/** Show the themed confirm. If no host is mounted, run the action directly. */
export function confirm(opts: ConfirmOpts, onConfirm: () => void) {
  if (handler) handler(opts, onConfirm);
  else onConfirm();
}

/** Destructive confirm used across the app (delete routine, etc.). */
export function confirmDestructive(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  confirm({ title, message, confirmLabel, destructive: true }, onConfirm);
}
