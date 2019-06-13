import CodeMirror from '../../lib/codemirror'

declare module '../../lib/codemirror' {
  interface EditorConfiguration {
    /** Provides an option foldGutter, which can be used to create a gutter with markers indicating the blocks that can be folded. Create a gutter using the gutters option, giving it the class CodeMirror-foldgutter or something else if you configure the addon to use a different class, and this addon will show markers next to folded and foldable blocks, and handle clicks in this gutter. Note that CSS styles should be applied to make the gutter, and the fold markers within it, visible. */
    foldGutter?: boolean;
  }
}
