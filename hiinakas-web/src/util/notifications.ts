const VAPID_PUBLIC_KEY = "BIKn_TwIU9IWFEHCLERc91obtWZNM5lZxkzlf6ICHsm4lcM4oceA7VmlINuYay8wJepC6NluqnlbcVnWGf4OoIs";

export class NotificationManager {
  isEnabled: boolean = false;
  subscription: PushSubscription = null!;

  async initialize(): Promise<void> {
    return new Promise<void>((resolve) => {
      Notification.requestPermission().then(async (result) => {
        if (result === "granted") {
          await this.setupServiceWorker();
          resolve();
        }
      });
    });
  }

  private async setupServiceWorker() {
    await navigator.serviceWorker.register("./serviceWorker.js");
    const register = await navigator.serviceWorker.ready;
    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    this.setSubscription(subscription);
    this.setEnabled(true);
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  setEnabled(value: boolean) {
    this.isEnabled = value;
  }

  setSubscription(newSub: PushSubscription) {
    this.subscription = newSub;
  }
} 