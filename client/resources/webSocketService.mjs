import { getGameId } from '/resources/gameContext.mjs';

function defaultWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiPort = window.location.port;
    const wsPort = apiPort === '8000' || apiPort === '' ? '8080' : apiPort;
    const gameId = getGameId();
    const query = gameId ? `?gameId=${encodeURIComponent(gameId)}` : '';
    return `${protocol}//${window.location.hostname}:${wsPort}${query}`;
}

class WebSocketClient {
    constructor(url = defaultWebSocketUrl(), reconnectInterval = 5000) {
        this.url = url;
        this.reconnectInterval = reconnectInterval;
        this.eventHandlers = {};
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onmessage = (event) => {
            let parsed;
            try {
                parsed = JSON.parse(event.data);
            } catch {
                console.warn('Received non-JSON message:', event.data);
                return;
            }
            if (parsed && parsed.event) {
                this.handleEvent(parsed.event, parsed.data);
            }
        };

        this.ws.onclose = () => {
            setTimeout(() => this.connect(), this.reconnectInterval);
        };

        this.ws.onerror = () => {
            this.ws.close();
        };
    }

    handleEvent(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => handler(data));
        }
    }

    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    sendEvent(event, data) {
        this.sendMessage(JSON.stringify({ event, data }));
    }

    sendMessage(message) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        }
    }
}

export default WebSocketClient;
