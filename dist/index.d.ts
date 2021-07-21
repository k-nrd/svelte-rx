import type { Readable } from 'svelte/store';
export interface Message {
    readonly type: string;
    readonly payload: unknown;
}
export declare type Value<Model> = Model[keyof Model];
export declare type ModelNode<Model> = Value<Model> | Model;
export declare type Dispatch = (msg: Message) => void;
export declare type ModelAPI<Model> = Readable<ModelNode<Model>> & {
    dispatch: Dispatch;
};
export interface MiddlewareAPI<Model> {
    getState: () => ModelNode<Model>;
    dispatch: Dispatch;
}
export declare type UpdateFunction<Model> = (msg: Message) => (model: Model) => Model;
export declare type Middleware<Model> = (model: MiddlewareAPI<Model>) => (next: Dispatch) => (msg: Message) => void;
export declare function isObjNotProp<T>(x: T | T[keyof T]): x is T;
export declare function hasProp<T>(obj: T, x: string | number | symbol): x is keyof T;
export declare const createModel: <Model>(update: UpdateFunction<Model>) => (init: Model) => ModelAPI<Model>;
export declare const withMiddleware: <Model>(...middlewares: Middleware<Model>[]) => (update: UpdateFunction<Model>) => (init: Model) => ModelAPI<Model>;
export declare const provideModel: <Model>(model: ModelAPI<Model>) => void;
export declare const useModel: <Model>(...path: string[]) => Record<string, Dispatch | Readable<ModelNode<Model>>>;
export declare const logger: <Model>({ getState }: MiddlewareAPI<Model>) => (next: (msg: Message) => Model) => (msg: Message) => Model;
