import { Editor, Position, TextMarker } from "../../lib/codemirror"

const PLACEHOLDER_CLASS = "snippet-placeholder"
const SEARCH_RANGE = 3 // number of lines to inspect when looking for placeholders

function insertPlaceholder( editor: Editor, from: Position, to: Position, text: string ): TextMarker {
    const placeholderElement = document.createElement( "span" )

    placeholderElement.className = PLACEHOLDER_CLASS
    placeholderElement.tabIndex  = - 1 // makes it focusable, but only via element.focus()
    placeholderElement.innerText = text

    const marker = editor.markText( from, to, { replacedWith: placeholderElement } )

    placeholderElement.addEventListener( "focus", () => {
        editor.setCursor( marker.find().to )
    } )

    placeholderElement.addEventListener( "dblclick", () => {
        const { from: placeholderStar, to: placeholderEnd } = marker.find()
        editor.replaceRange( "", placeholderStar, placeholderEnd )
        editor.focus()
    } )

    placeholderElement.addEventListener( "keydown", ( event ) => {
        const key = event.key
        const { from: placeholderStar, to: placeholderEnd } = marker.find()
        const modifiersActive = event.ctrlKey || event.metaKey

        switch ( key ) {
            // ➡️
            case "Tab":
                event.preventDefault()
                if ( event.shiftKey ) {
                    focusOnPreviousPlaceholder( editor, placeholderStar )
                } else {
                    focusOnNextPlaceholder( editor, placeholderEnd )
                }
                break
            // ◀️▶️🔼🔽
            case "ArrowLeft":
                editor.focus()
                editor.setCursor( placeholderStar )
                break
            case "ArrowRight":
                editor.focus()
                editor.setCursor( placeholderEnd )
                break
            case "ArrowUp":
                editor.focus()
                editor.setCursor( { line: placeholderStar.line - 1, ch: placeholderStar.ch } )
                break
            case "ArrowDown":
                editor.focus()
                editor.setCursor( { line: placeholderStar.line + 1, ch: placeholderStar.ch } )
                break
            // ⬅️
            case "Backspace":
            case "Delete":
                editor.replaceRange( "", placeholderStar, placeholderEnd )
                editor.focus()
                break
            // ↩️
            case "Enter":
                event.preventDefault()
                editor.replaceRange( "", placeholderStar, placeholderEnd )
                editor.focus()
                break
            // 🔠
            default:
                const isCharacterInput = ( key.length === 1 ) // is "A", "=", "i" and not "Enter", "Tab", "Alt" etc

                if ( isCharacterInput ) {
                    // it may be a shortcut, edit only when it is not
                    if ( ! modifiersActive ) {
                        editor.replaceRange( "", placeholderStar, placeholderEnd )
                        editor.focus()
                    } else {
                        event.stopImmediatePropagation()
                        editor.getInputField().dispatchEvent( new KeyboardEvent( "keydown", event ) )
                        editor.focus()
                    }
                }
                break
        }
    } )

    marker.on( "beforeCursorEnter", () => {
        if ( marker.replacedWith ) marker.replacedWith.focus()
    } )

    marker.on( "hide", () => {
        editor.focus()
    } )

    return marker
}

function focusOnNextPlaceholder( editor: Editor, from: Position ): boolean {
    const lastLine = Math.min( from.line + SEARCH_RANGE, editor.lineCount() )
    let focusedOnPlaceholder = false
    let placeholders: TextMarker[] = []
    let cursor = { line: from.line, ch: from.ch }

    while ( ( ! placeholders.length ) && ( cursor.line < lastLine ) ) {
        const lineContent = editor.getLine( cursor.line )
        placeholders = editor.findMarks( cursor, { line: cursor.line, ch: lineContent.length } ).filter( marker => isPlaceholderMarker( marker ) )
        cursor.line ++
        cursor.ch = 0
    }

    if ( placeholders.length ) {
        // @ts-ignore
        placeholders[ 0 ].replacedWith.focus()
        focusedOnPlaceholder = true
    }

    return focusedOnPlaceholder
}

function focusOnPreviousPlaceholder( editor: Editor, from: Position ): boolean {
    const lastLine = Math.min( from.line - SEARCH_RANGE, editor.lineCount() )
    let focusedOnPlaceholder = false
    let placeholders: TextMarker[] = []
    let cursor = { line: from.line, ch: from.ch }

    while ( ( ! placeholders.length ) && ( cursor.line > lastLine ) ) {
        placeholders = editor.findMarks( { line: cursor.line, ch: 0 }, cursor ).filter( marker => isPlaceholderMarker( marker ) )
        const lineContent = editor.getLine( -- cursor.line )
        cursor.ch = lineContent ? lineContent.length : 0
    }

    if ( placeholders.length ) {
        // @ts-ignore
        placeholders[ placeholders.length - 1 ].replacedWith.focus()
        focusedOnPlaceholder = true
    }

    return focusedOnPlaceholder
}

function isPlaceholderMarker( marker: TextMarker ) {
    return marker.replacedWith && marker.replacedWith.className === PLACEHOLDER_CLASS
}

export {
    insertPlaceholder,
    focusOnNextPlaceholder,
    focusOnPreviousPlaceholder,
    isPlaceholderMarker
}
