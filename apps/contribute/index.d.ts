/* eslint-disable @typescript-eslint/no-explicit-any */
// `export {}` makes this file a module (rather than an ambient script),
// which is required for `declare module 'react'` below to *augment* React's
// types instead of replacing them.
export {};

declare module '*.svg' {
  const content: any;
  export const ReactComponent: any;
  export default content;
}

// In React 19 + @types/react 19, JSX is no longer a global namespace; it's
// exported from 'react'. Use module augmentation to add custom-element types.
// See https://react.dev/blog/2024/12/05/react-19#changes-to-jsx
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'w3m-button': {
        disabled?: boolean;
        balance?: 'show' | 'hide';
        size?: 'md' | 'sm';
        label?: string;
        loadingLabel?: string;
      };
    }
  }
}
