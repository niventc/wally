import React, { Component, createRef } from 'react';
import { Card, Form, FormControl, Nav, Navbar } from 'react-bootstrap';
import { fromEvent, combineLatest } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { throttleTime, map, startWith } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { SketchPicker } from 'react-color'; 

import { NewNote, Note, Message, User, UpdateUser, MoveNote, UpdateNoteText, SelectNote } from 'wally-contract';

import './App.css';

interface Props {}

interface State {
  colours: string[],
  notes: Note[];
  selected?: Note;
  selectedNotes: SelectNote[];
  user: User;

  showColourPicker: boolean;
}

class App extends Component<Props, State> {

  public state: State = {
    colours: [
      'yellow',
      'orange',
      'lime',
      'dodgerblue',
      'deeppink'
    ],
    selected: undefined,
    notes: [],
    selectedNotes: [],
    user: {
      id: uuidv4(),
      name: "",
      colour: `rgb(${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)})`,
      useNightMode: true
    },

    showColourPicker: false
  };

  public appRef = createRef<HTMLDivElement>();

  public ws?: WebSocketSubject<Message> = undefined;

  public componentDidMount(): void {
    this.ws = webSocket("ws://localhost:5000/ws");

    this.ws
      .subscribe(x => {
        console.log(x);

        switch (x.type) {
          case NewNote.name:
            const newNote = x as NewNote;
            this.setState({
              ...this.state,
              notes: [...this.state.notes, newNote.note],
              selected: newNote.note
            });
            break;

          case MoveNote.name:
            const moveNote = x as MoveNote;
            const moveCard = this.state.notes.find(c => c.id === moveNote.noteId);
            const movedCard = Object.assign({}, moveCard, {x: moveNote.x, y: moveNote.y});
            this.setState({
              ...this.state, 
              notes: [...this.state.notes.filter(x => x.id !== moveNote.noteId), movedCard]
            });
            break;

          case UpdateNoteText.name:
            const updateNoteText = x as UpdateNoteText;
            const updateCard = this.state.notes.find(c => c.id === updateNoteText.noteId);
            const updatedCard = Object.assign({}, updateCard, {text: updateNoteText.text});
            this.setState({
              ...this.state, 
              notes: [...this.state.notes.filter(x => x.id !== updateNoteText.noteId), updatedCard]
            });
            break;

          case SelectNote.name:
            const selectNote = x as SelectNote;
            this.setState({
              ...this.state,
              selectedNotes: [
                ...this.state.selectedNotes.filter(n => n.byUser.id !== selectNote.byUser.id),
                selectNote
              ]
            });
            break;
        }

      });

    if (this.appRef.current) {
      const mousemove = fromEvent(this.appRef.current, "mousemove").pipe(startWith(undefined));
      const touchmove = fromEvent(this.appRef.current, "touchmove").pipe(startWith(undefined));

      combineLatest([mousemove, touchmove])
        .pipe(
          throttleTime(50),
          map(([mouse, touch]: [Event | undefined, Event | undefined]) => {
            return mouse ? mouse : touch;
          })
        )
        .subscribe(e => {
          if (e && this.state.selected) {
            const mousemove = e as MouseEvent;         
            const card = this.state.notes.find(x => this.state.selected && x.id === this.state.selected.id);
            if (card && this.appRef?.current) {
              e.stopPropagation();
              const bounding = this.appRef.current.getBoundingClientRect();
              const updatedCard = Object.assign({}, card, {x: mousemove.clientX - bounding.left, y: mousemove.clientY - bounding.top});
              // this.setState({
              //   ...this.state, 
              //   cards: [...this.state.cards.filter(x => this.state.selected && x.id !== this.state.selected.id), updatedCard]
              // });

              const moveNote = new MoveNote(this.state.selected.id, updatedCard.x, updatedCard.y);
              this.ws?.next(moveNote);
            }
          }
        })
    }
  }

  public get maxZIndex(): number {
    return Math.max(...this.state.notes.map(c => c.zIndex));
  }

  public select(note: Note): void {
    console.log("select", note);

    const selectNote = new SelectNote(note.id, this.state.user);
    this.ws?.next(selectNote);

    this.setState({...this.state, selected: note});
  }

  public unselect(): void {
    console.log("unselect");
    this.setState({...this.state, selected: undefined});
  }

  public cloneNote(event: React.MouseEvent, colour: string): void {
    const target = (event.target as HTMLElement);
    const card = target.closest(".card");
    const rect = card ? card.getBoundingClientRect() : target.getBoundingClientRect();

    const note = {
      id: uuidv4(),
      zIndex: 1,
      x: rect.left,
      y: rect.top,
      colour: colour,
      text: ''
    };

    const newNote = new NewNote(note);
    this.ws?.next(newNote);
  }

  public updateNoteText(noteId: string, e: React.FormEvent<HTMLTextAreaElement>): void {
    const card = this.state.notes.find(c => c.id === noteId);
    const updateNoteText = new UpdateNoteText(noteId, e.currentTarget.value);
    this.ws?.next(updateNoteText);
    
    const updatedCard = Object.assign({}, card, { text: e.currentTarget.value });
    this.setState({
      ...this.state,
      notes: [
        ...this.state.notes.filter(c => c.id !== noteId),
        updatedCard
      ]
    });
  }

  public updateUserNightMode(): void {
    const updateUser = new UpdateUser(this.state.user.id, {useNightMode: !this.state.user.useNightMode});
    this.ws?.next(updateUser);

    const user = Object.assign({}, this.state.user, {useNightMode: !this.state.user.useNightMode});
    this.setState({...this.state, user: user});
  }

  public updateUserColour(colour: string): void {
    const user = Object.assign({}, this.state.user, {colour: colour});
    this.setState({...this.state, user: user});
  }

  public closeColourPicker(): void {
    this.setState({...this.state, showColourPicker: false});

    const updateUser = new UpdateUser(this.state.user.id, {colour: this.state.user.colour});
    this.ws?.next(updateUser);
  }

  public updateUserName(e: React.FormEvent<HTMLInputElement>): void {
    const user = Object.assign({}, this.state.user, {name: e.currentTarget.value});
    this.setState({...this.state, user: user});
  }

  public finishChangeUserName(): void {
    const updateUser = new UpdateUser(this.state.user.id, {name: this.state.user.name});
    this.ws?.next(updateUser);
  }

  public selectedColour(noteId: string): string | undefined {
    const note = this.state.selectedNotes.find(n => n.noteId === noteId);
    return note?.byUser.colour;
  }

  public render(): JSX.Element {
    return (
      <div className="App" style={{background: this.state.user.useNightMode ? '#282c34' : 'inherit'}}>

        <Navbar fixed="top" variant={this.state.user.useNightMode ? 'dark' : 'light'} bg={this.state.user.useNightMode ? 'dark' : 'light'}>
          <Navbar.Brand>            
            <img alt="Wally logo" className="d-inline-block align-top" width="30" height="30" src="logo.png" style={{marginRight: '12px'}} />
            Wally
          </Navbar.Brand>

          <Nav className="mr-auto">
            <Nav.Link href="#">Home</Nav.Link>
          </Nav>

          <div>
            <div style={{background: this.state.user.colour, width: '25px', height: '25px', borderRadius: '25px', cursor: 'pointer', marginRight: '12px'}} onClick={() => this.setState({...this.state, showColourPicker: true})}>&nbsp;</div>
            {
              this.state.showColourPicker ? 
              <div style={{position: 'absolute', zIndex: 2}}>
                <div style={{position: 'fixed', top: 0, bottom: 0, left: 0, right: 0}} onClick={() => this.closeColourPicker()}></div>
                <SketchPicker color={this.state.user.colour} onChange={(colour) => this.updateUserColour(colour.hex)} />
              </div> 
              : null
            }
          </div>
          <Form inline>
            <Navbar.Text>
              <Form.Check style={{marginRight: '12px'}} id="nightMode" type="switch" label="Night mode" checked={this.state.user.useNightMode} onChange={() => this.updateUserNightMode()}></Form.Check>
            </Navbar.Text>
            <FormControl type="text" 
                         placeholder="Name" 
                         className="mr-sm-2" 
                         style={{marginRight: '12px'}}
                         value={this.state.user.name} 
                         onChange={(e: React.FormEvent<HTMLInputElement>) => this.updateUserName(e)}
                         onBlur={() => this.finishChangeUserName()} />
          </Form>
        </Navbar>
        
        <div ref={this.appRef} 
             style={{ position: 'relative', marginTop: '56px', width: '100%', height: '100%' }}
             onTouchEnd={(e: React.TouchEvent) => this.unselect()}
             onMouseUp={(e: React.MouseEvent) => this.unselect()}>
        {
          this.state.notes.map(c => 
            <Card key={c.id} style={{ border: '2px solid', borderColor: this.selectedColour(c.id), width: '200px', height: '200px', position: 'absolute', top: c.y, left: c.x, background: c.colour, zIndex: c.zIndex }} 
                  onTouchStart={(e: React.TouchEvent) => this.select(c)}
                  onMouseDown={(e: React.MouseEvent) => this.select(c)}>
              <Card.Body>
                <textarea value={c.text} onChange={(e: React.FormEvent<HTMLTextAreaElement>) => this.updateNoteText(c.id, e)} style={{ background: 'transparent', height: '100%', width: '100%', border: 'none', outline: 'none', resize: 'none' }}></textarea>
              </Card.Body>
            </Card>
            )
        }

          <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', flexDirection: 'row', width: '1000px', margin: 'auto', right: 0 }}>
            {
              this.state.colours.map(c => 
                <Card key={c} style={{ width: '200px', height: '200px', background: c }} onMouseDown={(e: React.MouseEvent) => this.cloneNote(e, c)}>
                </Card>                
              )
            }            
          </div>
        </div>        

      </div>
    );
  }
  
}

export default App;
