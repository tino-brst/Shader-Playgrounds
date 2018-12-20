import CodeMirror from "../../lib/codemirror"

declare module "../../lib/codemirror" {
    interface EditorConfiguration {
        foldOptions?: {
            rangeFinder?: ( cm: CodeMirror.Editor, pos: CodeMirror.Position ) => void
            widget?: string | HTMLElement
            scanUp?: boolean
            minFoldSize? : number
        }
    }
}
