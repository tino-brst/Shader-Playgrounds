import { LineHandle } from "./codemirror/lib/codemirror"
import { LogEntryType } from "@/scripts/renderer/InspectorLogEntry"
import store from "@/store"
import Shader from "./Shader"

export default class ShaderLogMarker {
    private lineNumber: number
    private lineHandle: LineHandle
    private shader: Shader
    private type: LogEntryType

    constructor( shader: Shader, lineNumber: number, descriptions: string[], type: LogEntryType ) {
        this.shader = shader
        this.lineNumber = lineNumber
        this.type = type

        const marker = this.createElement( descriptions, type )
        // @ts-ignore
        this.lineHandle = this.shader.doc.setGutterMarker( lineNumber, "CodeMirror-markers", marker )
        // @ts-ignore
        this.shader.doc.addLineClass( lineNumber, "wrap", "CodeMirror-markedline-" + type )
        // @ts-ignore
        this.shader.doc.addLineClass( lineNumber, "gutter", "CodeMirror-markedline-gutter-" + type )

        // @ts-ignore
        this.lineHandle.on( "change", this.removeFromLog )
    }

    public clear() {
        // @ts-ignore
        this.shader.doc.setGutterMarker( this.lineHandle, "CodeMirror-markers", null )
        // @ts-ignore
        this.shader.doc.removeLineClass( this.lineHandle, "wrap", "CodeMirror-markedline-" + this.type )
        // @ts-ignore
        this.shader.doc.removeLineClass( this.lineHandle, "gutter", "CodeMirror-markedline-gutter-" + this.type )
        // @ts-ignore
        this.lineHandle.off( "change", this.removeFromLog )
    }

    private removeFromLog = () => { // Teje maneje con definicion de funcion como "arrow function" para mantener el contexto del this cuando se la llama y tenga un nombre para desregistrar el evento
        const shader = this.shader.type
        const line = this.lineNumber
        store.commit( "clearLineLog", { shader, line } )
        // @ts-ignore
        this.lineHandle.off( "change", this.removeFromLog )
    }

    private createElement( descriptions: string[], type: LogEntryType ) {
        const marker = document.createElement( "div" )
        marker.className = "CodeMirror-marker-" + type

        const markerInfo = document.createElement( "div" )
        markerInfo.className = "CodeMirror-marker-info"
        marker.appendChild( markerInfo )

        const fragment = document.createDocumentFragment() // render list to fragment to avoid unnecesary layout changes

        for ( let description of descriptions ) {
            let markerInfoItem = document.createElement( "span" )
            markerInfoItem.innerText = description
            fragment.appendChild( markerInfoItem )
        }

        markerInfo.appendChild( fragment )

        marker.addEventListener( "mouseenter", () => {
            markerInfo.classList.add( "visible" )
        } )
        marker.addEventListener( "mouseout", () => {
            markerInfo.classList.remove( "visible" )
        } )

        return marker
    }
}
