import { connect } from "react-redux";
import React, { Component, Dispatch } from "react";
import { Navbar, Form, FormControl } from "react-bootstrap";
import { SketchPicker } from "react-color";

import { User, UpdateUser, Message } from "wally-contract";
import { SendWrapper } from "./webSocket.middleware";

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
class User extends Component<StateProps & DispatchProps> {
    
    public state: UserState = {
        showColourPicker: false
    };

    public render(): JSX.Element {
        return (
            <div>                
                <Form inline>
                    <div>
                        <div style={{background: this.props.user.colour, width: '25px', height: '25px', borderRadius: '25px', cursor: 'pointer', marginRight: '12px'}} 
                            onClick={() => this.setState({...this.state, showColourPicker: true})}>&nbsp;</div>
                        {
                            this.state.showColourPicker ? 
                            <div style={{position: 'absolute', zIndex: 2}}>
                                <div style={{position: 'fixed', top: 0, bottom: 0, left: 0, right: 0}} onClick={() => this.setState({...this.state, showColourPicker: false})}></div>
                                <SketchPicker color={this.props.user.colour} onChange={(colour) => this.props.updateUser(this.props.user._id, { colour: colour.hex })} />
                            </div> 
                            : null
                        }
                    </div>
                    <Navbar.Text>
                        <Form.Check style={{marginRight: '12px'}} 
                                    id="nightMode" 
                                    type="switch" 
                                    label="Night mode" 
                                    checked={this.props.user.useNightMode} 
                                    onChange={() => this.props.updateUser(this.props.user._id, { useNightMode: !this.props.user.useNightMode })}>
                        </Form.Check>
                    </Navbar.Text>
                    <FormControl type="text" 
                                placeholder="Name" 
                                className="mr-sm-2" 
                                style={{marginRight: '12px'}}
                                value={this.props.user.name} 
                                onChange={(e: React.FormEvent<HTMLInputElement>) => this.props.updateUser(this.props.user._id, { name: e.currentTarget.value })}/>
                </Form>
            </div>
        );
    }
}
)