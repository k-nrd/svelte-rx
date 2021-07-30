<script>
  import { combineLatest } from "rxjs";
  import { map, mapTo, distinctUntilChanged } from "rxjs/operators";
  import { useStore } from "../dist";

  // { todos: state => state.todos }
  export let selectors = {};
  // { createTodo: (payload) => ({ type: 'CREATE_TODO', payload }) }
  export let actions = {};

  const stateToProps = ss => model =>
    Object.keys(ss).reduce((acc, cur) => ({ ...acc, [cur]: ss[cur](model) }), {});

  const dispatchToProps = as => dispatch =>
    Object.keys(as).reduce(
      (acc, cur) => ({ ...acc, [cur]: pd => dispatch(as[cur](pd)) }),
      {}
    );

  const [state$, dispatch] = useStore();

  const selectors$ = state$.pipe(map(stateToProps(selectors)));

  const actions$ = state$.pipe(mapTo(dispatchToProps(actions)(dispatch)));

  const props$ = combineLatest(selectors$, actions$).pipe(
    map(([ss, as]) => ({ ...ss, ...as })),
    distinctUntilChanged()
  );
</script>

<slot props={$props$} propsObservable={props$}></slot>
