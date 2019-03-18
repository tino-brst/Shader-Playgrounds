import CodeMirror from "../lib/codemirror"

declare module "../../lib/codemirror" {
    interface EditorConfiguration {
        keyMap?: "default" | "sublime";
    }
}