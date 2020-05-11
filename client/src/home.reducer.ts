import { Message, WallState, DeleteWall } from "wally-contract";

export interface HomeReducerState {
    recentWalls: Array<string>;
    isSideBarOpen: boolean;
}

const initialState: HomeReducerState = {
    recentWalls: [],
    isSideBarOpen: false
};

export class ToggleSideBar { // implements Message {   

    constructor(public type = "ToggleSideBar") {}
}

export function homeReducer(
    state: HomeReducerState = initialState,
    action: Message
): HomeReducerState {
    switch (action.type) {
        case WallState.name:
            const wallState = action as WallState;
            return { ...state, recentWalls: [wallState.name, ...state.recentWalls.filter(w => w !== wallState.name)] };

        case DeleteWall.name:
            const deleteWall = action as DeleteWall;
            return { ...state, recentWalls: state.recentWalls.filter(w => w !== deleteWall.name) };

        case ToggleSideBar.name:
            return { ...state, isSideBarOpen: !state.isSideBarOpen };
    }

    return state;
} 