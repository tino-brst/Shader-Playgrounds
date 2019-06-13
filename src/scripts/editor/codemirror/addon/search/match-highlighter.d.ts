import CodeMirror from '../../lib/codemirror'

declare module '../../lib/codemirror' {
  interface HighlightSelectionMatchesOptions {
    minChars?: number
    style?: string
    trim?: boolean
    showToken?: true | RegExp
    delay?: number
  }

  interface EditorConfiguration {
    /** Can be set either to true or to an object containing the following options: minChars, for the minimum amount of selected characters that triggers a highlight (default 2), style, for the style to be used to highlight the matches (default "matchhighlight", which will correspond to CSS class cm-matchhighlight), trim, which controls whether whitespace is trimmed from the selection, and showToken which can be set to true or to a regexp matching the characters that make up a word. When enabled, it causes the current word to be highlighted when nothing is selected (defaults to off) */
    highlightSelectionMatches?: true | HighlightSelectionMatchesOptions
  }
}
