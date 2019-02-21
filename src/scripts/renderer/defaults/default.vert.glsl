uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 vertexPosition;

void main() {

	gl_Position = projectionMatrix * modelViewMatrix * vec4( vertexPosition, 1 );

}