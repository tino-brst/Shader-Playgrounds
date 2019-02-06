/* eslint-disable */

export default `uniform mat4 modelViewProjectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 normalMatrix;

attribute vec4 vertexPosition;
attribute vec3 vertexNormal;

varying vec4 fragmentPosition;
varying vec3 fragmentNormal;

void main() {
    fragmentPosition = modelViewMatrix * vertexPosition;
    fragmentNormal = normalize(vec3(normalMatrix * vec4(vertexNormal, 0.0)));
    gl_Position = modelViewProjectionMatrix * vertexPosition;
}`
