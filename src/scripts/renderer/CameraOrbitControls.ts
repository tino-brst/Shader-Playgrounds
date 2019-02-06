import { Camera } from "./Camera"

export class CameraOrbitControls {

    public enabled: boolean
    public naturalScroll: boolean
    public dragFactor: number
    public zoomFactor: number
    private dragging: boolean
    private lastX: number
    private lastY: number
    private camera: Camera
    private registerZone: HTMLElement

    constructor( camera: Camera, registerZone: HTMLElement ) {

        this.enabled       = true
        this.naturalScroll = true
        this.dragFactor    = 0.6
        this.zoomFactor    = 0.01
        this.dragging      = false
        this.lastX         = 0
        this.lastY         = 0
        this.camera        = camera
        this.registerZone  = registerZone

        const eventListenerOptions: AddEventListenerOptions = { capture: true, passive: true }

        this.registerZone.addEventListener( "wheel", ( event ) => {

this.zoom( event )

}, eventListenerOptions )
        this.registerZone.addEventListener( "mousedown", ( event ) => {

this.dragStart( event )

}, eventListenerOptions )
        document.addEventListener( "mousemove", ( event ) => {

this.dragMove( event )

}, eventListenerOptions )
        document.addEventListener( "mouseup", () => {

this.dragEnd()

}, eventListenerOptions )

    }

    private zoom( event: WheelEvent ) {

        if ( this.enabled ) {

            const value = event.deltaY * this.zoomFactor

            if ( this.naturalScroll ) {

                this.camera.zoom( - value )

            } else {

                this.camera.zoom( value )

            }

        }

    }

    private dragStart( event: MouseEvent ) {

        if ( this.enabled ) {

            const leftClick = 1

            if ( event.which === leftClick ) {

                this.dragging = true
                this.lastX    = event.clientX
                this.lastY    = event.clientY

            }

        }

    }

    private dragMove( event: MouseEvent ) {

        if ( this.enabled ) {

            if ( this.dragging ) {

                const mouseChangeX = ( event.clientX - this.lastX )
                const mouseChangeY = ( event.clientY - this.lastY )

                const degreesHorizontally = mouseChangeX * this.dragFactor
                const degreesVertically   = mouseChangeY * this.dragFactor

                this.camera.moveHorizontally( degreesHorizontally )
                this.camera.moveVertically( - degreesVertically )

                this.lastX = event.clientX
                this.lastY = event.clientY

            }

        }

    }

    private dragEnd() {

        if ( this.enabled ) {

            this.dragging = false

        }

    }

}