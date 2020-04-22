import React, { Component, Dispatch, createRef, PointerEvent } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Card } from "react-bootstrap";

import './wall.css';

import { NewNote, Message, Note, UpdateNoteText, MoveNote, SelectNote, User, WallState, DeleteNote } from "wally-contract";
import { connect } from "react-redux";
import { fromEvent, merge } from "rxjs";
import { startWith, throttleTime, map } from "rxjs/operators";
import { SendWrapper } from "./webSocket.middleware";

interface WallProps {
    wall: WallState;
}

interface WallComponentState {
    colours: Array<string>;
    selectedNoteId: string | undefined;
    lines: Array<Array<[number, number]>>;
    line: Array<[number, number]> | undefined;
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
}

export default connect<StateProps, ConnectedProps>(
    (state: any) => ({ user: state.user }),
    (dispatch: Dispatch<Message>) => ({
        newNote: (wallId: string, note: Note) => dispatch(new SendWrapper(new NewNote(wallId, note))),
        selectNote: (wallId: string, noteId: string, user: User) => dispatch(new SendWrapper(new SelectNote(wallId, noteId, user))),
        updateNoteText: (wallId: string, noteId: string, text: string) => dispatch(new SendWrapper(new UpdateNoteText(wallId, noteId, text))),
        moveNote: (wallId: string, noteId: string, x: number, y: number) => dispatch(new SendWrapper(new MoveNote(wallId, noteId, x, y))),
        deleteNote: (wallId: string, noteId: string) => dispatch(new SendWrapper(new DeleteNote(wallId, noteId)))
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
        lines: new Array<any>(),
        line: undefined
    };
    
    public wallRef = createRef<HTMLDivElement>();


    public componentDidMount(): void {
        if (this.wallRef.current) {
            const pointerdown = fromEvent<PointerEvent>(this.wallRef.current, "pointerdown").pipe(startWith(undefined));
            const pointerup = fromEvent<PointerEvent>(this.wallRef.current, "pointerup").pipe(startWith(undefined));
            pointerdown.subscribe(e => {
                const line = new Array<any>();
                this.setState({
                    ...this.state,
                    line: line
                });
            });
            pointerup.subscribe(e => {
                this.setState({
                    ...this.state,
                    lines: [...this.state.lines, this.state.line],
                    line: undefined
                });
            });

            const mousemove = fromEvent<PointerEvent>(this.wallRef.current, "pointermove").pipe(startWith(undefined));
            const touchmove = fromEvent<TouchEvent>(this.wallRef.current, "touchmove").pipe(startWith(undefined));
      
            merge(mousemove, touchmove)
                .pipe(
                    throttleTime(10),
                    map(e => {
                        if (e) {
                            if (e.type === "pointermove") {
                                const mousemove = e as PointerEvent;
                                return [mousemove.clientX, mousemove.clientY];
                            } else if (e.type === "touchmove") {
                                const touchmove = e as TouchEvent;
                                return [touchmove.touches[0].clientX, touchmove.touches[0].clientY];
                            }
                        }
                    })
                )
                .subscribe(e => {
                    if (this.wallRef.current) {
                        const bounding = this.wallRef.current.getBoundingClientRect();
                        if (e && this.state.selectedNoteId) {
                            this.props.moveNote(this.props.wall.name, this.state.selectedNoteId, e[0] - bounding.left, e[1] - bounding.top);
                        } else if (e && this.state.line) {
                            this.setState({
                                ...this.state,
                                line: [...this.state.line, [e[0] - bounding.left, e[1] - bounding.top]]
                            });
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

    public render(): JSX.Element {
        return (
            <div ref={this.wallRef} 
                 style={{position: 'relative', width: '100%', height: '100%', touchAction: 'none'}}
                 onTouchEnd={() => this.unselect()} onPointerUp={() => this.unselect()}>
                {
                    this.props.wall.notes.map(note => 
                        <Card key={note._id} style={{ width: '200px', boxShadow: this.getBorder(note._id), height: '200px', position: 'absolute', top: note.y, left: note.x, background: note.colour, zIndex: note.zIndex }} 
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
              
                {/* <svg style={{width: '100%', height: '100%'}}>
                    {
                        this.state.lines.map(l => 
                            <path id="lineAB" d={this.getSvgFromLine(l)} stroke="purple" strokeWidth="3" fill="none" />
                        )
                    }
                    {
                        this.state.line ?
                        <path id="lineAB" d={this.getSvgFromLine(this.state.line)} stroke="red" strokeWidth="3" fill="none" />
                        : undefined
                    }
                </svg>*/}

                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'row' }}>
                    {
                        this.props.wall.users.map(u => 
                            <div key={u.id} style={{ backgroundColor: u.colour, margin: '6px', textAlign: 'center', lineHeight: '32px', fontWeight: 'bold', width: '32px', height: '32px', borderRadius: '32px'}}>
                                {u.name?.substr(0, 1).toUpperCase()}
                            </div>
                        )
                    }
                </div>
                
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', flexDirection: 'row', width: '1000px', margin: 'auto', right: 0 }}>
                    {
                        this.state.colours.map(c => 
                            <Card key={c} 
                                  style={{ width: '200px', height: '200px', background: c }} 
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
