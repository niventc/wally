import React, { Component, Dispatch } from "react";
import { Navbar, Nav, FormControl, Card, Button, Alert } from "react-bootstrap";
import { User as UserModel, CreateWall, JoinWall, Message, WallState, DeleteWall } from "wally-contract";
import { useParams, Switch, Route, Redirect } from "react-router-dom";

import Wall from "./Wall";
import { connect, useSelector, useDispatch } from "react-redux";
import User from "./User";
import { SendWrapper } from "./webSocket.middleware";
import { WallReducerState } from "./wall.reducer";
import { HomeReducerState } from "./home.reducer";
import { componentDidMountChanges, useTraceUpdate } from "./utils";

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

const WallLoader: React.FunctionComponent = (props: any) => {
    const { name } = useParams<WallLoaderParams>();
    const wall = useSelector<any, WallState>((state: any) => state.wall.wall);
    const dispatch = useDispatch();

    useTraceUpdate(props);

    return (
        <div style={{width: '100%', height: '100%'}}>
            {wall ? <Wall wall={wall}></Wall> : dispatch(new SendWrapper(new JoinWall(unescape(name))))}
        </div>
    )
}

interface DispatchFromProps {    
    createWall: (id: string) => void,
    joinWall: (id: string) => void,
    toggleSideBar: () => void,
    deleteWall: (id: string) => void
}

export default connect<WallProps, DispatchFromProps>(
    (state: any) => ({ home: state.home, wall: state.wall, user: state.user }),
    (dispatch: Dispatch<Message>) => ({        
        createWall: (id: string) => dispatch(new SendWrapper(new CreateWall(id))),
        joinWall: (id: string) => dispatch(new SendWrapper(new JoinWall(id))),
        toggleSideBar: () => dispatch({type: "ToggleSideBar"}),
        deleteWall: (id: string) => dispatch(new SendWrapper(new DeleteWall(id))),
    })
)(
class Home extends Component<DispatchFromProps & WallProps> {

    public state: HomeState = {
        wallName: ''
    };

    public componentDidUpdate(prevProps: any, prevState: any): void {
        componentDidMountChanges(this.props, prevProps, this.state, prevState);
    }

    public updateWallName(e: React.FormEvent<HTMLInputElement>): void {
        this.setState({...this.state, wallName: e.currentTarget.value});
    }

    public createWall(): void {
        this.props.createWall(this.state.wallName);
    }

    public joinWall(): void {
        this.props.joinWall(this.state.wallName);
    }

    public deleteWall(wallName: string): void {
        this.props.deleteWall(wallName);
    }

    public render(): JSX.Element {
        return (
            <div className="App" style={{ display: 'flex', flexDirection: 'row', background: this.props.user.useNightMode ? '#282c34' : 'inherit'}}>
            
                <Navbar variant={this.props.user.useNightMode ? 'dark' : 'light'} 
                        bg={this.props.user.useNightMode ? 'dark' : 'light'} 
                        style={{flexDirection: 'column', position: 'sticky', zIndex: 100, width: this.props.home.isSideBarOpen ? '15%' : '62px', height: '100%', borderRight: '1px solid rgba(0,0,0,.125)'}}>
                    <Navbar.Brand href="/" title="Home" className="mr-auto">            
                        <img alt="Wally logo" className="d-inline-block align-top" width="30" height="30" src="logo.png" style={{marginRight: '12px'}} />
                        { this.props.home.isSideBarOpen ? '[wall-y]' : undefined }
                    </Navbar.Brand>

                    { 
                        this.props.home.isSideBarOpen ? 
                        <Nav className="mr-auto" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <Navbar.Text style={{ borderBottom: '1px solid', textTransform: 'uppercase', fontSize: 'small'}}>
                                Recently Viewed
                            </Navbar.Text>
                            {this.props.home.recentWalls.map(w => 
                                <div key={w} style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <Nav.Link href={"/" + escape(w)}>
                                        {w}
                                    </Nav.Link>
                                    <Button type="button"
                                            title="Delete wall" 
                                            variant={this.props.user.useNightMode ? 'dark' : 'light'}
                                            onClick={() => this.deleteWall(w)}>
                                        <svg className="bi bi-trash" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                                            <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" clipRule="evenodd"/>
                                        </svg>
                                    </Button>
                                </div>
                            )}
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
                            {
                                this.props.home.isSideBarOpen ? 
                                <svg className="bi bi-chevron-left" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 010 .708L5.707 8l5.647 5.646a.5.5 0 01-.708.708l-6-6a.5.5 0 010-.708l6-6a.5.5 0 01.708 0z" clipRule="evenodd"/>
                                </svg>
                                :
                                <svg className="bi bi-chevron-right" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 01.708 0l6 6a.5.5 0 010 .708l-6 6a.5.5 0 01-.708-.708L10.293 8 4.646 2.354a.5.5 0 010-.708z" clipRule="evenodd"/>
                                </svg>
                            }
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
