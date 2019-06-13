import CodeMirror from '../../lib/codemirror'

declare module '../../lib/codemirror' {
  interface EditorConfiguration {
    /** Defines an option autoCloseBrackets that will auto-close brackets and quotes when typed. By default, it'll auto-close ()[]{}''"".  */
    autoCloseBrackets?: boolean | { pairs?: string, closeBefore?: string, explode?: string, triples?: string } ;
  }
}
