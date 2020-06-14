import React from "react";
import { User } from "wally-contract";
import { getContrastColour } from "./utils";

interface UserCoinProps {
    user: User;
    onClick?: () => void;
}

export const UserCoin: React.SFC<UserCoinProps> = (props) => {
    const coinSize: number = 38;

    const getShortUsername = (username?: string): string => {
        if (!username) {
            return "";
        }
        const upperOnly = username.replace(/[\sa-z]/g, '');
        if (upperOnly.length >= 2) {
            return upperOnly.substr(0, 2);
        }
        return username.substr(0, 2);
    }
    
    const handleClick = () => {
        if (props.onClick) {
            props.onClick();
        }
    }
    
    return (
        <div title={props.user.name} 
             onClick={handleClick}
             style={{ 
                 backgroundColor: props.user.colour, 
                 color: getContrastColour(props.user.colour),
                 cursor: 'pointer',
                 margin: '6px', 
                 textAlign: 'center', 
                 lineHeight: coinSize + "px", 
                //  fontWeight: 'bold', 
                 width: coinSize, 
                 height: coinSize, 
                 borderRadius: coinSize }}>
            {getShortUsername(props.user.name)}
        </div>
    );
}
