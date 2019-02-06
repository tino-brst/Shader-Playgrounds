export enum LogEntryType {

    Warning = "warning",
    Error = "error"

}

export class InspectorLogEntry {

    public shader: string
    public type: LogEntryType
    public line: number
    public description: string

    constructor( shader: string, type: LogEntryType, line: number, description: string ) {

        this.shader = shader
        this.type = type
        this.line = line
        this.description = description

    }

}
