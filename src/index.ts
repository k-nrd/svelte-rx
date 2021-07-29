import type { Observable } from 'rxjs'
import { from, Subject, isObservable } from "rxjs";
import {  switchMap,  scan,  distinctUntilChanged,  startWith} from "rxjs/operators";
import { getContext, setContext } from "svelte";

/* Types */
export interface Action {
  readonly type: string
  readonly payload: unknown
}

export type Dispatch = (action: Action) => void

export type MiddlewareAPI<State> = {getState: () => State, dispatch: Dispatch}

export type Reducer<State> = (action: Action, state: State) => State

export type Middleware<State> = (model: MiddlewareAPI<State>) => (next: Dispatch) => (action: Action) => void

/* Reserved Constant */
const MODELKEY = typeof Symbol !== 'undefined' 
  ? Symbol('@@svelte-rxflux/store') 
  : '@@svelte-rxflux/store'

/* API */
export const createStore = <S>(reducer: Reducer<S>, init: S): [Observable<S>, Dispatch] => {
  const action$ = new Subject();

  const state$ = action$.pipe(
    switchMap((action: Action) => (isObservable(action) ? action : from([action]))),
    scan(reducer, init),
    startWith(init),
    distinctUntilChanged()
  );

  const dispatch: Dispatch = (action) => {
    action$.next(action);
  };

  return [state$, dispatch];
};

export const withMiddleware = <S>(reducer: Reducer<S>, init: S, ...middlewares: Middleware<S>[]) => {
  const [s$, d] = createStore(reducer, init);

  if (!Array.isArray(middlewares) || middlewares.length === 0) {
    return [s$, d];
  }

  // Some trickery to make every middleware call to 'dispatch'
  // go through the whole middleware chain again
  let dispatch: Dispatch = (_msg) => {
    throw new Error(
      "Dispatching while constructing your middleware is not allowed. " +
        "Other middleware would not be applied to this dispatch."
    );
  };

  const get = <S>(state$: Observable<S>) => {
    let val: S;
    state$.subscribe((v: S) => {
      val = v;
    });
    return (): S => val;
  };

  const middlewareAPI: MiddlewareAPI<S> = {
    getState: get<S>(s$),
    dispatch: (msg) => dispatch(msg)
  };

  dispatch = middlewares
    .map((middleware) => middleware(middlewareAPI))
    .reduce((next, middleware) => middleware(next), d);

  return [s$, dispatch];
};

export const provideStore = <S>(store: [Observable<S>, Dispatch]) => {
  setContext(MODELKEY, store);
};

export const useStore = <S>(): [Observable<S>, Dispatch] => {
  const store = getContext(MODELKEY);

  if (store == null) {
    throw new Error(
      "Context not found. Please ensure you provide the store using the `provideStore` function or the `ProvideStore` component."
    );
  }

  return store;
};

const prinf = <S>(prev: S, tag: string, next: S): void => {
  console.group(tag, '@' + new Date().toISOString())
  console.log('%cprev state', 'color:#9E9E9E', prev)
  console.log('%caction', 'color:#2196F3', tag)
  console.log('%cnext state', 'color:#4CAF50', next)
  console.groupEnd()
}

export const logger = <S>({ getState }: MiddlewareAPI<S>) => (next: (action: Action) => S) => (action: Action): S => {
  const previous = getState()
  const result = next(action)
  prinf<S>(previous, action.type, getState())
  return result
}
