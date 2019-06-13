import CodeMirror from '../../lib/codemirror'

declare module '../../lib/codemirror' {
  interface EditorConfiguration {
    /** Used to control the mouse cursor appearance when hovering over the selection. It can be set to a string, like "pointer", or to true, in which case the "default" (arrow) cursor will be used. */
    selectionPointer?: true | string;
  }
}
