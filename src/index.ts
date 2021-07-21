import { getContext, setContext } from 'svelte'
import { writable, derived, get } from 'svelte/store'
import type { Readable } from 'svelte/store'

/* Types */
export interface Message {
  readonly type: string
  readonly payload: unknown
}

export type Value<Model> = Model[keyof Model]

export type ModelNode<Model> = Value<Model> | Model

export type Dispatch = (msg: Message) => void

export type ModelAPI<Model> = Readable<ModelNode<Model>> & {dispatch: Dispatch}

export interface MiddlewareAPI<Model> {getState: () => ModelNode<Model>, dispatch: Dispatch}

export type UpdateFunction<Model> = (msg: Message) => (model: Model) => Model

export type Middleware<Model> = (model: MiddlewareAPI<Model>) => (next: Dispatch) => (msg: Message) => void

/* TypeGuards */
export function isObjNotProp<T> (x: T | T[keyof T]): x is T {
  return typeof x === 'object' && x !== null
}

export function hasProp<T> (obj: T, x: string | number | symbol): x is keyof T {
  return x in obj
}

/* Reserved Constant */
const MODELKEY = typeof Symbol !== 'undefined' ? Symbol('svelte-tea/model') : 'svelte-tea/model'

/* API */
export const createModel = <Model> (update: UpdateFunction<Model>) => (init: Model): ModelAPI<Model> => {
  const { subscribe, update: updateStore } = writable(init)

  const dispatch: Dispatch = (msg) => {
    updateStore(update(msg))
  }

  return { subscribe, dispatch }
}

export const withMiddleware = <Model> (...middlewares: Array<Middleware<Model>>) => (update: UpdateFunction<Model>) => (init: Model): ModelAPI<Model> => {
  const model = createModel<Model>(update)(init)

  if (!Array.isArray(middlewares) || middlewares.length === 0) return model

  // Some trickery to make every middleware call to 'dispatch'
  // go through the whole middleware chain again
  let dispatch: Dispatch = (_msg) => {
    throw new Error(
      'Dispatching while constructing your middleware is not allowed. ' +
      'Other middleware would not be applied to this dispatch.',
    )
  }

  const middlewareAPI: MiddlewareAPI<Model> = {
    getState: () => get(model),
    dispatch: (msg) => dispatch(msg),
  }

  dispatch = middlewares
    .map((middleware: Middleware<Model>) => middleware(middlewareAPI))
    .reduce((next: Dispatch, middleware: (d: Dispatch) => (m: Message) => void) => middleware(next), model.dispatch)

  return { ...model, dispatch }
}

export const provideModel = <Model> (model: ModelAPI<Model>): void => {
  setContext(MODELKEY, model)
}

export const useModel = <Model> (...path: string[]): Record<string, Readable<ModelNode<Model>> | Dispatch> => {
  const cache: Record<string, Record<string, Readable<ModelNode<Model>> | Dispatch>> = {}

  const key = path
    .map((s: string) => s.replace(/\s+/g, ''))
    .map((s: string) => s.toLowerCase())
    .join(':')

  if (cache[key] != null) return cache[key]

  const model: ModelAPI<Model> = getContext(MODELKEY)

  if (model == null) {
    throw new Error('Context not found. Please ensure you provide the model using "provideModel" function')
  }

  const { subscribe } = derived(
    model,
    ($model: ModelNode<Model>): ModelNode<Model> =>
      path.reduce(
        (acc: ModelNode<Model>, cur: string): ModelNode<Model> => {
          if (isObjNotProp<Model>(acc) && hasProp(acc, cur)) return acc[cur]
          throw new Error(`Model or node of model ${JSON.stringify(acc)} does not have property ${cur}`)
        },
        $model,
      ),
  )

  const name = path[path.length - 1] ?? 'model'

  const node = { [name]: { subscribe }, send: model.dispatch }

  cache[key] = node

  return node
}

const prinf = <Model>(prev: Model, tag: string, next: Model): void => {
  console.group(tag, '@' + new Date().toISOString())
  console.log('%cprev state', 'color:#9E9E9E', prev)
  console.log('%caction', 'color:#2196F3', tag)
  console.log('%cnext state', 'color:#4CAF50', next)
  console.groupEnd()
}

export const logger = <Model>({ getState }: MiddlewareAPI<Model>) => (next: (msg: Message) => Model) => (msg: Message): Model => {
  const previous = getState()
  const result = next(msg)
  prinf(previous, msg.type, getState())
  return result
}
