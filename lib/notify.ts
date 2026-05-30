// Browser Notification API wrapper

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function sendNotification(title: string, body: string, tag?: string) {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      tag: tag || "pulse-alert",
      icon: "/favicon.ico",
      requireInteraction: true,
    });
  } catch {
    // Silently fail if notification not supported
  }
}
