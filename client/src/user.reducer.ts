import { v4 as uuidv4 } from 'uuid';

import { User, Message, UpdateUser } from "wally-contract";

const initialUser = new User(
    uuidv4(),
    `rgb(${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)})`,
    "",
    true
);

export function userReducer(
    state: User = initialUser,
    action: Message
) {
    // TODO on startup, grab id from local storage
    if (action.type === UpdateUser.name) {
        const updateUser = action as UpdateUser;
        if (updateUser.userId === state._id) {
            return { ...state, ...updateUser.user };
        }
    }
    return state;
}