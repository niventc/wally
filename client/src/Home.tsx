import React, { Component, Dispatch } from "react";
import { Navbar, Nav, FormControl, Card, Button, Alert } from "react-bootstrap";
import { User as UserModel, CreateWall, JoinWall, Message, WallState } from "wally-contract";
import { useParams, Switch, Route, Redirect } from "react-router-dom";

import Wall from "./Wall";
import { connect, useSelector, useDispatch } from "react-redux";
import User from "./User";
import { SendWrapper } from "./webSocket.middleware";
import { WallReducerState } from "./wall.reducer";
import { HomeReducerState } from "./home.reducer";

interface HomeState {
    wallName: string;
}

interface WallProps {
    home: HomeReducerState;
    wall: WallReducerState;
    user: UserModel;
}

interface WallLoaderParams {
    name: string;
}

const WallLoader: React.FunctionComponent = () => {
    const { name } = useParams<WallLoaderParams>();
    const wall = useSelector<any, WallState>((state: any) => state.wall.wall);
    const dispatch = useDispatch();

    return (
        <div style={{width: '100%', height: '100%'}}>
            {wall ? <Wall wall={wall}></Wall> : dispatch(new SendWrapper(new JoinWall(unescape(name))))}
        </div>
    )
}

interface DispatchFromProps {    
    createWall: (id: string) => void,
    joinWall: (id: string) => void,
    toggleSideBar: () => void
}

export default connect<WallProps, DispatchFromProps>(
    (state: any) => ({ home: state.home, wall: state.wall, user: state.user }),
    (dispatch: Dispatch<Message>) => ({        
        createWall: (id: string) => dispatch(new SendWrapper(new CreateWall(id))),
        joinWall: (id: string) => dispatch(new SendWrapper(new JoinWall(id))),
        toggleSideBar: () => dispatch({type: "ToggleSideBar"})
    })
)(
class Home extends Component<DispatchFromProps & WallProps> {

    public state: HomeState = {
        wallName: ''
    };

    public updateWallName(e: React.FormEvent<HTMLInputElement>): void {
        this.setState({...this.state, wallName: e.currentTarget.value});
    }

    public createWall(): void {
        this.props.createWall(this.state.wallName);
    }

    public joinWall(): void {
        this.props.joinWall(this.state.wallName);
    }

    public render(): JSX.Element {
        return (
            <div className="App" style={{ display: 'flex', flexDirection: 'row', background: this.props.user.useNightMode ? '#282c34' : 'inherit'}}>
            
                <Navbar variant={this.props.user.useNightMode ? 'dark' : 'light'} 
                        bg={this.props.user.useNightMode ? 'dark' : 'light'} 
                        style={{flexDirection: 'column', position: 'sticky', width: this.props.home.isSideBarOpen ? '15%' : '62px', height: '100%', borderRight: '1px solid rgba(0,0,0,.125)'}}>
                    <Navbar.Brand href="/" className="mr-auto">            
                        <img alt="Wally logo" className="d-inline-block align-top" width="30" height="30" src="logo.png" style={{marginRight: '12px'}} />
                        { this.props.home.isSideBarOpen ? '[wall-y]' : undefined }
                    </Navbar.Brand>

                    { 
                        this.props.home.isSideBarOpen ? 
                        <Nav className="mr-auto" style={{ display: 'flex', flexDirection: 'column' }}>
                            {this.props.home.recentWalls.map(w => <Nav.Link key={w} href={"/" + escape(w)}>{w}</Nav.Link>)}
                        </Nav>
                        : undefined
                    }
                    
                    <div style={{ flexGrow: 1 }}></div>

                    <User isExpanded={this.props.home.isSideBarOpen} />

                    <Nav style={{justifyContent: 'space-between', width: this.props.home.isSideBarOpen ? '100%' : undefined}}>
                        {this.props.home.isSideBarOpen ? <Navbar.Text>About</Navbar.Text> : undefined}
                        <Button type="button" 
                                title="Toggle Sidebar"
                                variant={this.props.user.useNightMode ? 'dark' : 'light'} 
                                onClick={() => this.props.toggleSideBar()}>
                            {this.props.home.isSideBarOpen ? '<' : '>'}
                        </Button>
                    </Nav>
                </Navbar>

                <div style={{ position: 'relative', width: this.props.home.isSideBarOpen ? '85%' : 'calc(100% - 62px)', height: '100%' }}>

                    {this.props.wall.wall ? <Redirect to={"/" + escape(this.props.wall.wall.name)} /> : undefined}
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
                                        <FormControl type="text" placeholder="Wall name" value={this.state.wallName} onChange={(e: React.FormEvent<HTMLInputElement>) => this.updateWallName(e)} />
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
                        <Route path="/:name">
                            <WallLoader />
                        </Route>
                    </Switch>
                </div>                

            </div>
        )
    }
}
)
