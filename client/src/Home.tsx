import React, { Component, Dispatch } from "react";
import { Navbar, Nav, FormControl, Card, Button, Alert } from "react-bootstrap";
import { User as UserModel, CreateWall, JoinWall, Wall as WallModel, Message } from "wally-contract";
import { useParams, Switch, Route, Redirect } from "react-router-dom";

import Wall from "./Wall";
import { connect, useSelector, useDispatch } from "react-redux";
import User from "./User";
import { SendWrapper } from "./webSocket.middleware";
import { WallReducerState } from "./wall.reducer";

interface HomeState {
    wallId: string;
}

interface WallProps {
    wall: WallReducerState;
    user: UserModel;
}

interface WallLoaderParams {
    id: string;
}

const WallLoader: React.FunctionComponent = () => {
    const { id } = useParams<WallLoaderParams>();
    const wall = useSelector<any, WallModel>((state: any) => state.wall.wall);
    const dispatch = useDispatch();

    return (
        <div style={{width: '100%', height: '100%'}}>
            {wall ? <Wall wall={wall}></Wall> : dispatch(new SendWrapper(new JoinWall(id)))}
        </div>
    )
}

interface DispatchFromProps {    
    createWall: (id: string) => void,
    joinWall: (id: string) => void
}

export default connect<WallProps, DispatchFromProps>(
    (state: any) => ({ wall: state.wall, user: state.user }),
    (dispatch: Dispatch<Message>) => ({        
        createWall: (id: string) => dispatch(new SendWrapper(new CreateWall(id))),
        joinWall: (id: string) => dispatch(new SendWrapper(new JoinWall(id)))
    })
)(
class Home extends Component<DispatchFromProps & WallProps> {

    public state: HomeState = {
        wallId: ''
    };

    public updateWallId(e: React.FormEvent<HTMLInputElement>): void {
        this.setState({...this.state, wallId: e.currentTarget.value});
    }

    public createWall(): void {
        this.props.createWall(this.state.wallId);
    }

    public joinWall(): void {
        this.props.joinWall(this.state.wallId);
    }

    public render(): JSX.Element {
        return (
            <div className="App" style={{background: this.props.user.useNightMode ? '#282c34' : 'inherit'}}>
            
                <Navbar fixed="top" variant={this.props.user.useNightMode ? 'dark' : 'light'} bg={this.props.user.useNightMode ? 'dark' : 'light'} style={{borderBottom: '1px solid rgba(0,0,0,.125)'}}>
                    <Navbar.Brand>            
                        <img alt="Wally logo" className="d-inline-block align-top" width="30" height="30" src="logo.png" style={{marginRight: '12px'}} />
                        [wall-y]
                    </Navbar.Brand>

                    <Nav className="mr-auto">
                        <Nav.Link href="/">Home</Nav.Link>
                    </Nav>

                    <User />
                </Navbar>

                <div style={{ position: 'relative', width: '100%', height: '100%' }}>

                    {this.props.wall.wall ? <Redirect to={"/" + this.props.wall.wall.id} /> : undefined}
                    {this.props.wall.error ? <Redirect to={"/"} /> : undefined}

                    <Switch>
                        <Route exact path="/">
                            <div style={{ height: '20rem', width: '20rem', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, margin: 'auto' }}>
                                <Card className="text-center" bg={this.props.user.useNightMode ? 'dark' : 'light'} text={this.props.user.useNightMode ? 'light' : 'dark'}>
                                    <Card.Header>
                                        <img alt="Wally logo" className="d-inline-block align-top" width="60" height="60" src="logo.png" style={{marginRight: '12px'}} />
                                        <Card.Title>
                                            [wall-y]
                                        </Card.Title>
                                    </Card.Header>
                                    <Card.Body>
                                        <Card.Text>
                                            Enter an existing wall name or create a new wall to get started!
                                        </Card.Text>
                                        <FormControl type="text" placeholder="Wall name" value={this.state.wallId} onChange={(e: React.FormEvent<HTMLInputElement>) => this.updateWallId(e)} />
                                    </Card.Body>
                                    <div style={{padding: '0 1.25rem 1.25rem'}}>
                                        <Button variant="primary" onClick={() => this.joinWall()} style={{width: '50%'}}>Join</Button>
                                        <Button variant="success" onClick={() => this.createWall()} style={{width: '50%'}}>Create</Button>
                                    </div>
                                </Card>
                                {
                                    this.props.wall.error ? 
                                    <Alert variant="danger" style={{marginTop: '1.25rem'}}>
                                        {this.props.wall.error}
                                    </Alert> 
                                    : undefined
                                }
                            </div>
                        </Route>
                        <Route path="/:id">
                            <WallLoader />
                        </Route>
                    </Switch>
                </div>                

            </div>
        )
    }
}
)
