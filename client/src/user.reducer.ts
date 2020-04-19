import { User, Message, UpdateUser, UserConnected } from "wally-contract";

const initialState: User = {
    id: '',
    colour: '',
    useNightMode: true,
    name: ''
};

export function userReducer(
    state: User = initialState,
    action: Message
) {
    if (action.type === UserConnected.name) {
        const userConnected = action as UserConnected;
        return userConnected.user;
    } else if (action.type === UpdateUser.name) {
        const updateUser = action as UpdateUser;
        if (state && updateUser.userId === state.id) {
            return { ...state, ...updateUser.user };
        }
    }
    return state;
}