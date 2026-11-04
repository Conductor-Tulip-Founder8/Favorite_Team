// The host supplies React at runtime; this only gives the type checker a JSX namespace.
declare namespace JSX {
  interface IntrinsicElements {
    [elem: string]: any;
  }
  interface ElementChildrenAttribute {
    children: {};
  }
}
