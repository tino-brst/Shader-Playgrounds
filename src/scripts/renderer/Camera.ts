import { glMatrix, mat4, vec3 } from "gl-matrix"
import { GraphicObject } from "./GraphicObject"

interface ISphericalCoordinates {
  radius: number, // distancia al centro
  theta: number,  // angulo horizontal (desde el eje x+ -> z+)
  phi: number     // angulo vertical (desde el eje y+)
}
interface ICameraOptions {
  position?: vec3,
  target?: vec3,
  up?: vec3,
  fov?: number,
  aspect?: number,
  near?: number,
  far?: number
  targetRadius?: number
}

export class Camera extends GraphicObject {
  public viewMatrix: mat4
  public projectionMatrix: mat4

  private sphericalPosition: ISphericalCoordinates
  private target: vec3 | [ number, number, number ]
  private up: vec3 | [ number, number, number ]

  private fov: number
  private aspect: number
  private near: number
  private far: number

  private targetRadius: number  // para evitar clipping del target al intersectarse con el plano 'far' del frustum

  constructor( options?: ICameraOptions ) {
    super()

    options = options || {}

    this.sphericalPosition = { radius: 0, theta: 0, phi: 0 }
    this.fov               = glMatrix.toRadian( options.fov || 45 )
    this.target            = options.target || vec3.fromValues( 0, 0, 0 )
    this.aspect            = options.aspect || 1
    this.near              = options.near || 0.1
    this.far               = options.far || 25
    this.up                = options.up || vec3.fromValues( 0, 1, 0 )
    this.targetRadius      = options.targetRadius || 2

    this.viewMatrix = mat4.create()
    this.projectionMatrix = mat4.create()

    this.updateModelMatrix()
    this.updateViewMatrix()
    this.updateProjectionMatrix()
  }

  // 👥 Metodos Publicos

  public setPosition( x: number, y: number, z: number ) {
    super.setPosition( x, y, z )
    this.updateSphericalPosition()
    this.updateViewMatrix()

    return this
  }

  public setAspect( value: number ) {
    this.aspect = value
    this.updateProjectionMatrix()

    return this
  }

  public zoom( value: number ) {
    this.sphericalPosition.radius = this.getAdjustedRadius( this.sphericalPosition.radius - value )
    this.updatePosition()
    this.updateViewMatrix()

    return this
  }

  public moveHorizontally( degrees: number ) {
    this.sphericalPosition.theta = this.getAdjustedTheta( this.sphericalPosition.theta + degrees )
    this.updatePosition()
    this.updateViewMatrix()

    return this
  }

  public moveVertically( degrees: number ) {
    this.sphericalPosition.phi = this.getAdjustedPhi( this.sphericalPosition.phi + degrees )
    this.updatePosition()
    this.updateViewMatrix()

    return this
  }

  // ✋🏼 Metodos Privados

  private updateSphericalPosition() {
    const x = this.position[ 0 ]
    const y = this.position[ 1 ]
    const z = this.position[ 2 ]

    const toDegrees = 360 / ( 2 * Math.PI )

    const radius = Math.sqrt( x * x + y * y + z * z )
    const theta  = Math.atan2( z, x ) * toDegrees
    const phi    = Math.acos( y / radius ) * toDegrees

    this.sphericalPosition = { radius, theta, phi }
  }

  private updatePosition() {
    const radius = this.sphericalPosition.radius
    const theta  = glMatrix.toRadian( this.sphericalPosition.theta )
    const phi    = glMatrix.toRadian( this.sphericalPosition.phi )

    const x = radius * Math.sin( phi ) * Math.cos( theta )
    const y = radius * Math.cos( phi )
    const z = radius * Math.sin( phi ) * Math.sin( theta )

    super.setPosition( x, y, z )
  }

  private updateViewMatrix() {
    mat4.lookAt( this.viewMatrix, this.position, this.target, this.up )
  }

  private updateProjectionMatrix() {
    mat4.perspective( this.projectionMatrix, this.fov, this.aspect, this.near, this.far )
  }

  private getAdjustedRadius( value: number ): number {
    return this.limitToRange( value, this.near, this.far - this.targetRadius )
  }

  private getAdjustedTheta( value: number ): number {
    return ( value >= 0 ) ? value % 360 : 360 + value
  }

  private getAdjustedPhi( value: number ): number {
    return this.limitToRange( value, 1, 180 )
  }

  private limitToRange( value: number, min: number, max: number ): number {
    return Math.max( Math.min( value, max ), min )
  }
}
