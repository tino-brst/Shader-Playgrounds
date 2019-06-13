import fs from "fs-jetpack"
import path from "path"
import cube from "./defaults/cube.obj"
import { Geometry } from "./geometry/Geometry"

const MODELS_FOLDER = "/assets/models"
const MODELS_EXTENSION = "obj"

export class GeometriesManager {
  private geometries: Map < string, Geometry >

  constructor( onGeometriesLoaded: () => void ) {
    this.geometries = new Map()

    this.loadDefaultGeometry( "cube", cube )
    this.loadAvailableGeometries( onGeometriesLoaded )
  }

  // 👥  Metodos Publicos

  public getAvailableGeometries() {
    return this.geometries
  }

  public getGeometry( name: string ) {
    return this.geometries.get( name )
  }

  // ✋🏼  Metodos Privados

  private getAvailableName( name: string = "untitled" ) {
    let availableName = name

    availableName.trim()
    availableName.toLowerCase()

    if ( availableName === "" ) {
      availableName = "untitled"
    }

    if ( this.geometries.has( availableName ) ) {
      const separator = " "
      let index = 1

      while ( this.geometries.has( availableName + separator + index ) ) {
        index ++
      }

      availableName += separator + index
    }

    return availableName
  }

  private loadDefaultGeometry( name: string, modelData: string ) {
    const modelName = this.getAvailableName( name )
    const modelGeometry = new Geometry( modelData )
    this.geometries.set( modelName, modelGeometry )
  }

  private loadAvailableGeometries( onGeometriesLoaded: () => void ) {
    const availableModelsPaths = fs.find( __static + MODELS_FOLDER, {
      matching: "*." + MODELS_EXTENSION,
      files: true,
      directories: false,
      recursive: false
    } )

    const promises: Promise <string>[] = []

    for ( let modelPath of availableModelsPaths ) {
      promises.push( fs.readAsync( modelPath ) as Promise <string> )
    }

    Promise.all( promises ).then( ( modelsData ) => {
      // console.time( "models loaded" ) ⏱
      for ( let index = 0; index < modelsData.length; index ++ ) {
        const modelPath = availableModelsPaths[ index ]
        const modelName = this.getAvailableName( path.basename( modelPath, "." + MODELS_EXTENSION ) )
        const modelGeometry = new Geometry( modelsData[ index ] )
        this.geometries.set( modelName, modelGeometry )
      }
      // console.timeEnd( "models loaded" ) ⏱
      onGeometriesLoaded()
    } )
  }
}
