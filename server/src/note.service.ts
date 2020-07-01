import { WebsocketRequestHandler } from "express-ws";
import { Message, NewNote, MoveNote, UpdateNoteText, SelectNote, CreateWall, JoinWall, WallState, WallyError, UpdateUser, User, UserJoinedWall, DeleteNote, NewLine, UpdateLine, DeleteLine, Line, DeleteWall, NewImage, UpdateImage, DeleteImage } from "wally-contract";

import { NoteStore } from './store/note.store';
import { WallStore } from './store/wall.store';
import { UserStore } from './store/user.store';
import { WebSocketClient, ClientService } from './client.service';
import { LineStore } from './store/line.store';
import { ImageStore } from './store/image.store';
import { DataStore } from './store/data.store';

export class NoteService {

    constructor(
        private clientService: ClientService,
        private userStore: UserStore,
        private wallStore: WallStore,
        private noteStore: NoteStore,
        private lineStore: LineStore,
        private imageStore: ImageStore,
        private dataStore: DataStore
    ) {}

    public onWebSocket: WebsocketRequestHandler = (ws, req, next): void => {
        const wsc = <WebSocketClient><unknown>ws;
        ws.on('message', async (data: string) => {
            // console.log("Received", data);
            const message = JSON.parse(data) as Message;
            
            switch (message.type) {
                case UpdateUser.name:
                    const updateUser = message as UpdateUser;
                    this.userStore.updateUser(updateUser.userId, updateUser.user);
                    ws.send(JSON.stringify(message));

                    const wallIds = await this.wallStore.getUserWallIds(wsc.identity.clientId);
                    wallIds.forEach(wallId => {
                        this.sendToWallUsers(wallId, updateUser, wsc.identity.uuid);
                    });
                    break;

                case CreateWall.name:
                    const createWall = message as CreateWall;
                    if (await this.wallStore.doesWallExist(createWall.name)) {
                        const createError = `Wall with name '${createWall.name}' already exists`;
                        console.error(createError);
                        ws.send(JSON.stringify(new WallyError(createError)))
                    } else {
                        const wall = await this.wallStore.createWall(createWall.name);

                        const clients = await this.wallStore.addClient(createWall.name, wsc.identity); 
                        const users = await this.userStore.getClientsUsers(clients.map(c => c.clientId));

                        ws.send(JSON.stringify(new WallState(wall.name, [], [], users, [], {})));
                    }
                    break;

                case DeleteWall.name:
                    const deleteWall = message as DeleteWall;
                    if (await this.wallStore.doesWallExist(deleteWall.name)) {
                        const wall = await this.wallStore.getWall(deleteWall.name);

                        wall.lines.forEach(l => this.lineStore.deleteItem(l));
                        wall.notes.forEach(n => this.noteStore.deleteItem(n));

                        await this.wallStore.deleteWall(deleteWall.name);

                        const clients = await this.wallStore.getClients(deleteWall.name); 
                        clients.forEach(async c => {
                            await this.wallStore.removeClient(c);
                            ws.send(JSON.stringify(deleteWall));
                        });
                    }
                    break;

                case JoinWall.name:
                    const joinWall = message as JoinWall;
                    const joinedWall = await this.wallStore.getWall(joinWall.name);
                    if (joinedWall === null) {
                        const joinError = `Wall with name '${joinWall.name}' does not exist`;
                        console.error(joinError);
                        ws.send(JSON.stringify(new WallyError(joinError)))
                    } else {
                        // If we're already joined then stop here
                        if (this.wallStore.doesWallHaveClient(joinWall.name, wsc.identity)) {
                            break;
                        }

                        const clients = await this.wallStore.addClient(joinWall.name, wsc.identity);       

                        const lines = await this.lineStore.getItems(joinedWall.lines);
                        const notes = await this.noteStore.getItems(joinedWall.notes);
                        const images = await this.imageStore.getItems(joinedWall.images);
                        const users = await this.userStore.getClientsUsers(clients.map(c => c.clientId));
                        const selected = {};
                        users.forEach(u => {
                            const noteId = this.noteStore.getUserSelectedNote(u.id);
                            if (noteId) {
                                selected[u.id] = noteId;
                            }
                        });

                        ws.send(JSON.stringify(new WallState(joinedWall.name, lines, notes, users,images, selected)));

                        const otherUsers = clients.filter(c => c.uuid !== wsc.identity.uuid).map(c => c.uuid);
                        const otherInstances = this.clientService.getInstances(otherUsers);
                        const currentUser = await this.userStore.getClientUser(wsc.identity.clientId);
                        const userJoined = JSON.stringify(new UserJoinedWall(joinWall.name, currentUser));
                        otherInstances.forEach(x => x.send(userJoined));
                    }
                    break;

                case NewImage.name:
                    const newImage = message as NewImage;
                    this.dataStore.addItem({_id: newImage.image._id, data: newImage.data});
                    this.imageStore.addItem(newImage.image);
                    this.wallStore.addImage(newImage.wallName, newImage.image._id);
                    this.sendToWallUsers(newImage.wallName, newImage, wsc.identity.uuid);
                    break;

                case UpdateImage.name:
                    const updateImage = message as UpdateImage;
                    this.imageStore.updateItem(updateImage.imageId, updateImage.image);
                    this.sendToWallUsers(updateImage.wallName, updateImage, wsc.identity.uuid);                  
                    break;

                case DeleteImage.name:
                    const deleteImage = message as DeleteImage;
                    this.dataStore.deleteItem(deleteImage.imageId);
                    this.wallStore.removeImage(deleteImage.wallName, deleteImage.imageId);
                    this.imageStore.deleteItem(deleteImage.imageId);
                    this.sendToWallUsers(deleteImage.wallName, deleteImage);
                    break;

                case NewNote.name:
                    const newNote = message as NewNote;
                    this.noteStore.addItem(newNote.note);
                    this.wallStore.addNote(newNote.wallName, newNote.note._id);
                    this.sendToWallUsers(newNote.wallName, newNote, wsc.identity.uuid);
                    break;

                case MoveNote.name:
                    const moveNote = message as MoveNote;
                    this.noteStore.updateItem(moveNote.noteId, { x: moveNote.x, y: moveNote.y });
                    this.sendToWallUsers(moveNote.wallName, moveNote, wsc.identity.uuid);                  
                    break;

                case UpdateNoteText.name:
                    const updateNoteText = message as UpdateNoteText;
                    this.noteStore.updateItem(updateNoteText.noteId, { text: updateNoteText.text });
                    this.sendToWallUsers(updateNoteText.wallName, updateNoteText, wsc.identity.uuid);
                    break;

                case SelectNote.name:
                    const selectNote = message as SelectNote;
                    this.noteStore.selectNote(selectNote.noteId, selectNote.byUser.id);
                    this.sendToWallUsers(selectNote.wallName, selectNote);
                    break;

                case DeleteNote.name:
                    const deleteNote = message as DeleteNote;
                    this.wallStore.removeNote(deleteNote.wallName, deleteNote.noteId);
                    this.noteStore.deleteItem(deleteNote.noteId);
                    this.sendToWallUsers(deleteNote.wallName, deleteNote);
                    break;

                case NewLine.name:
                    const newLine = message as NewLine;
                    this.lineStore.addItem(newLine.line);
                    this.wallStore.addLine(newLine.wallName, newLine.line._id);
                    this.sendToWallUsers(newLine.wallName, newLine);
                    break;

                case UpdateLine.name:
                    const updateLine = message as UpdateLine;
                    if (updateLine.replace) {
                        this.lineStore.replacePoints(updateLine.lineId, updateLine.points);
                    } else {
                        this.lineStore.addPointsToLine(updateLine.lineId, updateLine.points);
                    }
                    this.sendToWallUsers(updateLine.wallName, updateLine, wsc.identity.uuid);
                    break;

                case DeleteLine.name:
                    const deleteLine = message as DeleteLine;
                    this.lineStore.deleteItem(deleteLine.lineId);
                    this.wallStore.removeLine(deleteLine.wallName, deleteLine.lineId);
                    this.sendToWallUsers(deleteLine.wallName, deleteLine);
                    break;

            }
        });
    }

    private async sendToWallUsers(wallName: string, message: Message, skipUuId?: string): Promise<void> {
        const clients = await this.wallStore.getClients(wallName);
        const filteredClients = clients.filter(c => c.uuid !== skipUuId);
        const instances = this.clientService.getInstances(filteredClients.map(x => x.uuid));
        const json = JSON.stringify(message);
        instances
            .forEach(i => {
                if (i) { 
                    i.send(json);
                }
            });
    }

}
