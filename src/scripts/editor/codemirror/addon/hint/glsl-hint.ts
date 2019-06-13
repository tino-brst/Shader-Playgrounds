import fuzzysort from 'fuzzysort'
import CodeMirror, { Editor, Hint, Hints, Position, TextMarker } from '../../lib/codemirror'
import { glslES100, glslES300, Name, NameWithType, NameWithParametersAndType, Docs, CodeSnippet, snippets, predefinedUniforms, predefinedAttributes } from './glsl-reference'
import { insertPlaceholder } from './placeholder'

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

function parseKeyword ([ name, docs ]: [ Name, Docs? ]): Keyword {
  return { name, docs }
}

function parseVariable ([ variable, docs ]: [ NameWithType, Docs? ]): Variable {
  // remove whitespace
  variable = variable.replace(/\s/g, '')

  const [ name, type ] = variable.split(':')

  return { name, type, docs }
}

function parseSnippet ([ name, snippet, docs ]: [ Name, CodeSnippet, Docs? ]): Snippet {
  return { name, snippet, docs }
}

function parseFunction ([ func, docs ]: [ NameWithParametersAndType, Docs? ]): Function {
  let aux: string | string[]
  let name: string
  let returns: string
  let parameters: Parameter[]

  // remove whitespace
  func = func.replace(/\s/g, '');

  // "name(param:type):returns" -> [ "name(param:type", "returns" ]
  [ aux, returns ] = func.split('):');

  // "name(param:type" -> [ "name", "param:type" ]
  [ name, aux ] = aux.split('(')

  // if the function has parameters
  if (aux !== '') {
    // "param1:type1,param2:type2" -> [ "param1:type1", "param2:type2" ]
    aux = aux.split(',')

    parameters = aux.map((parameter) => {
      const [ name, type ] = parameter.split(':')
      return { name, type }
    })
  } else {
    parameters = []
  }

  const snippet = newFunctionSnippet(name, parameters)

  return { name, docs, returns, parameters, snippet }
}

function newFunctionSnippet (name: string, parameters: Parameter[]) {
  const formattedParameters = parameters.map(parameter => `{{${parameter.name}: ${parameter.type}}}`).join(', ')
  return name + '(' + formattedParameters + ')'
}

// Mapping to CodeMirror Hints 🗺

enum HintClass {
  LocalIdentifier = 'local-identifier',
  Type = 'type',
  Preprocessor = 'preprocessor',
  Macro = 'macro',
  StorageQualifier = 'storage-qualifier',
  ParameterQualifier = 'parameter-qualifier',
  PrecisionQualifier = 'precision-qualifier',
  InvarianceQualifier = 'invariance-qualifier',
  InterpolationQualifier = 'interpolation-qualifier',
  Variable = 'variable',
  Constant = 'constant',
  Function = 'function',
  Snippet = 'snippet',
  VertexAttribute = 'vertex-attribute',
  Uniform = 'uniform'
}

function mapKeywordsToHints (keywords: Keyword[], className?: HintClass): Hint[] {
  return keywords.map(({ name, docs }) => ({
    text: name,
    displayText: name,
    docs,
    className,
    hint,
    render
  }))
}

function mapVariablesToHints (variables: Variable[], className?: HintClass): Hint[] {
  return variables.map(({ name, type, docs }) => ({
    text: name,
    displayText: `${name}: ${type}`,
    docs,
    className,
    hint,
    render
  }))
}

function mapFunctionsToHints (functions: Function[], className?: HintClass): Hint[] {
  return functions.map(({ name, returns, parameters, docs, snippet }) => {
    // Parameter[] -> param: type, param: type, ...
    const displayParameters = parameters.map(({ name, type }) => `${name}: ${type}`).join(', ')

    return {
      text: name,
      displayText: `${name}(${displayParameters}): ${returns}`,
      docs,
      className,
      snippet,
      hint,
      render
    }
  })
}

function mapSnippetsToHints (snippets: Snippet[], className?: HintClass): Hint[] {
  return snippets.map(({ name, docs, snippet }) => ({
    text: name,
    displayText: name,
    docs,
    className,
    snippet,
    hint,
    render
  }))
}

function mapLocalIdentifiersToHints (identifiers: string[], className?: HintClass): Hint[] {
  return identifiers.map(identifier => ({
    text: identifier,
    className,
    hint,
    render
  }))
}

// Available Hints 🔤

const snippetsHints: Hint[] = [
  ...mapSnippetsToHints(snippets.map(value => parseSnippet(value)), HintClass.Snippet)
]
const predefinedVariablesHints: Hint[] = [
  ...mapVariablesToHints(predefinedUniforms.map(value => parseVariable(value)), HintClass.Uniform),
  ...mapVariablesToHints(predefinedAttributes.map(value => parseVariable(value)), HintClass.VertexAttribute)
]

const glslES100Hints: Hint[] = [
  ...predefinedVariablesHints,
  ...snippetsHints,
  ...mapFunctionsToHints(glslES100.functions.map(value => parseFunction(value)), HintClass.Function),
  ...mapKeywordsToHints(glslES100.types.map(value => parseKeyword(value)), HintClass.Type),
  ...mapKeywordsToHints(glslES100.storageQualifiers.map(value => parseKeyword(value)), HintClass.StorageQualifier),
  ...mapKeywordsToHints(glslES100.parameterQualifiers.map(value => parseKeyword(value)), HintClass.ParameterQualifier),
  ...mapKeywordsToHints(glslES100.precisionQualifiers.map(value => parseKeyword(value)), HintClass.PrecisionQualifier),
  ...mapKeywordsToHints(glslES100.invarianceQualifiers.map(value => parseKeyword(value)), HintClass.InvarianceQualifier),
  ...mapKeywordsToHints(glslES100.preprocessor.map(value => parseKeyword(value)), HintClass.Preprocessor),
  ...mapKeywordsToHints(glslES100.macros.map(value => parseKeyword(value)), HintClass.Macro),
  ...mapKeywordsToHints(glslES100.others.map(value => parseKeyword(value))),
  ...mapVariablesToHints(glslES100.variables.map(value => parseVariable(value)), HintClass.Variable),
  ...mapVariablesToHints(glslES100.constants.map(value => parseVariable(value)), HintClass.Constant)
]
const glslES300Hints: Hint[] = [
  ...predefinedVariablesHints,
  ...snippetsHints,
  ...mapFunctionsToHints(glslES300.functions.map(value => parseFunction(value)), HintClass.Function),
  ...mapKeywordsToHints(glslES300.types.map(value => parseKeyword(value)), HintClass.Type),
  ...mapKeywordsToHints(glslES300.storageQualifiers.map(value => parseKeyword(value)), HintClass.StorageQualifier),
  ...mapKeywordsToHints(glslES300.parameterQualifiers.map(value => parseKeyword(value)), HintClass.ParameterQualifier),
  ...mapKeywordsToHints(glslES300.precisionQualifiers.map(value => parseKeyword(value)), HintClass.PrecisionQualifier),
  ...mapKeywordsToHints(glslES300.invarianceQualifiers.map(value => parseKeyword(value)), HintClass.InvarianceQualifier),
  ...mapKeywordsToHints(glslES300.interpolationQualifiers.map(value => parseKeyword(value)), HintClass.InterpolationQualifier),
  ...mapKeywordsToHints(glslES300.preprocessor.map(value => parseKeyword(value)), HintClass.Preprocessor),
  ...mapKeywordsToHints(glslES300.macros.map(value => parseKeyword(value)), HintClass.Macro),
  ...mapKeywordsToHints(glslES300.others.map(value => parseKeyword(value))),
  ...mapVariablesToHints(glslES300.variables.map(value => parseVariable(value)), HintClass.Variable),
  ...mapVariablesToHints(glslES300.constants.map(value => parseVariable(value)), HintClass.Constant)
]

const predefinedVariablesNames: string[] = [
  ...predefinedUniforms.map(value => parseVariable(value).name),
  ...predefinedAttributes.map(value => parseVariable(value).name)
]

// Hint support functions

function render (element: HTMLLIElement, data: Hints, cur: Hint) {
  const typeIcon = document.createElement('span')
  typeIcon.classList.add('icon')
  element.appendChild(typeIcon)

  const textSpan = document.createElement('span')
  textSpan.classList.add('display-text')
  textSpan.innerHTML = highlight(cur.displayText || cur.text, cur.indexes || [])
  element.appendChild(textSpan)
}

function hint (editor: Editor, data: Hints, selected: Hint) {
  const { from, to } = data

  if (!selected.snippet) {
    editor.replaceRange(selected.text, from, to)
  } else {
    const placeholderMarkers: TextMarker[] = []

    editor.operation(() => {
      // @ts-ignore
      const lines = selected.snippet.split('\n')

      for (let index = 0; index < lines.length; index++) {
        const line = lines[ index ]
        const isFirstLine = index === 0
        const placeholders: { text: string, offset: number }[] = []

        // find line placeholders and clean their moustaches: {{placeholder}} -> placeholder
        let replacement = line.replace(/\{\{.*?\}\}/g, (match, offset) => {
          placeholders.push({
            text: match.substring(2, match.length - 2),
            offset: offset - placeholders.length * 4
          })
          return match.substring(2, match.length - 2)
        })

        let cursor: Position

        // insert snippet line and set cursor at the beginning of the line (ready for placeholders insertion)
        if (isFirstLine) {
          editor.replaceRange(replacement, from, to)
          cursor = { line: from.line, ch: from.ch }
        } else {
          editor.replaceRange('\n' + replacement, editor.getCursor())
          cursor = { line: from.line + index, ch: 0 }
        }

        // insert line placeholders
        for (let placeholder of placeholders) {
          const from = { line: cursor.line, ch: cursor.ch + placeholder.offset }
          const to = { line: cursor.line, ch: cursor.ch + placeholder.offset + placeholder.text.length }
          const marker = insertPlaceholder(editor, from, to, placeholder.text)

          placeholderMarkers.push(marker)
        }
        editor.indentLine(cursor.line)
      }
      // set cursor after first placeholder and blur editor
      editor.setCursor(placeholderMarkers[ 0 ].find().to)
      editor.getInputField().blur()
      // done on placeholder focus but done by hand now to avoid 'active-line' jumps
      // due to the placeholder.focus() not being immediate
    })
    // @ts-ignore - by default, focus on first placeholder
    setTimeout(() => { placeholderMarkers[ 0 ].replacedWith.focus() }, 0)
  }
}

function highlight (text: string, indexes: number[] = [], openingMark: string = '<b>', closingMark: string = '</b>') {
  var highlighted = ''
  var matchesIndex = 0
  var opened = false
  var textLength = text.length
  var matchesBest = indexes

  for (var i = 0; i < textLength; ++i) {
    var char = text[i]

    if (matchesBest[matchesIndex] === i) {
      ++matchesIndex

      if (!opened) {
        opened = true
        highlighted += openingMark
      }

      if (matchesIndex === matchesBest.length) {
        highlighted += char + closingMark + text.substr(i + 1)
        break
      }
    } else {
      if (opened) {
        opened = false
        highlighted += closingMark
      }
    }
    highlighted += char
  }

  return highlighted
}

function getLocalIdentifiers (editor: Editor): string[] {
  const firstLine = editor.firstLine()
  const lastLine = editor.lastLine()
  const cursor = editor.getCursor()

  const identifiers: Set<string> = new Set()

  for (let line = firstLine; line <= lastLine; line++) {
    const tokens = editor.getLineTokens(line)

    if (line !== cursor.line) {
      // cuando la linea no corresponde a la del cursor agrego todos los identificadores
      for (let token of tokens) {
        // si son de tipo identificador y no estan entre las variables predefinidas
        if (token.type === 'identifier' && !predefinedVariablesNames.includes(token.string)) identifiers.add(token.string)
      }
    } else {
      // cuando coincide con la del cursor me fijo de no estar agregando al token que se esta tipeando
      for (let token of tokens) {
        if (!(token.start <= cursor.ch && cursor.ch <= token.end) && token.type === 'identifier') identifiers.add(token.string)
      }
    }
  }

  return Array.from(identifiers)
}

function getGLSLHintsHelper (glslHints: Hint[]) {
  return (editor: Editor, options: any) => {
    // @ts-ignore
    const cursor = editor.getCursor()
    const tokenAtCursor = editor.getTokenAt(cursor)
    const cursorFollowsWhitespace = tokenAtCursor.string.trimLeft().length === 0

    const start = cursorFollowsWhitespace ? cursor.ch : tokenAtCursor.start // si no hay caracteres previos al activar el autocomplete lo alineo con el cursor ()
    const end = tokenAtCursor.end > cursor.ch ? tokenAtCursor.end : cursor.ch

    const localIdentifiersHints: Hint[] = mapLocalIdentifiersToHints(getLocalIdentifiers(editor), HintClass.LocalIdentifier)

    // en caso de estar tipeando un atributo, solo paso la lista de identificadores
    const hints = tokenAtCursor.type === 'attribute' || tokenAtCursor.string === '.' ? localIdentifiersHints : localIdentifiersHints.concat(glslHints)
    const results = fuzzysort.go<Hint>(tokenAtCursor.string, hints, { key: 'text' })

    let list: Hint[]

    if (options.trigger === undefined && results.length === 0) {
      list = hints
    } else {
      list = results.map(({ obj, indexes }): Hint => ({ ...obj, indexes }))
    }

    const from = CodeMirror.Pos(cursor.line, start)
    const to = CodeMirror.Pos(cursor.line, end)

    return { list, from, to }
  }
}

CodeMirror.registerHelper('hint', 'glsl-es-100', getGLSLHintsHelper(glslES100Hints))
CodeMirror.registerHelper('hint', 'glsl-es-300', getGLSLHintsHelper(glslES300Hints))
