// In React 19 + @types/react 19, JSX is no longer a global namespace; it's
// exported from 'react'. Use module augmentation to add custom-element types.
// See https://react.dev/blog/2024/12/05/react-19#changes-to-jsx
export {};

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
