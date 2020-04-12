import React, { Component, createRef } from 'react';
import { Card, Navbar, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';
import { fromEvent } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { throttleTime } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { NewNote, Note, Message } from 'wally-contract';

import './App.css';

interface Props {}

interface State {
  colours: string[],
  isNightMode: boolean;
  cards: Note[];
  selected?: Note;
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
    isNightMode: true,
    selected: undefined,
    cards: []
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
              cards: [...this.state.cards, newNote.note],
              selected: newNote.note
            });
            break;
        }

      });

    if (this.appRef.current) {
      fromEvent(this.appRef.current, "mousemove")
        .pipe(
          throttleTime(50)
        )
        .subscribe(e => {
          if (e.type === "mousemove") {
            const mousemove = e as MouseEvent;
            if (this.state.selected) {              
              const card = this.state.cards.find(x => this.state.selected && x.id === this.state.selected.id);
              if (card && this.appRef.current) {
                e.stopPropagation();
                const bounding = this.appRef.current.getBoundingClientRect();
                const updatedCard = Object.assign({}, card, {x: mousemove.clientX - bounding.left, y: mousemove.clientY - bounding.top});
                this.setState({
                  ...this.state, 
                  cards: [...this.state.cards.filter(x => this.state.selected && x.id !== this.state.selected.id), updatedCard]
                });
              }
            }              
          }
        })
    }
  }

  public get maxZIndex(): number {
    return Math.max(...this.state.cards.map(c => c.zIndex));
  }

  public select(card: Note): void {
    console.log("select", card);
    this.setState({...this.state, selected: card});
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
      colour: colour
    };

    const newNote = new NewNote(note);
    if (this.ws) {
      this.ws.next(newNote);
    }    
  }

  public render(): JSX.Element {
    return (
      <div className="App" style={{background: this.state.isNightMode ? '#282c34' : 'inherit'}}>

        <Navbar fixed="top" variant={this.state.isNightMode ? 'dark' : 'light'} bg={this.state.isNightMode ? 'dark' : 'light'}>
          <Navbar.Brand>Wally</Navbar.Brand>

          <ToggleButtonGroup type="radio" name="night" value={this.state.isNightMode} onChange={() => this.setState({...this.state, isNightMode: !this.state.isNightMode})}>
            <ToggleButton value={false}>Day</ToggleButton>
            <ToggleButton value={true}>Night</ToggleButton>
          </ToggleButtonGroup>
        </Navbar>
        
        <div ref={this.appRef} style={{ position: 'relative', marginTop: '56px', width: '100%', height: '100%' }} onMouseUp={(e: React.MouseEvent) => this.unselect()}>
        {
          this.state.cards.map(c => 
            <Card key={c.id} style={{ width: '200px', height: '200px', position: 'absolute', top: c.y, left: c.x, background: c.colour, zIndex: c.zIndex }} onMouseDown={(e: React.MouseEvent) => this.select(c)}>
              <Card.Body>
                <textarea style={{ background: 'transparent', height: '100%', width: '100%', border: 'none', outline: 'none', resize: 'none' }}></textarea>
              </Card.Body>
            </Card>
            )
        }

          <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', flexDirection: 'row', width: '1000px', margin: 'auto', right: 0 }}>
            {
              this.state.colours.map(c => 
                <Card key={c} style={{ width: '200px', height: '200px', background: c }} onMouseDown={(e: React.MouseEvent) => this.cloneNote(e, c)}>
                  <Card.Body>
                    <textarea style={{ background: 'transparent', height: '100%', width: '100%', border: 'none', outline: 'none', resize: 'none' }}></textarea>
                  </Card.Body>
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
