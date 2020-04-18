import { connect } from "react-redux";
import React, { Component, Dispatch } from "react";
import { Navbar, Form } from "react-bootstrap";
import { SketchPicker } from "react-color";

import { User, UpdateUser, Message } from "wally-contract";
import { SendWrapper } from "./webSocket.middleware";

interface UserProps {
    isExpanded: boolean;
}

interface StateProps {
    user: User;
}

interface DispatchProps {
    updateUser: (userId: string, user: Partial<User>) => void;
}

interface UserState {
    showColourPicker: boolean;
}

export default connect<StateProps, DispatchProps>(
    (state: any) => ({ user: state.user }),
    (dispatch: Dispatch<Message>) => ({
        updateUser: (userId: string, user: Partial<User>) => dispatch(new SendWrapper(new UpdateUser(userId, user)))
    })
)(
class User extends Component<UserProps & StateProps & DispatchProps> {
    
    public state: UserState = {
        showColourPicker: false
    };

    public render(): JSX.Element {
        return (
            <div className="text-center">                
                <div style={{margin: 'auto', position: 'relative'}}>
                    <div style={{background: this.props.user.colour, width: '32px', height: '32px', borderRadius: '32px', cursor: 'pointer'}} 
                        onClick={() => this.setState({...this.state, showColourPicker: true})}>&nbsp;</div>
                    {
                        this.state.showColourPicker ? 
                        <div style={{position: 'absolute', top: '-308px', zIndex: 2}}>
                            <div style={{position: 'fixed', top: 0, bottom: 0, left: 0, right: 0}} onClick={() => this.setState({...this.state, showColourPicker: false})}></div>
                            <SketchPicker color={this.props.user.colour} onChange={(colour) => this.props.updateUser(this.props.user._id, { colour: colour.hex })} />
                        </div> 
                        : null
                    }
                </div>
                <Navbar.Text>
                    <div title={this.props.user.useNightMode ? "Use day mode" : "Use night mode"} style={{cursor: 'pointer'}} onClick={() => this.props.updateUser(this.props.user._id, { useNightMode: !this.props.user.useNightMode })}>
                    {
                        this.props.user.useNightMode ?
                        <svg className="bi bi-sun" width="2em" height="2em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 8a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z"/>
                            <path fillRule="evenodd" d="M8.202.28a.25.25 0 00-.404 0l-.91 1.255a.25.25 0 01-.334.067L5.232.79a.25.25 0 00-.374.155l-.36 1.508a.25.25 0 01-.282.19l-1.532-.245a.25.25 0 00-.286.286l.244 1.532a.25.25 0 01-.189.282l-1.509.36a.25.25 0 00-.154.374l.812 1.322a.25.25 0 01-.067.333l-1.256.91a.25.25 0 000 .405l1.256.91a.25.25 0 01.067.334L.79 10.768a.25.25 0 00.154.374l1.51.36a.25.25 0 01.188.282l-.244 1.532a.25.25 0 00.286.286l1.532-.244a.25.25 0 01.282.189l.36 1.508a.25.25 0 00.374.155l1.322-.812a.25.25 0 01.333.067l.91 1.256a.25.25 0 00.405 0l.91-1.256a.25.25 0 01.334-.067l1.322.812a.25.25 0 00.374-.155l.36-1.508a.25.25 0 01.282-.19l1.532.245a.25.25 0 00.286-.286l-.244-1.532a.25.25 0 01.189-.282l1.508-.36a.25.25 0 00.155-.374l-.812-1.322a.25.25 0 01.067-.333l1.256-.91a.25.25 0 000-.405l-1.256-.91a.25.25 0 01-.067-.334l.812-1.322a.25.25 0 00-.155-.374l-1.508-.36a.25.25 0 01-.19-.282l.245-1.532a.25.25 0 00-.286-.286l-1.532.244a.25.25 0 01-.282-.189l-.36-1.508a.25.25 0 00-.374-.155l-1.322.812a.25.25 0 01-.333-.067L8.203.28zM8 2.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" clipRule="evenodd"/>
                        </svg> :
                        <svg className="bi bi-moon" width="2em" height="2em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M14.53 10.53a7 7 0 01-9.058-9.058A7.003 7.003 0 008 15a7.002 7.002 0 006.53-4.47z" clipRule="evenodd"/>
                        </svg>
                    }
                    </div>
                </Navbar.Text>                
                {
                    this.props.isExpanded ?
                    <Form inline style={{marginBottom: '12px'}}>
                        {/* <FormControl type="text" 
                                    placeholder="Name" 
                                    className="mr-sm-2" 
                                    style={{marginRight: '12px'}}
                                    value={this.props.user.name} 
                                    onChange={(e: React.FormEvent<HTMLInputElement>) => this.props.updateUser(this.props.user._id, { name: e.currentTarget.value })}/> */}
                    </Form>
                    : undefined 
                }   
            </div>
        );
    }
}
)