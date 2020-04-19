import { Middleware } from "redux";
import { webSocket } from "rxjs/webSocket";
import { v4 as uuidv4 } from 'uuid';

import { Message } from "wally-contract";
import { tap, retryWhen, delay } from "rxjs/operators";

export class SendWrapper implements Message {
    type = "Send";
    constructor(public message: Message) { }
}

export class Connect implements Message {
    type = "Connect";
}

export const webSocketMiddleware: () => Middleware = () => {

    const getClientId = () => {
        let clientId = window.localStorage.getItem("clientId");
        if (!clientId) {
            clientId = uuidv4();
            window.localStorage.setItem("clientId", clientId);
        }
        return clientId;
    };

    const getWebSocketBaseAddress = () => {
        if (process.env.REACT_APP_WS_URL) {
            // local development, environment variables are set at build time so can't overwrite in production
            return process.env.REACT_APP_WS_URL;
        }
        return (window.location.protocol.toLowerCase() === "https" ? "wss" : "ws") + "://" + window.location.host + "/ws";
    };

    const getWebSocketAddress = () => {
        return `${getWebSocketBaseAddress()}?clientId=${getClientId()}`;
    }

    const socket = webSocket<Message>(getWebSocketAddress());

    return store => next => (action: Message) => {
        switch (action.type) {
            case "Connect":
                socket
                    .pipe(
                        tap(m => console.log("Received", m)),
                        retryWhen(errors => {
                            return errors
                                .pipe(
                                    tap(error => {
                                        console.error("Error talking to backend", error);
                                        // this.connected$.next(false)
                                    }),
                                    delay(1000)
                                )
                        })
                    )
                    .subscribe(m => store.dispatch(m));
                break;

            case "Send":
                const send = action as SendWrapper;
                console.log("Sending", send.message);
                socket.next(send.message);
                break;

            default:
                return next(action);
        }
    }
}