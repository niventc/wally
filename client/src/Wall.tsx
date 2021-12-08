import React, { Component, Dispatch, createRef, PointerEvent } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Card, Button, Form } from "react-bootstrap";

import './wall.css';

import { NewNote, Message, Note, UpdateNoteText, MoveNote, SelectNote, User, WallState, DeleteNote, NewLine, UpdateLine, Line, DeleteLine, Image as ImageCard, NewImage, DeleteImage, UpdateImage } from "wally-contract";
import { connect } from "react-redux";
import { fromEvent, merge } from "rxjs";
import { startWith, map, tap, pairwise, filter, bufferTime } from "rxjs/operators";
import { SendWrapper } from "./webSocket.middleware";
import { SketchPicker } from "react-color";
import { UserCoin } from "./UserCoin";
import { Undo } from "./undo.middleware";

import Linkify from 'react-linkify';
import { getContrastColour, getServerBaseUrl } from "./utils";

interface WallProps {
    wall: WallState;
}

interface PointerMove {
    clientX: number;
    clientY: number;
    moveX: number;
    moveY: number;
    shiftKey: boolean;
}

interface WallComponentState {
    colours: Array<string>;
    startingPoint: [number, number] | undefined;
    selectedNoteId: string | undefined;
    selectedLineId: string | undefined;
    selectedImageId: string | undefined;
    inEraseMode: boolean;
    selectedMode: "pen" | "line" | "rectangle" | undefined;
    isErasing: boolean;
    showColourPicker: boolean;
    colour: string;
    lineWidth: number;
    wallOrigin: [number, number];
}

interface StateProps {
    user: User;
}

interface ConnectedProps {
    newNote: (wallId: string, note: Note) => void;
    selectNote: (wallId: string, noteId: string, user: User) => void;
    updateNoteText: (wallId: string, noteId: string, text: string) => void;
    moveNote: (wallId: string, noteId: string, x: number, y: number) => void;
    deleteNote: (wallId: string, noteId: string) => void;
    newLine: (wallId: string, line: Line) => void;
    updateLine: (wallId: string, lineId: string, points: Array<[number, number]>, replace: boolean) => void;
    deleteLine: (wallId: string, lineId: string) => void;
    newImage: (wallId: string, image: ImageCard, data: string) => void;
    moveImage: (wallId: string, imageId: string, x: number, y: number) => void;
    deleteImage: (wallId: string, imageId: string) => void;
    undo: () => void;
}

export default connect<StateProps, ConnectedProps>(
    (state: any) => ({ user: state.user }),
    (dispatch: Dispatch<Message>) => ({
        newNote: (wallId: string, note: Note) => dispatch(new SendWrapper(new NewNote(wallId, note))),
        selectNote: (wallId: string, noteId: string, user: User) => dispatch(new SendWrapper(new SelectNote(wallId, noteId, user))),
        updateNoteText: (wallId: string, noteId: string, text: string) => dispatch(new SendWrapper(new UpdateNoteText(wallId, noteId, text))),
        moveNote: (wallId: string, noteId: string, x: number, y: number) => dispatch(new SendWrapper(new MoveNote(wallId, noteId, x, y))),
        deleteNote: (wallId: string, noteId: string) => dispatch(new SendWrapper(new DeleteNote(wallId, noteId))),
        newLine: (wallId: string, line: Line) => dispatch(new SendWrapper(new NewLine(wallId, line))),
        updateLine: (wallId: string, lineId: string, points: Array<[number, number]>, replace: boolean) => dispatch(new SendWrapper(new UpdateLine(wallId, lineId, points, replace))),
        deleteLine: (wallId: string, lineId: string) => dispatch(new SendWrapper(new DeleteLine(wallId, lineId))),
        newImage: (wallId: string, image: ImageCard, data: string) => dispatch(new SendWrapper(new NewImage(wallId, image, data))),        
        moveImage: (wallId: string, imageId: string, x: number, y: number) => dispatch(new SendWrapper(new UpdateImage(wallId, imageId, { x: x, y: y }))),
        deleteImage: (wallId: string, imageId: string) => dispatch(new SendWrapper(new DeleteImage(wallId, imageId))),
        undo: () => dispatch({...new Undo()})
    })
)(
class Wall extends Component<WallProps & StateProps & ConnectedProps> {

    public state: WallComponentState = {
        colours: [
            'yellow',
            'orange',
            'lime',
            'dodgerblue',
            'deeppink'
        ],
        startingPoint: undefined,
        selectedNoteId: undefined,
        selectedLineId: undefined,
        selectedImageId: undefined,
        inEraseMode: false,
        selectedMode: undefined,
        isErasing: false,
        showColourPicker: false,
        colour: 'rgb(255,0,0)',
        lineWidth: 3,
        wallOrigin: [0, 0]
    };
    
    public wallRef = createRef<HTMLDivElement>();

    public componentDidMount(): void {
        if (this.wallRef.current) {
            const keyPress = fromEvent<KeyboardEvent>(document, "keydown");
            keyPress.subscribe(e => {
                if (e.key === "z" && e.ctrlKey && e.altKey) {
                    this.props.undo();
                }
            });

            const paste = fromEvent<ClipboardEvent>(window, "paste");
            paste.subscribe(e => {
                const items = e.clipboardData?.items
                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        console.log(item.type, item.kind);
                        if (item.kind === "file") {
                            const file = item.getAsFile();
                            if (file) {
                                this.handleFile(file, 50, 50);
                            }
                        }
                    }
                }
            })

            const pointerdown = fromEvent<PointerEvent>(this.wallRef.current, "pointerdown");            
            pointerdown.subscribe(e => {
                if (this.state.selectedMode) {
                    // This should never happen so dummy obj to avoid null check
                    const bounding = this.wallRef?.current?.getBoundingClientRect() ?? new DOMRect();
                    const pointerDown = e as PointerEvent;
                    const startingPoint: [number, number] = [
                        pointerDown.clientX - bounding.left - this.state.wallOrigin[0], 
                        pointerDown.clientY - bounding.top - this.state.wallOrigin[1]
                    ];
                    const line = new Line(uuidv4(), [startingPoint], this.state.colour, this.state.lineWidth);
                    this.setState({
                        ...this.state,
                        startingPoint: startingPoint,
                        selectedLineId: line._id
                    });
                    this.props.newLine(this.props.wall.name, line);
                } else if (this.state.inEraseMode) {
                    this.setState({
                        ...this.state,
                        isErasing: true
                    });
                } else {
                    // fallback to move mode :O
                    const pointerDown = e as PointerEvent;
                    this.setState({
                        ...this.state,
                        startingPoint: [pointerDown.clientX, pointerDown.clientY]
                    });
                }
            });

            // We want to stop doing things when our mouse leaves the browser
            const mouseoutOfBrowser = fromEvent<PointerEvent>(document, "mouseout")
                .pipe(
                    filter(e => {
                        const target: any = e.relatedTarget;
                        return target?.nodeName === "HTML";
                    })
                );
            // For now pressing escape should also stop things, we might want to refine this to cancel things instead
            // e.g. delete the inprogress line/shape being drawn, or if nothing is happening unselect the current tool
            const escapeKey = keyPress.pipe(filter(e => e.key === "Escape"));

            const pointerup = fromEvent<PointerEvent>(this.wallRef.current, "pointerup");
            const touchend = fromEvent<PointerEvent>(this.wallRef.current, "touchend");
            merge(pointerup, touchend, mouseoutOfBrowser, escapeKey)
                .subscribe(() => {
                    this.setState({
                        ...this.state, 
                        selectedNoteId: undefined, 
                        selectedImageId: undefined,                            
                        startingPoint: undefined,
                        selectedLineId: undefined,
                        isErasing: false
                    });
                });


            let handlerFunction = (e: any) => {
                e.preventDefault();
                e.stopPropagation();
            }
            let dropHandler = (e: DragEvent) => {
                e.preventDefault();
                e.stopPropagation();

                let dt = e.dataTransfer;
                let files = dt?.files;

                if (files) {
                    Array.from(files).forEach(file => {
                        this.handleFile(file, e.clientX, e.clientY);
                    });
                }
            }
            let dropArea = document.getElementById('wall');
            dropArea?.addEventListener('dragenter', handlerFunction, false)
            dropArea?.addEventListener('dragleave', handlerFunction, false)
            dropArea?.addEventListener('dragover', handlerFunction, false)
            dropArea?.addEventListener('drop', dropHandler, false)

            // const onDrop = fromEvent<DragEvent>(this.wallRef.current, "drop");
            // onDrop.subscribe(e => {
            //     e.preventDefault();
            //     e.stopPropagation();
            //     console.log(e);
            // });

            const mousemove = fromEvent<PointerEvent>(this.wallRef.current, "pointermove")
                .pipe(
                    map(e => {
                        return { clientX: e.clientX, clientY: e.clientY, moveX: e.movementX, moveY: e.movementY, shiftKey: e.shiftKey } as PointerMove;
                    })
                );
            const touchmove = fromEvent<TouchEvent>(this.wallRef.current, "touchmove")
                .pipe(
                    startWith(undefined),
                    pairwise(),
                    map(val => {
                        if (val[0] && val[1]) {
                            return { clientX: val[1].touches[0].clientX, clientY: val[1].touches[0].clientY, moveX: val[1].touches[0].clientX - val[0].touches[0].clientX, moveY: val[1].touches[0].clientY - val[0].touches[0].clientY, shiftKey: val[1].shiftKey } as PointerMove;
                        }
                        if (this.state.startingPoint && val[1]) {
                            return { clientX: val[1].touches[0].clientX, clientY: val[1].touches[0].clientY, moveX: val[1].touches[0].clientX - this.state.startingPoint[0], moveY: val[1].touches[0].clientY - this.state.startingPoint[1], shiftKey: val[1].shiftKey } as PointerMove;
                        }
                        return { clientX: val[1]?.touches[0].clientX, clientY: val[1]?.touches[0].clientY, moveX: 0, moveY: 0, shiftKey: val[1]?.shiftKey } as PointerMove;
                    })
                );
      
            merge(mousemove, touchmove)
                .pipe(
                    bufferTime(50),
                    filter(moves => moves.length > 0),
                    map(moves => {
                        // This should never happen so dummy obj to avoid null check
                        const bounding = this.wallRef?.current?.getBoundingClientRect() ?? new DOMRect();
                        // Remember to provide initial value otherwise single element in array is returned and not mapped
                        return moves
                            .reduce((acc, val) => {
                                return { 
                                    clientX: val.clientX - bounding.left - this.state.wallOrigin[0], 
                                    clientY: val.clientY - bounding.top - this.state.wallOrigin[1], 
                                    moveX: acc.moveX + val.moveX, 
                                    moveY: acc.moveY + val.moveY, 
                                    shiftKey: val.shiftKey 
                                } as PointerMove;
                            }, { 
                                clientX: moves[0].clientX - bounding.left - this.state.wallOrigin[0], 
                                clientY: moves[0].clientY - bounding.top - this.state.wallOrigin[1], 
                                moveX: moves[0].moveX, 
                                moveY: moves[0].moveY, 
                                shiftKey: moves[0].shiftKey 
                            } as PointerMove);
                    }),
                    map(mousemove => {
                        if ((this.state.selectedMode === "line" || this.state.selectedMode === "rectangle") && this.state.startingPoint && mousemove.shiftKey) {
                            if (Math.abs(this.state.startingPoint[0] - mousemove.clientX) < 50) {
                                // Straight vertical line, x doesn't change, y does
                                return { 
                                    clientX: this.state.startingPoint[0], 
                                    clientY: mousemove.clientY, 
                                    moveX: 0, 
                                    moveY: mousemove.moveY, 
                                    shiftKey: mousemove.shiftKey 
                                } as PointerMove;
                            } else if (Math.abs(this.state.startingPoint[1] - mousemove.clientY) < 50) {
                                // Straight horizontal line, x changes, y doesn't
                                return { 
                                    clientX: mousemove.clientX, 
                                    clientY: this.state.startingPoint[1], 
                                    moveX: mousemove.moveX, 
                                    moveY: 0, 
                                    shiftKey: mousemove.shiftKey 
                                } as PointerMove;
                            } else {                                        
                                let xDiff = mousemove.clientX - this.state.startingPoint[0];
                                let yDiff = mousemove.clientY - this.state.startingPoint[1];

                                let opposite = 0;
                                let adjacent = 0;
                                if (xDiff > yDiff) {
                                    adjacent = xDiff;
                                    opposite = yDiff;
                                } else {
                                    adjacent = yDiff;
                                    opposite = xDiff;
                                }
                                let ratio = opposite / adjacent;
                                let angle = Math.atan(ratio) * (180/Math.PI);

                                if (Math.abs(Math.abs(angle) - 45) < 10) {
                                    let radians = 45 * (Math.PI/180);
                                    let tan = Math.tan(radians);
                                    let snapOpposite = tan * adjacent;

                                    if ((xDiff > 0 && yDiff > 0) || (xDiff < 0 && yDiff < 0)) {
                                        // top left and bottom right
                                        return { clientX: this.state.startingPoint[0] + snapOpposite, clientY: mousemove.clientY, moveX: snapOpposite, moveY: mousemove.moveY, shiftKey: mousemove.shiftKey } as PointerMove;
                                    } else if (xDiff > 0 && yDiff < 0) { 
                                        // top right
                                        return { clientX: mousemove.clientX, clientY: this.state.startingPoint[1] - snapOpposite, moveX: mousemove.moveX, moveY: 1 - snapOpposite , shiftKey: mousemove.shiftKey } as PointerMove;
                                    } else if (xDiff < 0 && yDiff > 0) { 
                                        // bottom left
                                        return { clientX: this.state.startingPoint[0] - snapOpposite, clientY: mousemove.clientY, moveX: 1 - snapOpposite, moveY: mousemove.moveY, shiftKey: mousemove.shiftKey } as PointerMove;
                                    }
                                }
                            }
                        }
                        return mousemove;
                    }),
                    tap(() => this.forceUpdate())
                )
                .subscribe(e => {
                    if (e && this.state.selectedNoteId) {
                        this.props.moveNote(
                            this.props.wall.name, 
                            this.state.selectedNoteId, 
                            e.clientX, 
                            e.clientY
                        );
                    } else if (e && this.state.selectedImageId) {
                        this.props.moveImage(
                            this.props.wall.name, 
                            this.state.selectedImageId, 
                            e.clientX, 
                            e.clientY
                        );
                    } else if (e && this.state.selectedLineId) {
                        if (this.state.selectedMode === "rectangle" && this.state.startingPoint) {
                            const x = e.clientX;
                            const y = e.clientY;
                            const startX = this.state.startingPoint[0];
                            const startY = this.state.startingPoint[1];

                            const topRight = [x, startY] as [number, number];
                            const bottomRight = [x, y] as [number, number];
                            const bottomLeft = [startX, y] as [number, number];
                            const topLeft = [startX, startY] as [number, number];
                            this.props.updateLine(
                                this.props.wall.name, 
                                this.state.selectedLineId, 
                                [
                                    topRight, 
                                    bottomRight, 
                                    bottomLeft, 
                                    topLeft
                                ], 
                                true
                            );
                        } else {
                            this.props.updateLine(
                                this.props.wall.name, 
                                this.state.selectedLineId, 
                                [[e.clientX, e.clientY]], 
                                this.state.selectedMode === "line"
                            );
                        }
                    } else if (e && this.state.startingPoint) {
                        // default move the wall!
                        this.setState({
                            ...this.state,
                            wallOrigin: [this.state.wallOrigin[0] + e.moveX, this.state.wallOrigin[1] + e.moveY]
                        });
                    }
                });
        }
    }

    public handleFile(file: File, x: number, y: number): void {        
        console.log(file);

        if (file.type.startsWith("image/")) {
            let reader = new FileReader()
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                // This should never happen so dummy obj to avoid null check
                const bounding = this.wallRef?.current?.getBoundingClientRect() ?? new DOMRect();

                const result = reader.result;
                if (result && typeof result === "string") {

                    const img = new Image();
                    img.onload = () => {
                        this.props.newImage(
                            this.props.wall.name, 
                            {
                                _id: uuidv4(),
                                name: file.name,
                                x: x - bounding.left,
                                y: y - bounding.top,
                                zIndex: 0,
                                originalWidth: img.width,
                                originalHeight: img.height,
                                width: img.width,
                                height: img.height
                            },                                                
                            result
                        );
                    };
                    img.src = result;
                }
            };
        }
    }

    public cloneNote(event: React.PointerEvent, colour: string): void {
        const target = (event.target as HTMLElement);
        const card = target.closest(".card");
        const rect = card ? card.getBoundingClientRect() : target.getBoundingClientRect();
    
        const note = {
          _id: uuidv4(),
          zIndex: 1,
          x: rect.left,
          y: rect.top,
          colour: colour,
          text: ''
        };
    
        this.props.newNote(this.props.wall.name, note);

        // Pre select the note we're going to create
        this.setState({...this.state, selectedNoteId: note._id});
    }

    public isNoteSelectedByUser(noteId: string): boolean {
        const userIds = Object.entries(this.props.wall.selectedNotes).filter(x => x[1] === noteId).map(x => x[0]);
        return userIds.includes(this.props.user.id);
    }

    public getBorder(noteId: string): string {
        const userIds = Object.entries(this.props.wall.selectedNotes).filter(x => x[1] === noteId);
        const users = userIds.map(u => this.props.wall.users.find(x => x.id === u[0])).filter(x => x).map(x => x as User);

        let borders = [];
        for (let i = 0; i < users.length; i++) {
            borders.push(`0 0 0 ${(i+1) * 4}px ${users[i].colour}`)
        }
        return borders.join(',');
    }

    public select(noteId: string, e: React.PointerEvent) {
        this.props.selectNote(this.props.wall.name, noteId, this.props.user);        
        e.stopPropagation();
    }

    public startMove(noteId: string, e: React.MouseEvent | React.TouchEvent): void {
        this.props.selectNote(this.props.wall.name, noteId, this.props.user); 
        this.setState({...this.state, selectedNoteId: noteId});

        e.stopPropagation();
        e.preventDefault();
    }
    
    public startMoveImage(imageId: string, e: React.MouseEvent | React.TouchEvent): void {
        e.preventDefault();

        if (this.state.selectedMode || this.state.inEraseMode) {
            // We're in tool mode ignore it
            return;
        }
        // this.props.selectNote(this.props.wall.name, noteId, this.props.user); 
        this.setState({...this.state, selectedImageId: imageId});

        e.stopPropagation();
    }

    public getSvgFromLine(line: Array<[number, number]>): string {
        if (!line || !line[0]) {
            return '';
        }
        const first = line[0];
        const m = `M ${this.getWallX(first[0])} ${this.getWallY(first[1])}`;
        const l = line.slice(1, line.length).map(p => `L ${this.getWallX(p[0])} ${this.getWallY(p[1])}`);
        const svg = `${m} ${l.join(' ')}`;
        return svg;
    }

    public deleteLine(lineId: string): void {
        if (this.state.inEraseMode && this.state.isErasing) {
            this.props.deleteLine(this.props.wall.name, lineId);
        }
    }

    public handleRangeChange(e: React.FormEvent<HTMLInputElement>): void {
        this.setState({
            ...this.state,
            lineWidth: (e.target as HTMLInputElement).value
        });
    }

    public deleteNote(e: React.MouseEvent, noteId: string): void {
        e.stopPropagation();
        e.preventDefault();
        this.props.deleteNote(this.props.wall.name, noteId);
    }

    public deleteImage(e: React.MouseEvent, imageId: string): void {
        e.stopPropagation();
        e.preventDefault();
        this.props.deleteImage(this.props.wall.name, imageId);
    }

    public updateAndStop(e: React.PointerEvent, newState: any): void {
        e.stopPropagation();
        e.preventDefault();
        this.setState({...this.state, ...newState});
    }

    public getSvgSize(): [number, number] {
        let maxX = 0;
        let maxY = 0;
        this.props.wall.lines.forEach(l => {
            l.points.forEach(p => {
                if (p[0] > maxX) {
                    maxX = p[0];
                }
                if (p[1] > maxY) {
                    maxY = p[1];
                }
            });
        });
        return [this.getWallX(maxX), this.getWallY(maxY)];
    }

    public getCanvasSize(): [number, number] {
        let maxX = 0;
        let maxY = 0;
        this.props.wall.notes.forEach(n => {
            if (n.x > maxX) {
                maxX = n.x + 150;
            }
            if (n.y > maxY) {
                maxY = n.y + 150;
            }
        });

        this.props.wall.images.forEach(i => {
            if (i.x > maxX) {
                maxX = i.x + i.width;
            }
            if (i.y > maxY) {
                maxY = i.y + i.height;
            }
        });

        const svg = this.getSvgSize();
        if (svg[0] > maxX) {
            maxX = svg[0];
        }
        if (svg[1] > maxY) {
            maxY = svg[1];
        }

        return [this.getWallX(maxX), this.getWallY(maxY)];
    }

    public updateNoteText(e: React.FormEvent<HTMLTextAreaElement>, noteId: string) {
        const newValue = e.currentTarget.value;
        if (newValue.length <= 280) {
            this.props.updateNoteText(this.props.wall.name, noteId, e.currentTarget.value);
        } else {
            console.log("too long!!");
        }
    }

    public getFontSize(text: string): number {
        const testArea = document.getElementById("testarea") as HTMLTextAreaElement;
        const defaultFontSize = 15;

        if (!testArea)  {
            return defaultFontSize;
        }

        let newFontSize = defaultFontSize;

        // Set to default
        testArea.value = text;
        testArea.style.fontSize = defaultFontSize + "px";
        while (testArea.scrollHeight > testArea.clientHeight) {
            newFontSize--;
            testArea.style.fontSize = newFontSize + "px";
        }

        return newFontSize;
    }

    public handleLinkClick(e: React.PointerEvent): void {
        e.stopPropagation();
        e.preventDefault();
    }

    public getWallX(x: number): number {
        return x + this.state.wallOrigin[0];
    }

    public getWallY(y: number): number {
        return y + this.state.wallOrigin[1];
    }

    public render(): JSX.Element {
        let canvasSize = this.getCanvasSize();
        let svgSize = this.getSvgSize();
        return (
            <div style={{width: canvasSize[0], height: canvasSize[1]}}>

                <textarea id="testarea" style={{ position: 'fixed', left: -150, visibility: 'hidden', overflow: 'hidden', height: '124px', width: '124px', border: 'none', outline: 'none', resize: 'none' }}></textarea>

                <div ref={this.wallRef} 
                    id="wall"
                    style={{position: 'relative', width: '100%', height: '100%', touchAction: 'none'}}>

                    {
                        this.props.wall.images.map(i => 
                            <div key={i._id} style={{position: 'absolute', top: this.getWallY(i.y), left: this.getWallX(i.x)}} onPointerDown={(e: React.PointerEvent) => this.startMoveImage(i._id,e)}>
                                <img src={getServerBaseUrl() + "api/data/" + i._id} alt={i.name}  />
                                <span className="hover-icon bottom-right" title="Delete image" onPointerDown={(e) => this.deleteImage(e, i._id)}>
                                    <svg className="bi bi-trash" width="1em" height="0.8em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                                        <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" clipRule="evenodd"/>
                                    </svg>
                                </span>
                            </div>
                        )
                    }

                    {
                        this.props.wall.notes.map(note => 
                            <Card key={note._id} 
                                style={{ width: '150px', boxShadow: this.getBorder(note._id), height: '150px', position: 'absolute', top: this.getWallY(note.y), left: this.getWallX(note.x), background: note.colour, zIndex: note.zIndex }} 
                                onPointerDown={(e: React.PointerEvent) => this.startMove(note._id,e)}>
                                <Card.Body style={{ padding: '12px' }}>
                                    { 
                                        this.isNoteSelectedByUser(note._id) ?
                                        <>
                                            <textarea value={note.text} 
                                                    onPointerDown={(e: React.PointerEvent) => this.select(note._id,e)}
                                                    onChange={(e: React.FormEvent<HTMLTextAreaElement>) => this.updateNoteText(e, note._id)} 
                                                    style={{ overflow: 'hidden', background: 'transparent', color: getContrastColour(note.colour), fontSize: this.getFontSize(note.text), height: '100%', width: '100%', border: 'none', outline: 'none', resize: 'none' }}>
                                            </textarea>
                                            <span className="hover-icon bottom-right" title="Delete note" onPointerDown={(e) => this.deleteNote(e, note._id)}>
                                                <svg className="bi bi-trash" width="1em" height="0.8em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                                                    <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" clipRule="evenodd"/>
                                                </svg>
                                            </span>
                                        </>
                                        :
                                        <div style={{padding: 2, color: getContrastColour(note.colour), fontSize: this.getFontSize(note.text)}}>
                                            <Linkify componentDecorator={(decoratedHref, decoratedText, key) => (
                                                    <a target="blank" style={{ textDecoration: 'underline', color: getContrastColour(note.colour)}} href={decoratedHref} key={key} onPointerDown={(e) => this.handleLinkClick(e)}>
                                                        {decoratedText}
                                                    </a>
                                                )}>
                                                {note.text}
                                            </Linkify>
                                        </div>
                                    }
                                    {
                                        note.text.length > 230 ?
                                        <span style={{fontSize: 8, color: 'rgba(0,0,0,0.5)', bottom: 3, left: 3, position: 'absolute'}}>{note.text.length}/280</span>
                                        : undefined
                                    }
                                </Card.Body>
                            </Card>
                        )
                    }
                
                    <svg style={{ position: 'absolute', pointerEvents: this.state.inEraseMode ? 'all' : 'none', width: svgSize[0] + 'px', height: svgSize[1] + 'px'}}>
                        {
                            this.props.wall.lines
                                .filter(l => l && l.points && l.points.length > 1)
                                .map(l => 
                                    <path key={l._id} onMouseOver={() => this.deleteLine(l._id)} d={this.getSvgFromLine(l.points)} stroke={l.colour} strokeWidth={l.width} fill="none" />
                                )
                        }
                    </svg>                    
                </div>

                <div style={{ zIndex: 90, position: 'fixed', top: '12px', right: '12px', display: 'flex', flexDirection: 'row' }}>
                    {this.props.wall.users.map(u => <UserCoin key={u.id} user={u} />)}
                </div>

                <div style={{ zIndex: 90, position: 'fixed', top: 0, bottom: 0, left: '-48px', display: 'flex', flexDirection: 'column', height: '607px', margin: 'auto' }}>
                    <Button variant={this.props.user.useNightMode ? 'dark' : 'light'} style={{textAlign: 'right', height: '38px'}} title="Choose colour and line width" active={this.state.showColourPicker} onPointerDown={(e: React.PointerEvent) => this.updateAndStop(e, {showColourPicker: true})}>
                        <div style={{backgroundColor: this.state.colour, width: this.state.lineWidth + 'px', height: this.state.lineWidth + 'px', borderRadius: this.state.lineWidth + 'px', float: 'right', margin: (16 - this.state.lineWidth) + 'px ' + (12 - this.state.lineWidth) + 'px'}}>&nbsp;</div>
                    </Button>
                    {
                        this.state.showColourPicker ? 
                        <div style={{position: 'absolute', left: '150px', zIndex: 200}}>
                            <div style={{position: 'fixed', top: 0, bottom: 0, left: 0, right: 0}} onPointerDown={(e: React.PointerEvent) => this.updateAndStop(e, {showColourPicker: false})}></div>
                            <div style={{position: 'relative', background: this.props.user.useNightMode ? '#282c34' : 'white', border: '1px solid rgba(0,0,0,.125)'}}>
                                <Form.Control type="range" custom min="2" max="8" defaultValue={this.state.lineWidth} style={{padding: '14px 3px'}} onInput={(e: React.FormEvent<HTMLInputElement>) => this.handleRangeChange(e)}/>
                                <SketchPicker color={this.state.colour} onChange={(colour) => this.setState({...this.state, colour: colour.hex })} />
                            </div>
                        </div> 
                        : null
                    }
                    <Button variant={this.props.user.useNightMode ? 'dark' : 'light'} style={{textAlign: 'right'}} title="Toggle pencil mode" active={this.state.selectedMode === "pen"} onPointerDown={(e: React.PointerEvent) => this.updateAndStop(e, {selectedMode: this.state.selectedMode === "pen" ? undefined : "pen", inEraseMode: false })}>
                        <svg className="bi bi-pencil" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M11.293 1.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-9 9a1 1 0 01-.39.242l-3 1a1 1 0 01-1.266-1.265l1-3a1 1 0 01.242-.391l9-9zM12 2l2 2-9 9-3 1 1-3 9-9z" clipRule="evenodd"/>
                            <path fillRule="evenodd" d="M12.146 6.354l-2.5-2.5.708-.708 2.5 2.5-.707.708zM3 10v.5a.5.5 0 00.5.5H4v.5a.5.5 0 00.5.5H5v.5a.5.5 0 00.5.5H6v-1.5a.5.5 0 00-.5-.5H5v-.5a.5.5 0 00-.5-.5H3z" clipRule="evenodd"/>
                        </svg>
                    </Button>
                    <Button variant={this.props.user.useNightMode ? 'dark' : 'light'} style={{textAlign: 'right'}} title="Toggle line mode (hold shift to snap)" active={this.state.selectedMode === "line"} onPointerDown={(e: React.PointerEvent) => this.updateAndStop(e, { selectedMode: this.state.selectedMode === "line" ? undefined : "line", inEraseMode: false })}>
                        <svg className="bi bi-dash" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" style={{transformBox: 'fill-box', transformOrigin: 'center', transform: 'rotate(-45deg)'}} d="M3.5 8a.5.5 0 01.5-.5h8a.5.5 0 010 1H4a.5.5 0 01-.5-.5z" clipRule="evenodd"/>
                        </svg>
                    </Button>
                    <Button variant={this.props.user.useNightMode ? 'dark' : 'light'} style={{textAlign: 'right'}} title="Toggle rectangle mode (hold shift to snap)" active={this.state.selectedMode === "rectangle"} onPointerDown={(e: React.PointerEvent) => this.updateAndStop(e, { selectedMode: this.state.selectedMode === "rectangle" ? undefined : "rectangle", inEraseMode: false })}>
                        <svg className="bi bi-square" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M14 1H2a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1zM2 0a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V2a2 2 0 00-2-2H2z" clipRule="evenodd"/>
                        </svg>
                    </Button>
                    <Button variant={this.props.user.useNightMode ? 'dark' : 'light'} style={{textAlign: 'right'}} title="Toggle erase mode" active={this.state.inEraseMode} onPointerDown={(e: React.PointerEvent) => this.updateAndStop(e, { inEraseMode: !this.state.inEraseMode, selectedMode: undefined })}>
                        <svg className="bi bi-pencil" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" style={{transformBox: 'fill-box', transformOrigin: 'center', transform: 'rotate(180deg)'}} d="M11.293 1.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-9 9a1 1 0 01-.39.242l-3 1a1 1 0 01-1.266-1.265l1-3a1 1 0 01.242-.391l9-9zM12 2l2 2-9 9-3 1 1-3 9-9z" clipRule="evenodd"/>
                            <path fillRule="evenodd" d="M12.146 6.354l-2.5-2.5.708-.708 2.5 2.5-.707.708zM3 10v.5a.5.5 0 00.5.5H4v.5a.5.5 0 00.5.5H5v.5a.5.5 0 00.5.5H6v-1.5a.5.5 0 00-.5-.5H5v-.5a.5.5 0 00-.5-.5H3z" clipRule="evenodd"/>
                        </svg>
                    </Button>
                    {
                        this.state.colours.map(c => 
                            <Card key={c} 
                                style={{ width: '150px', height: '75px', background: c }} 
                                onPointerDown={(e: React.PointerEvent) => this.cloneNote(e, c)}>
                            </Card>                
                        ) 
                    }
                    <Card style={{ marginTop: '5px', width: '150px', height: '75px', background: this.props.user.colour }} 
                          title="Change your user colour from the sidebar"
                          onPointerDown={(e: React.PointerEvent) => this.cloneNote(e, this.props.user.colour)}>
                    </Card>
                    <Button variant={this.props.user.useNightMode ? 'dark' : 'light'} style={{ marginTop: 5, textAlign: 'right'}} title="Undo delete note (Ctrl + Alt + Z)" onPointerDown={(e: React.PointerEvent) => this.props.undo()}>
                        <svg className="bi bi-arrow-counterclockwise" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M12.83 6.706a5 5 0 0 0-7.103-3.16.5.5 0 1 1-.454-.892A6 6 0 1 1 2.545 5.5a.5.5 0 1 1 .91.417 5 5 0 1 0 9.375.789z"/>
                            <path fillRule="evenodd" d="M7.854.146a.5.5 0 0 0-.708 0l-2.5 2.5a.5.5 0 0 0 0 .708l2.5 2.5a.5.5 0 1 0 .708-.708L5.707 3 7.854.854a.5.5 0 0 0 0-.708z"/>
                        </svg>
                    </Button>
                </div>
            </div>
        );
    }
}
)
