// @barba/core's package.json points "types" at a folder it doesn't ship;
// map the module to the declarations it actually includes.
declare module '@barba/core' {
  export { default } from '@barba/core/dist/core/src/src/index';
}
