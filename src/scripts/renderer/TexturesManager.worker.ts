import Jimp from "jimp"

const worker: Worker = self as any

worker.onmessage = ( event ) => {
  const imagesPaths: string[] = event.data
  const imagesData: ImageData[] = []
  const promises: Promise <Jimp>[] = []

  for ( let path of imagesPaths ) {
    promises.push( Jimp.read( path ) )
  }

  Promise.all( promises ).then( ( images ) => {
    for ( let image of images ) {
      const buffer = new Uint8ClampedArray( image.bitmap.data )
      const imageData = new ImageData( buffer, image.bitmap.width, image.bitmap.height )
      imagesData.push( imageData )
    }

    worker.postMessage( imagesData )
  } )
}
