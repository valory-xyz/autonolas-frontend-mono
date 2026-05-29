/* eslint-disable @typescript-eslint/no-explicit-any */
// `export {}` makes this file a module (rather than an ambient script),
// which is required for `declare module` augmentations to work.
export {};

declare module '*.svg' {
  const content: any;
  export const ReactComponent: any;
  export default content;
}
