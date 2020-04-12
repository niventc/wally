import React, { Component } from 'react';
import { Card } from 'react-bootstrap';
import './App.css';

class App extends Component {

  public selected?: HTMLElement = undefined;

  public select(e: React.MouseEvent): void {
    if (e.currentTarget.tagName === 'DIV' && e.currentTarget.className.toLowerCase() === 'card') {
      console.log("select", e);
      this.selected = e.currentTarget as HTMLElement;
    }
  }

  public unselect(e: React.MouseEvent): void {
    console.log("unselect", e);
    this.selected = undefined;
  }

  public move(e: React.MouseEvent): void {
    if (this.selected) {
      e.stopPropagation();
      console.log("move", e.pageX, e.pageY);
      this.selected.style.top = e.pageY + "px";
      this.selected.style.left = e.pageX + "px";
    }
  }

  public render(): JSX.Element {
    return (
      <div className="App" onMouseMove={(e) => this.move(e)} onMouseUp={(e: React.MouseEvent) => this.unselect(e)}>
        
        <Card style={{width: '18rem', position: 'absolute'}} onMouseDown={(e: React.MouseEvent) => this.select(e)} >
          <Card.Body>
            <Card.Text>
              Empty
            </Card.Text>
          </Card.Body>
        </Card>

        <Card style={{width: '18rem', position: 'absolute'}} onMouseDown={(e: React.MouseEvent) => this.select(e)} >
          <Card.Body>
            <Card.Text>
              Empty
            </Card.Text>
          </Card.Body>
        </Card>

      </div>
    );
  }
  
}

export default App;
