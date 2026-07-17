// Turning off eslint for this file because it's a shim file, and we don't want to lint it.
/* eslint-disable */

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
