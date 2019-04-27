import fuzzysort from "fuzzysort"
import CodeMirror, { Editor, Hint, Hints, Position, TextMarker } from "../../lib/codemirror"
import { glsl, Name, NameWithType, NameWithParametersAndType, Docs, CodeSnippet } from "./glsl-reference"
import { insertPlaceholder, focusOnNextPlaceholder } from "./placeholder"

interface Keyword {
    name: string,
    docs?: string
}
interface Variable extends Keyword {
    type: string
}
interface Snippet extends Keyword {
    snippet: string
}
interface Function extends Snippet {
    returns: string,
    parameters: Parameter[],
}

interface Parameter {
    name: string,
    type: string
}

// GLSL Reference Parsers 🔎

function parseKeyword( [ name, docs ]: [ Name, Docs? ] ): Keyword {
    return { name, docs }
}

function parseVariable( [ variable, docs ]: [ NameWithType, Docs? ] ): Variable {
    // remove whitespace
    variable = variable.replace( /\s/g, "" )

    const [ name, type ] = variable.split( ":" )

    return { name, type, docs }
}

function parseSnippet( [ name, snippet, docs ]: [ Name, CodeSnippet, Docs? ] ): Snippet {
    return { name, snippet, docs }
}

function parseFunction( [ func, docs ]: [ NameWithParametersAndType, Docs? ] ): Function {
    let aux: string | string[]
    let name: string
    let returns: string
    let parameters: Parameter[]

    // remove whitespace
    func = func.replace( /\s/g, "" );

    // "name(param:type):returns" -> [ "name(param:type", "returns" ]
    [ aux, returns ] = func.split( "):" );

    // "name(param:type" -> [ "name", "param:type" ]
    [ name, aux ] = aux.split( "(" )

    // if the function has parameters
    if ( aux !== "" ) {
        // "param1:type1,param2:type2" -> [ "param1:type1", "param2:type2" ]
        aux = aux.split( "," )

        parameters = aux.map( ( parameter ) => {
            const [ name, type ] = parameter.split( ":" )
            return { name, type }
        } )
    } else {
        parameters = []
    }

    const snippet = newFunctionSnippet( name, parameters )

    return { name, docs, returns, parameters, snippet }
}

function newFunctionSnippet( name: string, parameters: Parameter[] ) {
    const formattedParameters = parameters.map( parameter => `{{${ parameter.name }: ${ parameter.type }}}` ).join( ", " )
    return name + "(" + formattedParameters + ")"
}

// Parsed GLSL Info

const parsed = {
    types: glsl.types.map( value => parseKeyword( value ) ),
    storageQualifiers: glsl.storageQualifiers.map( value => parseKeyword( value ) ),
    parameterQualifiers: glsl.parameterQualifiers.map( value => parseKeyword( value ) ),
    precisionQualifiers: glsl.precisionQualifiers.map( value => parseKeyword( value ) ),
    invarianceQualifiers: glsl.invarianceQualifiers.map( value => parseKeyword( value ) ),
    preprocessor: glsl.preprocessor.map( value => parseKeyword( value ) ),
    macros: glsl.macros.map( value => parseKeyword( value ) ),
    others: glsl.others.map( value => parseKeyword( value ) ),
    variables: glsl.variables.map( value => parseVariable( value ) ),
    constants: glsl.constants.map( value => parseVariable( value ) ),
    functions: glsl.functions.map( value => parseFunction( value ) ),
    snippets: glsl.snippets.map( value => parseSnippet( value ) ),
    predefinedAttributes: glsl.predefinedAttributes.map( value => parseVariable( value ) ),
    predefinedUniforms: glsl.predefinedUniforms.map( value => parseVariable( value ) )
}

const predefinedVariablesNames: string[] = [
    ...parsed.predefinedAttributes.map( value => value.name ),
    ...parsed.predefinedUniforms.map( value => value.name )
]

// Mapping to CodeMirror Hints 🗺

enum HintClass {
    LocalIdentifier     = "local-identifier",
    Type                = "type",
    Preprocessor        = "preprocessor",
    Macro               = "macro",
    StorageQualifier    = "storage-qualifier",
    ParameterQualifier  = "parameter-qualifier",
    PrecisionQualifier  = "precision-qualifier",
    InvarianceQualifier = "invariance-qualifier",
    Variable            = "variable",
    Constant            = "constant",
    Function            = "function",
    Snippet             = "snippet",
    VertexAttribute     = "vertex-attribute",
    Uniform             = "uniform"
}

function mapKeywordsToHints( keywords: Keyword[], className?: HintClass ): Hint[] {
    return keywords.map( ( { name, docs } ) => ( {
        text: name,
        displayText: name,
        docs,
        className,
        hint,
        render
    } ) )
}

function mapVariablesToHints( variables: Variable[], className?: HintClass ): Hint[] {
    return variables.map( ( { name, type, docs } ) => ( {
        text: name,
        displayText: `${ name }: ${ type }`,
        docs,
        className,
        hint,
        render
    } ) )
}

function mapFunctionsToHints( functions: Function[], className?: HintClass ): Hint[] {
    return functions.map( ( { name, returns, parameters, docs, snippet } ) => {
        // Parameter[] -> param: type, param: type, ...
        const displayParameters = parameters.map( ( { name, type } ) => `${ name }: ${ type }` ).join( ", " )

        return {
            text: name,
            displayText: `${ name }(${ displayParameters }): ${ returns }`,
            docs,
            className,
            snippet,
            hint,
            render
        }
    } )
}

function mapSnippetsToHints( snippets: Snippet[], className?: HintClass ): Hint[] {
    return snippets.map( ( { name, docs, snippet } ) => ( {
        text: name,
        displayText: name,
        docs,
        className,
        snippet,
        hint,
        render
    } ) )
}

function mapLocalIdentifiersToHints( identifiers: string[], className?: HintClass ): Hint[] {
    return identifiers.map( identifier => ( {
        text: identifier,
        className,
        hint,
        render
    } ) )
}

// Available Hints 🔤

const glslHints: Hint[] = []

glslHints.push( ...mapVariablesToHints( parsed.predefinedUniforms, HintClass.Uniform ) )
glslHints.push( ...mapVariablesToHints( parsed.predefinedAttributes, HintClass.VertexAttribute ) )
glslHints.push( ...mapKeywordsToHints( parsed.types, HintClass.Type ) )
glslHints.push( ...mapKeywordsToHints( parsed.storageQualifiers, HintClass.StorageQualifier ) )
glslHints.push( ...mapKeywordsToHints( parsed.parameterQualifiers, HintClass.ParameterQualifier ) )
glslHints.push( ...mapKeywordsToHints( parsed.precisionQualifiers, HintClass.PrecisionQualifier ) )
glslHints.push( ...mapKeywordsToHints( parsed.invarianceQualifiers, HintClass.InvarianceQualifier ) )
glslHints.push( ...mapKeywordsToHints( parsed.preprocessor, HintClass.Preprocessor ) )
glslHints.push( ...mapKeywordsToHints( parsed.macros, HintClass.Macro ) )
glslHints.push( ...mapKeywordsToHints( parsed.others ) )
glslHints.push( ...mapVariablesToHints( parsed.variables, HintClass.Variable ) )
glslHints.push( ...mapVariablesToHints( parsed.constants, HintClass.Constant ) )
glslHints.push( ...mapFunctionsToHints( parsed.functions, HintClass.Function ) )
glslHints.push( ...mapSnippetsToHints( parsed.snippets, HintClass.Snippet ) )

// Hint support functions

function render( element: HTMLLIElement, data: Hints, cur: Hint ) {
    const typeIcon = document.createElement( "span" )
    typeIcon.classList.add( "icon" )
    element.appendChild( typeIcon )

    const textSpan = document.createElement( "span" )
    textSpan.classList.add( "display-text" )
    textSpan.innerHTML = highlight( cur.displayText || cur.text, cur.indexes || [] )
    element.appendChild( textSpan )
}

function hint( editor: Editor, data: Hints, selected: Hint ) {
    const { from, to } = data

    if ( ! selected.snippet ) {
        editor.replaceRange( selected.text, from, to )
    } else {
        const placeholderMarkers: TextMarker[] = []

        editor.operation( () => {
            // @ts-ignore
            const lines = selected.snippet.split( "\n" )

            for ( let index = 0; index < lines.length; index ++ ) {
                const line = lines[ index ]
                const isFirstLine = index === 0
                const placeholders: { text: string, offset: number }[] = []

                // find line placeholders and clean their moustaches: {{placeholder}} -> placeholder
                let replacement = line.replace( /\{\{.*?\}\}/g, ( match, offset ) => {
                    placeholders.push( {
                        text: match.substring( 2, match.length - 2 ),
                        offset: offset - placeholders.length * 4
                    } )
                    return match.substring( 2, match.length - 2 )
                } )

                let cursor: Position

                // insert snippet line and set cursor at the beginning of the line (ready for placeholders insertion)
                if ( isFirstLine ) {
                    editor.replaceRange( replacement, from, to )
                    cursor = { line: from.line, ch: from.ch }
                } else {
                    editor.replaceRange( "\n" + replacement, editor.getCursor() )
                    cursor = { line: from.line + index, ch: 0 }
                }

                // insert line placeholders
                for ( let placeholder of placeholders ) {
                    const from = { line: cursor.line, ch: cursor.ch + placeholder.offset }
                    const to   = { line: cursor.line, ch: cursor.ch + placeholder.offset + placeholder.text.length }
                    const marker = insertPlaceholder( editor, from, to, placeholder.text )

                    placeholderMarkers.push( marker )
                }
                editor.indentLine( cursor.line )
            }
            // set cursor after first placeholder and blur editor
            editor.setCursor( placeholderMarkers[ 0 ].find().to )
            editor.getInputField().blur()
            // done on placeholder focus but done by hand now to avoid 'active-line' jumps
            // due to the placeholder.focus() not being immediate
        } )
        // @ts-ignore - by default, focus on first placeholder
        setTimeout( () => { placeholderMarkers[ 0 ].replacedWith.focus() }, 0 )
    }
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

function getLocalIdentifiers( editor: Editor ): string[] {
    const firstLine  = editor.firstLine()
    const lastLine   = editor.lastLine()
    const cursor     = editor.getCursor()

    const identifiers: Set<string> = new Set()

    for ( let line = firstLine; line <= lastLine; line ++ ) {
        const tokens = editor.getLineTokens( line )

        if ( line !== cursor.line ) {
            // cuando la linea no corresponde a la del cursor agrego todos los identificadores
            for ( let token of tokens ) {
                // si son de tipo identificador y no estan entre las variables predefinidas
                if ( token.type === "identifier" && ! predefinedVariablesNames.includes( token.string ) ) identifiers.add( token.string )
            }
        } else {
            // cuando coincide con la del cursor me fijo de no estar agregando al token que se esta tipeando
            for ( let token of tokens ) {
                if ( ! ( token.start <= cursor.ch && cursor.ch <= token.end ) && token.type === "identifier" ) identifiers.add( token.string )
            }
        }
    }

    return Array.from( identifiers )
}

CodeMirror.registerHelper( "hint", "glsl-es-100", ( editor: Editor, options: any ) => {
    // @ts-ignore
    const cursor = editor.getCursor()
    const tokenAtCursor = editor.getTokenAt( cursor )
    const cursorFollowsWhitespace = tokenAtCursor.string.trimLeft().length === 0

    const start = cursorFollowsWhitespace ? cursor.ch : tokenAtCursor.start // si no hay caracteres previos al activar el autocomplete lo alineo con el cursor ()
    const end   = tokenAtCursor.end > cursor.ch ? tokenAtCursor.end : cursor.ch

    const localIdentifiersHints: Hint[] = mapLocalIdentifiersToHints( getLocalIdentifiers( editor ), HintClass.LocalIdentifier )

    // en caso de estar tipeando un atributo, solo paso la lista de identificadores
    const hints   = tokenAtCursor.type === "attribute" || tokenAtCursor.string === "." ? localIdentifiersHints : localIdentifiersHints.concat( glslHints )
    const results = fuzzysort.go<Hint>( tokenAtCursor.string, hints, { key: "text" } )

    let list: Hint[]

    if ( options.trigger === undefined && results.length === 0 ) {
        list = hints
    } else {
        list = results.map( ( { obj, indexes } ): Hint => ( { ...obj, indexes } ) )
    }

    const from = CodeMirror.Pos( cursor.line, start )
    const to   = CodeMirror.Pos( cursor.line, end )

    return { list, from, to }
} )
