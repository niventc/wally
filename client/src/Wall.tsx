import React, { Component, Dispatch, createRef, PointerEvent } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Card, Button } from "react-bootstrap";

import './wall.css';

import { NewNote, Message, Note, UpdateNoteText, MoveNote, SelectNote, User, WallState, DeleteNote, NewLine, UpdateLine, Line, DeleteLine } from "wally-contract";
import { connect } from "react-redux";
import { fromEvent, merge } from "rxjs";
import { startWith, throttleTime, map, tap } from "rxjs/operators";
import { SendWrapper } from "./webSocket.middleware";

interface WallProps {
    wall: WallState;
}

interface WallComponentState {
    colours: Array<string>;
    selectedNoteId: string | undefined;
    selectedLineId: string | undefined;
    inLineMode: boolean;
    inPencilMode: boolean;
    inEraseMode: boolean;
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
        deleteLine: (wallId: string, lineId: string) => dispatch(new SendWrapper(new DeleteLine(wallId, lineId)))
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
        selectedNoteId: undefined,
        selectedLineId: undefined,
        inLineMode: false,
        inPencilMode: false,
        inEraseMode: false
    };
    
    public wallRef = createRef<HTMLDivElement>();


    public componentDidMount(): void {
        if (this.wallRef.current) {
            const pointerdown = fromEvent<PointerEvent>(this.wallRef.current, "pointerdown");
            const pointerup = fromEvent<PointerEvent>(this.wallRef.current, "pointerup");
            pointerdown.subscribe(e => {
                if (this.wallRef.current && (this.state.inPencilMode || this.state.inLineMode)) {
                    const pointerDown = e as PointerEvent;                
                    const bounding = this.wallRef.current.getBoundingClientRect();
                    const line = new Line(uuidv4(), [[pointerDown.clientX - bounding.left, pointerDown.clientY - bounding.top]], "red", 3);
                    this.setState({
                        ...this.state,
                        selectedLineId: line._id
                    });
                    this.props.newLine(this.props.wall.name, line);
                }
            });
            pointerup.subscribe(e => {
                this.setState({
                    ...this.state,
                    selectedLineId: undefined
                });
            });

            const mousemove = fromEvent<PointerEvent>(this.wallRef.current, "pointermove").pipe(startWith(undefined));
            const touchmove = fromEvent<TouchEvent>(this.wallRef.current, "touchmove").pipe(startWith(undefined));
      
            merge(mousemove, touchmove)
                .pipe(
                    throttleTime(50),
                    map(e => {
                        if (e) {
                            if (e.type === "pointermove") {
                                const mousemove = e as PointerEvent;
                                return [mousemove.clientX, mousemove.clientY] as [number, number];
                            } else if (e.type === "touchmove") {
                                const touchmove = e as TouchEvent;
                                return [touchmove.touches[0].clientX, touchmove.touches[0].clientY] as [number, number];
                            }
                        }
                    }),
                    tap(() => this.forceUpdate())
                )
                .subscribe(e => {
                    if (this.wallRef.current) {
                        const bounding = this.wallRef.current.getBoundingClientRect();
                        if (e && this.state.selectedNoteId) {
                            this.props.moveNote(this.props.wall.name, this.state.selectedNoteId, e[0] - bounding.left, e[1] - bounding.top);
                        } else if (e && this.state.selectedLineId) {
                            this.props.updateLine(this.props.wall.name, this.state.selectedLineId, [[e[0] - bounding.left, e[1] - bounding.top]], this.state.inLineMode);
                        }
                    }
                });
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

    public unselect(): void {
        this.setState({...this.state, selectedNoteId: undefined});
    }

    public getSvgFromLine(line: Array<[number, number]>): string {
        if (!line || !line[0]) {
            return '';
        }
        const first = line[0];
        const m = `M ${first[0]} ${first[1]}`;
        const l = line.slice(1, line.length).map(p => `L ${p[0]} ${p[1]}`);
        const svg = `${m} ${l.join(' ')}`;
        return svg;
    }

    public deleteLine(lineId: string): void {
        if (this.state.inEraseMode) {
            this.props.deleteLine(this.props.wall.name, lineId);
        }
    }

    public render(): JSX.Element {
        return (
            <div ref={this.wallRef} 
                 style={{position: 'relative', width: '100%', height: '100%', touchAction: 'none'}}
                 onTouchEnd={() => this.unselect()} onPointerUp={() => this.unselect()}>
                {
                    this.props.wall.notes.map(note => 
                        <Card key={note._id} style={{ width: '150px', fontSize: '0.9em', boxShadow: this.getBorder(note._id), height: '150px', position: 'absolute', top: note.y, left: note.x, background: note.colour, zIndex: note.zIndex }} 
                            onPointerDown={(e: React.PointerEvent) => this.startMove(note._id,e)}>
                            <Card.Body>
                                <textarea value={note.text} 
                                          onPointerDown={(e: React.PointerEvent) => this.select(note._id,e)}
                                          onChange={(e: React.FormEvent<HTMLTextAreaElement>) => this.props.updateNoteText(this.props.wall.name, note._id, e.currentTarget.value)} 
                                          style={{ background: 'transparent', height: '100%', width: '100%', border: 'none', outline: 'none', resize: 'none' }}>
                                </textarea>

                                { 
                                    this.isNoteSelectedByUser(note._id) ?
                                    <span className="hover-icon" title="Delete note" onClick={() => this.props.deleteNote(this.props.wall.name, note._id)}>
                                        <svg className="bi bi-trash" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                                            <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" clipRule="evenodd"/>
                                        </svg>
                                    </span>
                                    : undefined 
                                }
                            </Card.Body>
                        </Card>
                    )
                }
              
                <svg style={{width: '100%', height: '100%'}}>
                    {
                        this.props.wall.lines.map(l => 
                            <path key={l._id} onClick={() => this.deleteLine(l._id)} d={this.getSvgFromLine(l.points)} stroke={l.colour} strokeWidth={l.width} fill="none" />
                        )
                    }
                    {/* {
                        this.state.line ?
                        <path id="lineAB" d={this.getSvgFromLine(this.state.line)} stroke="red" strokeWidth="3" fill="none" />
                        : undefined
                    } */}
                </svg>

                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'row' }}>
                    {
                        this.props.wall.users.map(u => 
                            <div key={u.id} style={{ backgroundColor: u.colour, margin: '6px', textAlign: 'center', lineHeight: '32px', fontWeight: 'bold', width: '32px', height: '32px', borderRadius: '32px'}}>
                                {u.name?.substr(0, 1).toUpperCase()}
                            </div>
                        )
                    }
                </div>
                
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '-108px', display: 'flex', flexDirection: 'column', height: '750px', margin: 'auto' }}>
                    <Button variant={this.props.user.useNightMode ? 'dark' : 'light'} style={{textAlign: 'right'}} title="Toggle pencil mode" active={this.state.inPencilMode} onClick={() => this.setState({ ...this.state, inPencilMode: !this.state.inPencilMode, inEraseMode: false, inLineMode: false })}>
                        <svg className="bi bi-pencil" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M11.293 1.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-9 9a1 1 0 01-.39.242l-3 1a1 1 0 01-1.266-1.265l1-3a1 1 0 01.242-.391l9-9zM12 2l2 2-9 9-3 1 1-3 9-9z" clipRule="evenodd"/>
                            <path fillRule="evenodd" d="M12.146 6.354l-2.5-2.5.708-.708 2.5 2.5-.707.708zM3 10v.5a.5.5 0 00.5.5H4v.5a.5.5 0 00.5.5H5v.5a.5.5 0 00.5.5H6v-1.5a.5.5 0 00-.5-.5H5v-.5a.5.5 0 00-.5-.5H3z" clipRule="evenodd"/>
                        </svg>
                    </Button>
                    <Button variant={this.props.user.useNightMode ? 'dark' : 'light'} style={{textAlign: 'right'}} title="Toggle line mode" active={this.state.inLineMode} onClick={() => this.setState({ ...this.state, inLineMode: !this.state.inLineMode, inEraseMode: false, inPencilMode: false })}>
                        <svg className="bi bi-dash" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" style={{transformBox: 'fill-box', transformOrigin: 'center', transform: 'rotate(-45deg)'}} d="M3.5 8a.5.5 0 01.5-.5h8a.5.5 0 010 1H4a.5.5 0 01-.5-.5z" clipRule="evenodd"/>
                        </svg>
                    </Button>
                    <Button variant={this.props.user.useNightMode ? 'dark' : 'light'} style={{textAlign: 'right'}} title="Toggle erase mode" active={this.state.inEraseMode} onClick={() => this.setState({ ...this.state, inPencilMode: false, inEraseMode: !this.state.inEraseMode, inLineMode: false })}>
                        <svg className="bi bi-pencil" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" style={{transformBox: 'fill-box', transformOrigin: 'center', transform: 'rotate(180deg)'}} d="M11.293 1.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-9 9a1 1 0 01-.39.242l-3 1a1 1 0 01-1.266-1.265l1-3a1 1 0 01.242-.391l9-9zM12 2l2 2-9 9-3 1 1-3 9-9z" clipRule="evenodd"/>
                            <path fillRule="evenodd" d="M12.146 6.354l-2.5-2.5.708-.708 2.5 2.5-.707.708zM3 10v.5a.5.5 0 00.5.5H4v.5a.5.5 0 00.5.5H5v.5a.5.5 0 00.5.5H6v-1.5a.5.5 0 00-.5-.5H5v-.5a.5.5 0 00-.5-.5H3z" clipRule="evenodd"/>
                        </svg>
                    </Button>
                    {
                        this.state.colours.map(c => 
                            <Card key={c} 
                                  style={{ width: '150px', height: '150px', background: c }} 
                                  onPointerDown={(e: React.PointerEvent) => this.cloneNote(e, c)}>
                            </Card>                
                        )
                    }            
                </div>
            </div>
        );
    }
}
)
