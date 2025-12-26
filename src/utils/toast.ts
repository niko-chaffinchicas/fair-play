/**
 * Toast notification utility
 * Dispatches events to show toast notifications
 */

export function showToastNotification(
  message: string,
  type: "success" | "error" = "error"
): void {
  const event = new CustomEvent("show-toast", {
    detail: { message, type },
  });
  window.dispatchEvent(event);
}

