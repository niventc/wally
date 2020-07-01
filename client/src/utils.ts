import { useRef, useEffect } from "react";

const loggingEnabled = false;

export function useTraceUpdate(props: any) {
    const prev = useRef(props);
    useEffect(() => {
        const changedProps = Object.entries(props).reduce((ps: any, [k, v]) => {
            if (prev.current[k] !== v) {
                ps[k] = [prev.current[k], v];
            }
            return ps;
        }, {});
        if (Object.keys(changedProps).length > 0) {
            loggingEnabled && console.log('Changed props:', changedProps);
        }
        prev.current = props;
    });
}

export function componentDidMountChanges(props: any, prevProps: any, state: any, prevState: any): void {
    Object.entries(props).forEach(([key, val]) =>
        prevProps[key] !== val && loggingEnabled && console.log(`Prop '${key}' changed`)
    );
    if (state) {
        Object.entries(state).forEach(([key, val]) =>
            prevState[key] !== val && loggingEnabled && console.log(`State '${key}' changed`)
        );
    }
}

export function getContrastColour(colour: string): string {
    let r = 0;
    let g = 0;
    let b = 0;
    if (colour.startsWith("#")) {
        const cleanHex = colour.replace("#", "");
        r = parseInt(cleanHex.substr(0, 2), 16);
        g = parseInt(cleanHex.substr(2, 2), 16);
        b = parseInt(cleanHex.substr(4, 2), 16);
    } else if (colour.startsWith("rgb(")) {
        const cleanRgb = colour.replace("rgb(", "");
        const rgbSplit = cleanRgb.split(",");
        r = parseInt(rgbSplit[0],10);
        g = parseInt(rgbSplit[1],10);
        b = parseInt(rgbSplit[2],16);
    } else {
        switch (colour) {
            case "yellow":
                r = 255;
                g = 255;
                b = 0;
                break;
            case "orange":
                r = 255;
                g = 165;
                b = 0;
                break;
            case "lime":
                r = 0;
                g = 255;
                b = 0;
                break;
            case "dodgerblue":
                r = 30;
                g = 144;
                b = 255;
                break;
            case "deeppink":
                r = 255;
                g = 20;
                b = 147;
                break;
        }
    }
    let yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 104) ? 'black' : 'white';
}
