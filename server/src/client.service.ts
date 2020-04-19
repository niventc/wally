
export declare class WebSocketClient extends WebSocket {
    identity: WebSocketIdentity;
}

export class WebSocketIdentity {
    constructor(
        public uuid: string,
        public clientId: string
    ) {}
}

export class ClientService {

    private clientInstanceMap = new Map<string, Array<string>>();
    private instances = new Map<string, WebSocketClient>();

    public addClient(ws: WebSocketClient): void {
        if (!this.clientInstanceMap.has(ws.identity.clientId)) {
            this.clientInstanceMap.set(ws.identity.clientId, [ws.identity.uuid]);
        } else {
            this.clientInstanceMap.get(ws.identity.clientId).push(ws.identity.uuid);
        }
        this.instances.set(ws.identity.uuid, ws);
    }

    public removeClient(ws: WebSocketClient): void {
        if (this.clientInstanceMap.has(ws.identity.clientId)) {
            const clientList = this.clientInstanceMap.get(ws.identity.clientId).filter(x => x !== ws.identity.uuid);
            this.clientInstanceMap.set(ws.identity.clientId, clientList);
        }
        this.instances.delete(ws.identity.uuid);
    }

    public getInstance(uuid: string): WebSocketClient | undefined {
        return this.instances.get(uuid);
    }

    public getInstances(uuids: Array<string>): Array<WebSocketClient> {
        return uuids.map(x => this.instances.get(x)).filter(x => x);
    }
}
