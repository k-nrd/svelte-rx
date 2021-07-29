import { from, Subject, isObservable } from "rxjs";
import { switchMap, scan, distinctUntilChanged, startWith } from "rxjs/operators";
import { getContext, setContext } from "svelte";
/* Reserved Constant */
const MODELKEY = typeof Symbol !== 'undefined'
    ? Symbol('@@svelte-rxflux/store')
    : '@@svelte-rxflux/store';
/* API */
export const createStore = (reducer, init) => {
    const action$ = new Subject();
    const state$ = action$.pipe(switchMap((action) => (isObservable(action) ? action : from([action]))), scan(reducer, init), startWith(init), distinctUntilChanged());
    const dispatch = (action) => {
        action$.next(action);
    };
    return [state$, dispatch];
};
export const withMiddleware = (reducer, init, ...middlewares) => {
    const [s$, d] = createStore(reducer, init);
    if (!Array.isArray(middlewares) || middlewares.length === 0) {
        return [s$, d];
    }
    // Some trickery to make every middleware call to 'dispatch'
    // go through the whole middleware chain again
    let dispatch = (_msg) => {
        throw new Error("Dispatching while constructing your middleware is not allowed. " +
            "Other middleware would not be applied to this dispatch.");
    };
    const get = (state$) => {
        let val;
        state$.subscribe((v) => {
            val = v;
        });
        return () => val;
    };
    const middlewareAPI = {
        getState: get(s$),
        dispatch: (msg) => dispatch(msg)
    };
    dispatch = middlewares
        .map((middleware) => middleware(middlewareAPI))
        .reduce((next, middleware) => middleware(next), d);
    return [s$, dispatch];
};
export const provideStore = (store) => {
    setContext(MODELKEY, store);
};
export const useStore = () => {
    const store = getContext(MODELKEY);
    if (store == null) {
        throw new Error("Context not found. Please ensure you provide the store using the `provideStore` function or the `ProvideStore` component.");
    }
    return store;
};
const prinf = (prev, tag, next) => {
    console.group(tag, '@' + new Date().toISOString());
    console.log('%cprev state', 'color:#9E9E9E', prev);
    console.log('%caction', 'color:#2196F3', tag);
    console.log('%cnext state', 'color:#4CAF50', next);
    console.groupEnd();
};
export const logger = ({ getState }) => (next) => (action) => {
    const previous = getState();
    const result = next(action);
    prinf(previous, action.type, getState());
    return result;
};
