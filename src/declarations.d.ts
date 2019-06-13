// __static: provides a path to your public directory in both development and production.
// Use this to read/write files in your app's public directory.
declare const __static: string

// webpack worker-loader: to integrate with TypeScript, you will need to define a custom module for the exports of your worker
declare module "worker-loader!*" {
  class WebpackWorker extends Worker {
    constructor()
  }

  export default WebpackWorker
}
