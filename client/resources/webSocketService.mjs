class WebSocketClient {
    constructor(url = "ws://127.0.0.1:8080", reconnectInterval = 5000) {
        this.url = url;
        this.reconnectInterval = reconnectInterval; // ms
        this.messageHandlers = [];
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onmessage = (event) => {
            const message = event.data;
            console.log('Received:', message);
            this.handleMessage(message);
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

    handleMessage(message) {
        this.messageHandlers.forEach(handler => handler(message));
    }

    addMessageHandler(handler) {
        this.messageHandlers.push(handler);
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