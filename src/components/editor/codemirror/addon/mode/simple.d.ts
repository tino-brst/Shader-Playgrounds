import CodeMirror from "../../lib/codemirror"

declare module "../../lib/codemirror" {

    interface Rule {
        regex: RegExp | string,
        token?: string | null | Array < string | null >,
        next?: string,
        push?: string,
        pop?: boolean,
        indent?: boolean,
        dedent?: boolean
    }

    interface Meta {
        /** An array of states in which the mode's auto-indentation should not take effect. Usually used for multi-line comment and string states. */
        dontIndentStates?: string[],
        lineComment?: string,
        fold?: string[]
    }

    interface States {
        [ key: string ]: Rule[] | Meta | undefined
        start?: Rule[]
        meta?: Meta
    }

    function defineSimpleMode( name: string, states: States ): void

}
