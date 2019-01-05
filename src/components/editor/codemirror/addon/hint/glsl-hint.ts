import CodeMirror from "../../lib/codemirror"
import fuzzysort from "fuzzysort"

interface Completion {
    name: string
    type: string
    docs?: string
}

CodeMirror.registerHelper( "hint", "glsl", ( editor: CodeMirror.Editor, options: any ) => {
    // @ts-ignore
    const cursor = editor.getCursor()
    const tokenAtCursor  = editor.getTokenAt( cursor )
    const cursorFollowsWhitespace = tokenAtCursor.string.trimLeft().length === 0

    const start = cursorFollowsWhitespace ? cursor.ch : tokenAtCursor.start // si no hay caracteres previos al activar el autocomplete lo alineo con el cursor ()
    const end   = cursor.ch

    const predefined: Completion[] = [
        { name: "dot",      type: "function",   docs: "docs ..." },
        { name: "vec2",     type: "type" },
        { name: "vec3",     type: "type" },
        { name: "vec4",     type: "type" },
        { name: "mat2",     type: "type",       docs: "docs ..." },
        { name: "mat3",     type: "type",       docs: "docs ..." },
        { name: "mat4",     type: "type",       docs: "docs ..." },
        { name: "bvec2",    type: "type",       docs: "docs ..." },
        { name: "bvec3",    type: "type",       docs: "docs ..." },
        { name: "bvec4",    type: "type",       docs: "docs ..." },
        { name: "uniform",  type: "keyword",    docs: "super ultra mega long docs ..." },
        { name: "varying",  type: "keyword",    docs: "super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega super ultra mega long docs ..." },
        { name: "#version", type: "keyword",    docs: "docs ..." }
    ]
    const localIdentifiers: Completion[] = getLocalIdentifiers( editor ).map( identifier => ( { name: identifier, type: "local" } ) )

    const completions = predefined.concat( localIdentifiers )
    const results = fuzzysort.go<Completion>( tokenAtCursor.string, completions, { key: "name" } )

    const list: CodeMirror.Hint[] = results.map( ( result ): CodeMirror.Hint => ( {
        text: result.obj.name,
        displayText: result.obj.name + " ...",
        className: getClassForType( result.obj.type ),
        render,
        indexes: result.indexes,
        docs: result.obj.docs ? result.obj.name + " " + result.obj.docs : ""
    } ) )

    const from = CodeMirror.Pos( cursor.line, start )
    const to   = CodeMirror.Pos( cursor.line, end )

    return { list, from, to }
} )

function render( element: HTMLLIElement, data: CodeMirror.Hints, cur: CodeMirror.Hint ) {
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

function getClassForType( type: string ) {
    switch ( type ) {
        case "function":    return "class1"
        case "type":        return "class2"
        case "keyword":     return "class3"
        case "local":       return "class4"
    }
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
