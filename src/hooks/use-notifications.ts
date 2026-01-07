import { useState, useEffect, useCallback } from "react";

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, [isSupported]);

  const sendNotification = useCallback(
    ({ title, body, icon, tag }: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return null;

      const notification = new Notification(title, {
        body,
        icon: icon || "/favicon.ico",
        tag,
        requireInteraction: true,
      });

      return notification;
    },
    [isSupported, permission]
  );

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
  };
}
