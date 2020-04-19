import React, { Component, Dispatch, createRef } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Card } from "react-bootstrap";

import { NewNote, Message, Note, UpdateNoteText, MoveNote, SelectNote, User, WallState } from "wally-contract";
import { connect } from "react-redux";
import { fromEvent, combineLatest } from "rxjs";
import { startWith, throttleTime, map } from "rxjs/operators";
import { SendWrapper } from "./webSocket.middleware";

interface WallProps {
    wall: WallState;
}

interface WallComponentState {
    colours: Array<string>;
    selectedNoteId: string | undefined;
}

interface StateProps {
    user: User;
}

interface ConnectedProps {
    newNote: (wallId: string, note: Note) => void;
    selectNote: (wallId: string, noteId: string, user: User) => void;
    updateNoteText: (wallId: string, noteId: string, text: string) => void;
    moveNote: (wallId: string, noteId: string, x: number, y: number) => void;
}

export default connect<StateProps, ConnectedProps>(
    (state: any) => ({ user: state.user }),
    (dispatch: Dispatch<Message>) => ({
        newNote: (wallId: string, note: Note) => dispatch(new SendWrapper(new NewNote(wallId, note))),
        selectNote: (wallId: string, noteId: string, user: User) => dispatch(new SendWrapper(new SelectNote(wallId, noteId, user))),
        updateNoteText: (wallId: string, noteId: string, text: string) => dispatch(new SendWrapper(new UpdateNoteText(wallId, noteId, text))),
        moveNote: (wallId: string, noteId: string, x: number, y: number) => dispatch(new SendWrapper(new MoveNote(wallId, noteId, x, y)))
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
        selectedNoteId: undefined
    }
    
    public wallRef = createRef<HTMLDivElement>();

    public componentDidMount(): void {
        if (this.wallRef.current) {
            const mousemove = fromEvent(this.wallRef.current, "mousemove").pipe(startWith(undefined));
            const touchmove = fromEvent(this.wallRef.current, "touchmove").pipe(startWith(undefined));
      
            combineLatest([mousemove, touchmove])
                .pipe(
                    throttleTime(50),
                    map(([mouse, touch]: [Event | undefined, Event | undefined]) => {
                    return mouse ? mouse : touch;
                    })
                )
                .subscribe(e => {
                    if (e && this.state.selectedNoteId && this.wallRef.current) {
                        const bounding = this.wallRef.current.getBoundingClientRect();
                        const mousemove = e as MouseEvent;
                        e.stopPropagation();      
                        this.props.moveNote(this.props.wall.name, this.state.selectedNoteId, mousemove.clientX - bounding.left, mousemove.clientY - bounding.top);
                    }
                });
        }
    }

    public cloneNote(event: React.MouseEvent, colour: string): void {
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

    public selectedColour(id: string): string {
        return "red";
    }

    public select(noteId: string): void {
        this.props.selectNote(this.props.wall.name, noteId, this.props.user);
        this.setState({...this.state, selectedNoteId: noteId});
    }

    public unselect(): void {
        this.setState({...this.state, selectedNoteId: undefined});
    }

    public render(): JSX.Element {
        return (
            <div ref={this.wallRef} 
                 style={{position: 'relative', width: '100%', height: '100%'}}
                 onTouchEnd={() => this.unselect()}
                 onMouseUp={() => this.unselect()}>
                {
                    this.props.wall.notes.map(note => 
                        <Card key={note._id} style={{ border: '2px solid', borderColor: this.selectedColour(note._id), width: '200px', height: '200px', position: 'absolute', top: note.y, left: note.x, background: note.colour, zIndex: note.zIndex }} 
                            onTouchStart={(e: React.TouchEvent) => this.select(note._id)}
                            onMouseDown={(e: React.MouseEvent) => this.select(note._id)}>
                            <Card.Body>
                                <textarea value={note.text} 
                                          onChange={(e: React.FormEvent<HTMLTextAreaElement>) => this.props.updateNoteText(this.props.wall.name, note._id, e.currentTarget.value)} 
                                          style={{ background: 'transparent', height: '100%', width: '100%', border: 'none', outline: 'none', resize: 'none' }}>
                                </textarea>
                            </Card.Body>
                        </Card>
                    )
                }

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
                                  onMouseDown={(e: React.MouseEvent) => this.cloneNote(e, c)}>
                            </Card>                
                        )
                    }            
                </div>
            </div>
        );
    }
}
)
