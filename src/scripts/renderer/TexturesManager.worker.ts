import Jimp from "jimp"

// Worker.ts
const ctx: Worker = self as any

// Respond to message from parent thread
ctx.onmessage = ( event ) => {
    Jimp.read( event.data ).then( ( image ) => {
        const data = new Uint8ClampedArray( image.bitmap.data )
        const imageData = new ImageData( data, image.bitmap.width, image.bitmap.height )
        ctx.postMessage( imageData )
    } )
}
