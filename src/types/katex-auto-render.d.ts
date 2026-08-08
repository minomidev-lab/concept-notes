declare module 'katex/dist/contrib/auto-render.mjs' {
  interface AutoRenderOptions {
    delimiters?: { left: string; right: string; display: boolean }[];
    throwOnError?: boolean;
  }
  export default function renderMathInElement(
    el: HTMLElement,
    options?: AutoRenderOptions,
  ): void;
}
