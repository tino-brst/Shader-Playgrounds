import { Box } from "./primitives/Box"
import { Geometry } from "./geometry/Geometry"
import { IcoSphere } from "./primitives/IcoSphere"
// import teapotData from "@/assets/models/teapot.obj"

interface IGeometryInfo {
    name: string
    locked: boolean
}

export class GeometriesManager {
    private defaultGeometries: Map < string, Geometry >
    private userGeometries: Map < string, Geometry >

    constructor() {
        this.defaultGeometries = new Map()
        this.userGeometries    = new Map()

        this.initDefaultGeometries()
    }

    // 👥  Metodos Publicos

    public getAvailableGeometriesInfo() {
        const geometriesInfo: IGeometryInfo[] = []

        for ( const [ name, geometry ] of this.defaultGeometries ) {
            geometriesInfo.push( { name, locked: true } )
        }

        for ( const [ name, geometry ] of this.userGeometries ) {
            geometriesInfo.push( { name, locked: false } )
        }

        return geometriesInfo
    }

    public get( name: string ) {
        return this.defaultGeometries.get( name ) || this.userGeometries.get( name )
    }

    public add( data: string, name?: string ) {
        const newGeometryName = this.getAvailableName( name )
        const newGeometry = new Geometry( data )

        this.userGeometries.set( newGeometryName, newGeometry )
    }

    public delete( name: string ) {
        return this.userGeometries.delete( name )
    }

    // ✋🏼  Metodos Privados

    private getAvailableName( name: string = "untitled" ) {
        let availableName = name

        availableName.trim()
        availableName.toLowerCase()

        if ( availableName === "" ) {
            availableName = "untitled"
        }

        if ( this.userGeometries.has( availableName ) || this.defaultGeometries.has( availableName ) ) {
            const separator = " "

            let index = 1

            while ( this.userGeometries.has( availableName + separator + index ) ) {
                index ++
            }

            availableName += separator + index
        }

        return availableName
    }

    private initDefaultGeometries() {
        this.defaultGeometries.set( "cube", new Box() )
        this.defaultGeometries.set( "icosphere", new IcoSphere() )
        // this.defaultGeometries.set( "teapot", new Geometry( teapotData ) )
    }
}
