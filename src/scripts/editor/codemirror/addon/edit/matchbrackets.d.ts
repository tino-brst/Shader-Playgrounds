import CodeMirror from "../../lib/codemirror"

declare module "../../lib/codemirror" {
    interface EditorConfiguration {
        /** Defines an option matchBrackets which, when set to true or an options object, causes matching brackets to be highlighted whenever the cursor is next to them.  */
        matchBrackets?: boolean;
    }
}
