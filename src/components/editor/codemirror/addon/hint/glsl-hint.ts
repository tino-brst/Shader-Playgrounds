import CodeMirror from "../../lib/codemirror"
import fuzzysort from "fuzzysort"

interface Completion {
    name: string
    extraInfo?: string
    type?: CompletionType
    docs?: string
}

enum CompletionType {
    Function = "function",
    LocalIdentifier = "local-identifier",
    Preprocessor = "preprocessor",
    Macro = "macro",
    Type = "type",
    StorageQualifier = "storage-qualifier",
    ParameterQualifier = "parameter-qualifier",
    PrecisionQualifier = "precision-qualifier",
    InvarianceQualifier = "invariance-qualifier",
    Variable = "variable",
    Constant = "constant",
    Selection = "selection",
    Iteration = "iteration"
}

const predefinedCompletions: Completion[] = [
    { name: "dot",          type: CompletionType.Function,   docs: "docs ..." },
    { name: "normalize",    type: CompletionType.Function,   docs: "docs ..." },
    { name: "reflect",      type: CompletionType.Function,   docs: "docs ..." },
    { name: "vec2" },
    { name: "vec3",     type: CompletionType.Type },
    { name: "vec4",     type: CompletionType.Type },
    { name: "mat2",     type: CompletionType.Type,  docs: "docs ..." },
    { name: "mat3",     type: CompletionType.Type,  docs: "docs ..." },
    { name: "mat4",     type: CompletionType.Type,  docs: "docs ..." },
    { name: "bvec2",    type: CompletionType.Type,  docs: "docs ..." },
    { name: "bvec3",    type: CompletionType.Type,  docs: "docs ..." },
    { name: "bvec4",    type: CompletionType.Type,  docs: "docs ..." },
    { name: "uniform",  type: CompletionType.StorageQualifier,  docs: "super ultra mega long docs ..." },
    { name: "varying",  type: CompletionType.StorageQualifier,  docs: "super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega long docs ..." },
    { name: "in",       type: CompletionType.ParameterQualifier,  docs: "super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega long docs ..." },
    { name: "out",      type: CompletionType.ParameterQualifier,  docs: "super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega long docs ..." },
    { name: "inout",    type: CompletionType.ParameterQualifier,  docs: "super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega long docs ..." },
    { name: "highp",    type: CompletionType.PrecisionQualifier,  docs: "super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega long docs ..." },
    { name: "mediump",  type: CompletionType.PrecisionQualifier,  docs: "super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega long docs ..." },
    { name: "invariant",    type: CompletionType.InvarianceQualifier,  docs: "super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega long docs ..." },
    { name: "#version", type: CompletionType.Preprocessor,      docs: "docs ..." },
    { name: "__LINE__", type: CompletionType.Macro,             docs: "docs ..." },
    { name: "if",       type: CompletionType.Selection,         docs: "docs ..." },
    { name: "else",     type: CompletionType.Selection,         docs: "docs ..." },
    { name: "for",      type: CompletionType.Iteration,         docs: "docs ..." },
    { name: "while",    type: CompletionType.Iteration,         docs: "docs ..." },
    { name: "gl_Position",              type: CompletionType.Variable,         docs: "docs ..." },
    { name: "gl_PointSize",             type: CompletionType.Variable,         docs: "docs ..." },
    { name: "gl_MaxVertexAttribs",      type: CompletionType.Constant,         docs: "docs ..." }
]

function render( element: HTMLLIElement, data: CodeMirror.Hints, cur: CodeMirror.Hint ) {
    const typeIcon = document.createElement( "span" )
    typeIcon.classList.add( "icon" )
    element.appendChild( typeIcon )

    const textSpan = document.createElement( "span" )
    textSpan.classList.add( "display-text" )
    textSpan.innerHTML = highlight( cur.displayText || cur.text, cur.indexes || [] )
    element.appendChild( textSpan )
}

function highlight( text: string, indexes: number[] = [], openingMark: string = "<b>", closingMark: string = "</b>" ) {
    var highlighted = ""
    var matchesIndex = 0
    var opened = false
    var textLength = text.length
    var matchesBest = indexes

    for ( var i = 0; i < textLength; ++ i ) {
        var char = text[i]

        if ( matchesBest[matchesIndex] === i ) {
            ++ matchesIndex

            if ( ! opened ) {
                opened = true
                highlighted += openingMark
            }

            if ( matchesIndex === matchesBest.length ) {
                highlighted += char + closingMark + text.substr( i + 1 )
                break
            }
        } else {
            if ( opened ) {
                opened = false
                highlighted += closingMark
            }
        }
        highlighted += char
    }

    return highlighted
}

function getLocalIdentifiers( editor: CodeMirror.Editor ): string[] {
    const identifiers: Set<string> = new Set()

    const document   = editor.getDoc()
    const firstLine  = document.firstLine()
    const lastLine   = document.lastLine()

    for ( let line = firstLine; line <= lastLine; line ++ ) {
        const tokens = editor.getLineTokens( line )

        for ( let token of tokens ) {
            if ( token.type === "identifier" ) identifiers.add( token.string )
        }
    }

    // ignoro el identificador que se esta tipeando
    // @ts-ignore
    const cursor = editor.getCursor()
    const tokenAtCursor = editor.getTokenAt( cursor )
    identifiers.delete( tokenAtCursor.string )

    return Array.from( identifiers )
}

CodeMirror.registerHelper( "hint", "glsl", ( editor: CodeMirror.Editor, options: any ) => {
    // @ts-ignore
    const cursor = editor.getCursor()
    const tokenAtCursor  = editor.getTokenAt( cursor )
    const cursorFollowsWhitespace = tokenAtCursor.string.trimLeft().length === 0

    const start = cursorFollowsWhitespace ? cursor.ch : tokenAtCursor.start // si no hay caracteres previos al activar el autocomplete lo alineo con el cursor ()
    const end   = cursor.ch

    const localIdentifiers: Completion[] = getLocalIdentifiers( editor ).map( identifier => ( { name: identifier, type: CompletionType.LocalIdentifier } ) )

    // en caso de estar tipeando un atributo solo paso la lista de identificadores
    const completions = tokenAtCursor.type === "attribute" ? localIdentifiers : predefinedCompletions.concat( localIdentifiers )
    const results = fuzzysort.go<Completion>( tokenAtCursor.string, completions, { key: "name" } )

    const list: CodeMirror.Hint[] = results.map( ( result ): CodeMirror.Hint => ( {
        text: result.obj.name,
        displayText: result.obj.name + result.obj.extraInfo === undefined ? "" : result.obj.extraInfo,
        className: result.obj.type,
        render,
        indexes: result.indexes,
        docs: result.obj.docs
    } ) )

    const from = CodeMirror.Pos( cursor.line, start )
    const to   = CodeMirror.Pos( cursor.line, end )

    return { list, from, to }
} )
