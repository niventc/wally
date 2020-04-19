import { Message, WallyError, WallState, NewNote, MoveNote, UpdateNoteText, UserJoinedWall } from "wally-contract";

export interface WallReducerState {
    wall?: WallState | undefined;
    error?: string | undefined;
}

const initialState = {
    wall: undefined,
    error: undefined
};

export function wallReducer(
    state: WallReducerState = initialState,
    action: Message
): WallReducerState {
    switch (action.type) {
        case WallyError.name:
            const error = action as WallyError;
            console.log("Error", error);
            return { error: error.message };

        case WallState.name:
            const wallState = action as WallState;
            return { wall: wallState };
    }

    if (state.wall) {
        switch (action.type) {
            case NewNote.name:
                const newNote = action as NewNote;
                if (state.wall.name !== newNote.wallName) {
                    return state;
                }
                return { ...state, wall: {...state.wall, notes: [...state.wall.notes, newNote.note] } };

            case MoveNote.name:
                const moveNote = action as MoveNote;
                if (state.wall.name !== moveNote.wallName) {
                    return state;
                }
                const moveCard = state.wall.notes.find(c => c._id === moveNote.noteId);
                const movedCard = Object.assign({}, moveCard, { x: moveNote.x, y: moveNote.y });
                return {
                    ...state,
                    wall: {
                        ...state.wall,
                        notes: [...state.wall.notes.filter(x => x._id !== moveNote.noteId), movedCard]
                    }
                };

            case UpdateNoteText.name:
                const updateNoteText = action as UpdateNoteText;
                if (state.wall.name !== updateNoteText.wallName) {
                    return state;
                }
                const updateNote = state.wall.notes.find(n => n._id === updateNoteText.noteId);
                const updatedNote = Object.assign({}, updateNote, { text: updateNoteText.text });
                return {
                    ...state,
                    wall: {
                        ...state.wall,
                        notes: [...state.wall.notes.filter(n => n._id !== updateNoteText.noteId), updatedNote]
                    }
                };

            case UserJoinedWall.name:
                const userJoinedWall = action as UserJoinedWall;
                return {
                    ...state,
                    wall: {
                        ...state.wall,
                        users: [...state.wall.users.filter(x => x.id !== userJoinedWall.user.id), userJoinedWall.user]
                    }
                };
        }
    }

    return state;
}