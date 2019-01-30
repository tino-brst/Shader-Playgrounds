import CodeMirror, { Doc, LineHandle } from "./codemirror/lib/codemirror"

export enum LogEntryType { // ⚠️ parche: estoy duplicando la definicion de LogEntryType y ShaderLog
    Error = "error",
    Warning = "warning"
}
export interface ShaderLog {
    errors: Map < number, string[] >,
    warnings: Map < number, string[] >
}

export default class Shader {
    public doc: Doc
    public log: ShaderLog
    private markedLines: Array <{ lineHandle: LineHandle, type: LogEntryType }>

    public constructor() {
        this.doc = CodeMirror.Doc( "", "glsl" )
        this.log = { errors: new Map(), warnings: new Map() }
        this.markedLines = []
    }

    public setValue( value: string ) {
        this.doc.setValue( value )
        this.doc.clearHistory()
    }

    public getValue() {
        return this.doc.getValue()
    }

    public setLog( log: ShaderLog ) {
        this.clearLog()
        this.log = log
    }

    public hasErrors() {
        return this.log.errors.size > 0
    }

    public hasWarnings() {
        return this.log.warnings.size > 0
    }

    public showErrors() {
        this.showLog( LogEntryType.Error )
    }

    public showWarnings() {
        this.showLog( LogEntryType.Warning )
    }

    private showLog( type: LogEntryType ) {
        const entries = ( type === LogEntryType.Error ) ? this.log.errors : this.log.warnings

        entries.forEach( ( descriptions, lineNumber ) => {
            this.addLineMarker( lineNumber, descriptions, type )
        } )
    }

    private clearLog() {
        for ( let { lineHandle, type } of this.markedLines ) {
            this.removeLineMarker( lineHandle, type )
        }
        this.markedLines = []
    }

    private addLineMarker( lineNumber: number, descriptions: string[], type: LogEntryType ) {
        const marker = this.newLogMarker( descriptions, type )
        // @ts-ignore
        const lineHandle = this.doc.setGutterMarker( lineNumber, "CodeMirror-markers", marker )
        // @ts-ignore
        this.doc.addLineClass( lineNumber, "wrap", "CodeMirror-markedline-" + type )
        // @ts-ignore
        this.doc.addLineClass( lineNumber, "gutter", "CodeMirror-markedline-gutter-" + type )

        // @ts-ignore
        lineHandle.on( "change", ( lineHandle: LineHandle ) => {
            this.removeLineMarker( lineHandle, type )
        } )

        this.markedLines.push( { lineHandle, type } )
    }

    private removeLineMarker( lineHandle: LineHandle, type: LogEntryType ) {
        // @ts-ignore
        this.doc.setGutterMarker( lineHandle, "CodeMirror-markers", null )
        // @ts-ignore
        this.doc.removeLineClass( lineHandle, "wrap", "CodeMirror-markedline-" + type )
        // @ts-ignore
        this.doc.removeLineClass( lineHandle, "gutter", "CodeMirror-markedline-gutter-" + type )
    }

    private newLogMarker( descriptions: string[], type: LogEntryType ): HTMLElement {
        const marker = document.createElement( "div" )
        marker.className = "CodeMirror-marker-" + type

        const markerTooltip = document.createElement( "ul" )
        markerTooltip.className = "CodeMirror-marker-tooltip"
        marker.appendChild( markerTooltip )

        for ( let description of descriptions ) {
            const descriptionListItem = document.createElement( "li" )
            descriptionListItem.textContent = description
            markerTooltip.appendChild( descriptionListItem )
        }

        marker.addEventListener( "mouseenter", () => {
            markerTooltip.classList.add( "visible" )
        } )
        marker.addEventListener( "mouseout", () => {
            markerTooltip.classList.remove( "visible" )
        } )

        return marker
    }
}
