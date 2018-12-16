import CodeMirror from "../../lib/codemirror"

declare module "../../lib/codemirror" {
    interface EditorConfiguration {
        /** Defines a styleActiveLine option that, when enabled, gives the wrapper of the line that contains the cursor the class CodeMirror-activeline, adds a background with the class CodeMirror-activeline-background, and adds the class CodeMirror-activeline-gutter to the line's gutter space is enabled */
        styleActiveLine?: boolean;
    }
}
