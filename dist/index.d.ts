import type { Observable } from 'rxjs';
export interface Action {
    readonly type: string;
    readonly payload: unknown;
}
export declare type Dispatch = (action: Action) => void;
export declare type MiddlewareAPI<State> = {
    getState: () => State;
    dispatch: Dispatch;
};
export declare type Reducer<State> = (action: Action, state: State) => State;
export declare type Middleware<State> = (model: MiddlewareAPI<State>) => (next: Dispatch) => (action: Action) => void;
export declare const createStore: <S>(reducer: Reducer<S>, init: S) => [Observable<S>, Dispatch];
export declare const withMiddleware: <S>(reducer: Reducer<S>, init: S, ...middlewares: Middleware<S>[]) => (Dispatch | Observable<S>)[];
export declare const provideStore: <S>(store: [Observable<S>, Dispatch]) => void;
export declare const useStore: <S>() => [Observable<S>, Dispatch];
export declare const logger: <S>({ getState }: MiddlewareAPI<S>) => (next: (action: Action) => S) => (action: Action) => S;
