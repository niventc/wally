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