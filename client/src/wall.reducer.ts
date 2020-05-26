import { Message, WallyError, WallState, NewNote, MoveNote, UpdateNoteText, UserJoinedWall, SelectNote, DeleteNote, NewLine, UpdateLine, DeleteLine, DeleteWall, UpdateUser, UserLeftWall, NewImage, DeleteImage, UpdateImage } from "wally-contract";

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
            case DeleteWall.name:
                const deleteWall = action as DeleteWall;
                if (state.wall.name === deleteWall.name) {
                    return initialState;
                }
                return state;

            case NewNote.name:
                const newNote = action as NewNote;
                if (state.wall.name !== newNote.wallName) {
                    return state;
                }
                return { ...state, wall: {...state.wall, notes: [...state.wall.notes, newNote.note]} };

            case NewImage.name:
                const newImage = action as NewImage;
                if (state.wall.name !== newImage.wallName) {
                    return state;
                }
                return { ...state, wall: {...state.wall, images: [...state.wall.images, newImage.image]} };
                
            case NewLine.name:
                const newLine = action as NewLine;
                if (state.wall.name !== newLine.wallName) {
                    return state;
                }
                return { ...state, wall: {...state.wall, lines: [...state.wall.lines, newLine.line]} };

            case DeleteNote.name:
                const deleteNote = action as DeleteNote;
                if (state.wall.name !== deleteNote.wallName) {
                    return state;
                }
                return {
                    ...state,
                    wall: {
                        ...state.wall,
                        notes: [
                            ...state.wall.notes.filter(n => n._id !== deleteNote.noteId)
                        ]
                    }
                };

            case DeleteImage.name:
                const deleteImage = action as DeleteImage;
                if (state.wall.name !== deleteImage.wallName) {
                    return state;
                }
                return {
                    ...state,
                    wall: {
                        ...state.wall,
                        images: [
                            ...state.wall.images.filter(i => i._id !== deleteImage.imageId)
                        ]
                    }
                };

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

            case UpdateImage.name:
                const updateImage = action as UpdateImage;
                if (state.wall.name !== updateImage.wallName) {
                    return state;
                }
                const moveImage = state.wall.images.find(c => c._id === updateImage.imageId);
                const movedImage = Object.assign({}, moveImage, updateImage.image);
                return {
                    ...state,
                    wall: {
                        ...state.wall,
                        images: [...state.wall.images.filter(x => x._id !== updateImage.imageId), movedImage]
                    }
                };

            case UpdateLine.name:
                const updateLine = action as UpdateLine;
                if (state.wall.name !== updateLine.wallName) {
                    return state;
                }
                const line = state.wall.lines.find(c => c._id === updateLine.lineId);
                if (line) {
                    if (updateLine.replace) {                        
                        line.points = [line.points[0], ...updateLine.points];
                    } else {
                        line.points = [...line.points, ...updateLine.points];
                    }
                }
                // TODO this is a bit cheeky, should really recreate and replace line, right?
                return { ...state };

            case DeleteLine.name:
                const deleteLine = action as DeleteLine;
                if (state.wall.name !== deleteLine.wallName) {
                    return state;
                }
                return {
                    ...state,
                    wall: {
                        ...state.wall,
                        lines: [
                            ...state.wall.lines.filter(n => n._id !== deleteLine.lineId)
                        ]
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

            case SelectNote.name:
                const selectNote = action as SelectNote;
                const selectedNotes = {...state.wall.selectedNotes};
                selectedNotes[selectNote.byUser.id] = selectNote.noteId;

                return {
                    ...state,
                    wall: {
                        ...state.wall,
                        selectedNotes: selectedNotes
                    }
                };

            case UpdateUser.name:
                const updateUser = action as UpdateUser;
                const existingUser = state.wall?.users.find(x => x.id === updateUser.userId);
                if (existingUser) {
                    return {
                        ...state,
                        wall: {
                            ...state.wall,
                            users: [...state.wall.users.filter(x => x.id !== updateUser.userId), {...existingUser, ...updateUser.user}]
                        }
                    };
                }
                return state;

            case UserLeftWall.name:
                const userLeftWall = action as UserLeftWall;
                if (state.wall?.name === userLeftWall.wallName) {
                    return {
                        ...state,
                        wall: {
                            ...state.wall,
                            users: [...state.wall.users.filter(x => x.id !== userLeftWall.userId)]
                        }
                    };
                }
                return state;
                
        }
    }

    return state;
}