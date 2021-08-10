import type { Observable } from 'rxjs';
export interface Action {
    readonly type: string;
    readonly payload: unknown;
}
export declare type Dispatch = (action: Action) => void;
export declare type Reducer<State> = (state: State, action: Action) => State;
export declare type UseStore<State> = [Observable<State>, Dispatch];
export interface MiddlewareAPI<State> {
    getState: () => State;
    dispatch: Dispatch;
}
export declare type Middleware<State> = (m: MiddlewareAPI<State>) => (next: Dispatch) => (action: Action) => void;
export declare const createStore: <S>(reducer: Reducer<S>, init: S) => UseStore<S>;
export declare const withMiddleware: <S>(reducer: Reducer<S>, init: S) => (...middlewares: Middleware<S>[]) => UseStore<S>;
export declare const provideStore: <S>(store: UseStore<S>) => void;
export declare const useStore: <S>() => UseStore<S>;
export declare const logger: <S>({ getState }: MiddlewareAPI<S>) => (next: (action: Action) => S) => (action: Action) => S;
