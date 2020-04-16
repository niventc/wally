import { Middleware } from "redux";
import { webSocket } from "rxjs/webSocket";

import { Message } from "wally-contract";
import { tap } from "rxjs/operators";

export class SendWrapper implements Message {
    type = "Send";
    constructor(public message: Message) { }
}

export class Connect implements Message {
    type = "Connect";
}

export const webSocketMiddleware: () => Middleware = () => {
    console.log("middlewarey!");

    const socket = webSocket<Message>(process.env.REACT_APP_WS_URL);

    return store => next => (action: Message) => {
        console.log("middleware", action);
        switch (action.type) {
            case "Connect":
                socket.pipe(tap(m => console.log("Received", m))).subscribe(m => store.dispatch(m));
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