uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 vertexPosition;
attribute vec3 vertexNormal;

varying vec3 fragmentColor;

void main() {
	fragmentColor = vertexNormal;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1);
}