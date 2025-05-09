class WebSocketClient {
    constructor(url = "ws://127.0.0.1:3001", reconnectInterval = 5000) {
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
            console.log('WebSocket connection closed. Reconnecting in', this.reconnectInterval / 1000, 'seconds');
            setTimeout(() => this.connect(), this.reconnectInterval);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
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

    sendMessage(message) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            console.warn('WebSocket is not open. Cannot send message:', message);
        }
    }
}

export default WebSocketClient;