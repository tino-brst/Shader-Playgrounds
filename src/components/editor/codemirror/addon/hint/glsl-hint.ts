import CodeMirror from "../../lib/codemirror"
import fuzzysort from "fuzzysort"

CodeMirror.registerHelper( "hint", "x-shader/x-vertex", ( editor: CodeMirror.Editor, options: any ) => {
    // @ts-ignore
    const cursor = editor.getCursor()
    const token  = editor.getTokenAt( cursor )
    const cursorFollowsWhitespace = token.string.trimLeft().length === 0

    const start = cursorFollowsWhitespace ? cursor.ch : token.start // si no hay caracteres previos al activar el autocomplete lo alineo con el cursor ()
    const end   = cursor.ch

    const completions: CodeMirror.Hint[] = [
        { text: "dot",      displayText: "dot ...",         className: "class1" },
        { text: "vec2",     displayText: "vec2 ...",        className: "class2" },
        { text: "vec3",     displayText: "vec3 ...",        className: "class2" },
        { text: "vec4",     displayText: "vec4 ...",        className: "class2" },
        { text: "uniform",  displayText: "uniform ...",     className: "class3" },
        { text: "#version", displayText: "#version ...",    className: "class3" }
    ]

    const list = fuzzysort.go<CodeMirror.Hint>( token.string, completions, { key: "text" } ).map( result => ( { ...result.obj, render, indexes: result.indexes } ) )
    const from = CodeMirror.Pos( cursor.line, start )
    const to   = CodeMirror.Pos( cursor.line, end )

    return { list, from, to, render }
} )

function render( element: HTMLLIElement, data: CodeMirror.Hints, cur: CodeMirror.Hint ) {
    const textSpan = document.createElement( "span" )

    textSpan.classList.add( "display-text" )
    textSpan.innerHTML = highlight( cur.displayText || cur.text, cur.indexes || [], "<b>", "</b>" )

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
