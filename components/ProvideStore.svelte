<script>
  import { provideStore } from "../dist";

  export let store;

  provideStore(store);
</script>

<slot></slot>
