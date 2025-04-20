import { EventType, WsEvent } from "@proto/ws";

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private eventHandlers: Map<EventType, ((data: Uint8Array) => void)[]> =
    new Map();
  private oneTimeHandlers: Map<EventType, ((data: Uint8Array) => void)[]> =
    new Map();
  private pingInterval: number | null = null;
  private readonly PING_INTERVAL = 10000; // 10 seconds
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;

  constructor(url: string) {
    this.url = url;
    this.connect(url);
  }

  on(event: EventType, handler: (data: Uint8Array) => void) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  once(event: EventType, handler: (data: Uint8Array) => void) {
    const handlers = this.oneTimeHandlers.get(event) || [];
    handlers.push(handler);
    this.oneTimeHandlers.set(event, handlers);
  }

  emit(event: EventType, data: Uint8Array) {
    if (!this.ws) return;

    const message = WsEvent.create({
      event: event,
      data: data,
    });

    const encoded = WsEvent.encode(message).finish();
    this.ws.send(encoded);
  }

  close() {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private connect(url: string) {
    console.log("Connecting to WebSocket:", url);
    this.ws = new WebSocket(url);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.setupPing();
      this.emit(EventType.CONNECT, new Uint8Array());
    };

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        const data = new Uint8Array(event.data);
        try {
          const message = WsEvent.decode(data);
          //console.log('Received event:', EventType[message.event]);

          // Handle pong
          if (message.event === EventType.PONG) {
            //console.debug('Received pong');
            return;
          }

          const handlers = this.eventHandlers.get(message.event) || [];
          handlers.forEach((handler) => handler(message.data));

          const oneTimeHandlers = this.oneTimeHandlers.get(message.event) || [];
          oneTimeHandlers.forEach((handler) => handler(message.data));
          this.oneTimeHandlers.delete(message.event);
        } catch (e) {
          console.error("Failed to decode message:", e);
        }
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.cleanup();
    };

    this.ws.onclose = () => {
      console.log("WebSocket closed");
      this.cleanup();
      this.attemptReconnect();
    };
  }

  private setupPing() {
    this.cleanup();
    this.pingInterval = window.setInterval(() => {
      console.log("Sending ping??", this.ws?.readyState);
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.debug("Sending ping");
        this.emit(EventType.PING, new Uint8Array());
      }
    }, this.PING_INTERVAL);
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    console.log(
      `Attempting to reconnect in ${this.reconnectDelay / 1000} seconds...`,
    );

    setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay,
      );
      this.connect(this.url);
    }, this.reconnectDelay);
  }
}
