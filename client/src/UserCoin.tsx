import React from "react";
import { User } from "wally-contract";

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

    const getContrastColour = (colour: string) => {
        let r, g, b = 0;
        if (colour.startsWith("#")) {
            const cleanHex = colour.replace("#", "");
            r = parseInt(cleanHex.substr(0, 2), 16);
            g = parseInt(cleanHex.substr(2, 2), 16);
            b = parseInt(cleanHex.substr(4, 2), 16);
        } else {
            const cleanRgb = colour.replace("rgb(", "");
            const rgbSplit = cleanRgb.split(",");
            r = parseInt(rgbSplit[0],10);
            g = parseInt(rgbSplit[1],10);
            b = parseInt(rgbSplit[2],16);
        }
        var yiq = ((r*299)+(g*587)+(b*114))/1000;
        return (yiq >= 128) ? 'black' : 'white';
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
