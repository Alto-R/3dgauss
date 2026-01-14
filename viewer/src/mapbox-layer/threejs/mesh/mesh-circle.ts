import { AdditiveBlending, CircleGeometry, Color, ColorRepresentation, DoubleSide, Material, Mesh, ShaderMaterial } from 'three';

import type { Feature, Point } from 'geojson';
import { getFeatureData, SourceInfo, type FeatureData } from '../geometry/geojson';

import { mergeGeometries } from '../geometry/BufferGeometryUtils';

export type CircleMaterialType = 'ripple' |'spread' | 'radar';

export type CircleOptions = {
    material?: Material | CircleMaterialType | undefined;
    color?: ColorRepresentation | undefined;
    opacity?: number | undefined;

    radius?: number | undefined;
    segments?: number | undefined;
    num?: number | undefined;
    speed?: number | undefined;
    followWidth?: number | undefined;

    getCircleRadius?: (feature: Feature) => number | number | undefined;
};

export function createCircleGeometryFromPoint(point: Point, radius: number, segments: number): CircleGeometry {
    const center = point.coordinates;
    const geometry = new CircleGeometry(radius, segments);
    geometry.translate(center[0], center[1], center.length > 2 ? center[2] : 0);
    return geometry;
}

export function createCircleGeometry(points: { geometry: Point; __source: SourceInfo }[], getCircleRadius, segments) {
    const geometries = [];
    points.forEach((point) => {
        const feature = point.__source.object;
        const radius = getFeatureData(getCircleRadius, feature);

        const geometry = createCircleGeometryFromPoint(point.geometry, radius, segments);
        geometries.push(geometry);
    });

    const geometry = mergeGeometries(geometries);
    return geometry;
}

export function createRadarShaderMaterial(options: CircleOptions): ShaderMaterial {
    const color = new Color(options.color !== undefined ? options.color : 0xff0000);
    const opacity = options.opacity !== undefined ? options.opacity : 0.8;
    const radius = options.radius !== undefined ? options.radius : 1;
    const followWidth = options.followWidth !== undefined ? options.followWidth : 0.2;
    const speed = options.speed !== undefined ? options.speed : 1;

    const shader = {
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        depthTest: true,
        vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv.x = (uv.x - 0.5) * 2.0;
            vUv.y = (uv.y - 0.5) * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
        fragmentShader: `
        uniform float radius;     
        uniform float time;            
        uniform float speed; 
        uniform float followWidth; 
        varying vec2 vUv;
        uniform vec3 color;
        uniform float opacity;
        float calcAngle(vec2 oFrag){
            float fragAngle;
            const vec2 ox = vec2(1,0);
            float dianji = oFrag.x * ox.x + oFrag.y*ox.y;
            float oFrag_length = length(oFrag); // length是内置函数
            float ox_length = length(ox); // length是内置函数
            float yuxian = dianji / (oFrag_length * ox_length);
            fragAngle = acos(yuxian);
            fragAngle = degrees(fragAngle);
            if(oFrag.y > 0.0) {
                fragAngle = -fragAngle + 360.0;
            }
            float scanAngle = (time * speed * 0.25 - floor(time * speed * 0.25)) * 360.0;
            float angle = scanAngle - fragAngle;
            if(angle < 0.0){
                angle = angle + 360.0;
            }
            return angle;
        }
        void main() {
            if(length(vUv) == 0.0 || length(vUv) > 1.0){
                gl_FragColor = vec4( color, 0.0 );
            } else {
                float angle = calcAngle(vUv);
                if(angle < followWidth * 360.0){
                    // 尾焰区域
                    float ap =  1.0 - angle / (followWidth * 360.0); 
                    gl_FragColor = vec4( color, ap * opacity );  
                } else {
                    // 其他位置的像素均为透明
                    gl_FragColor = vec4( color, 0.0 ); 
                }
            }
        }
    `,
        uniforms: {
            speed: { value: speed },
            radius: { value: radius },
            time: { value: 0 },
            followWidth: { value: followWidth },
            color: { value: new Color(color) },
            opacity: { value: opacity },
        },
    };

    const material = new ShaderMaterial(shader);

    return material;
}

export function createRippleShaderMaterial(options: CircleOptions): ShaderMaterial {
    const color = new Color(options.color !== undefined ? options.color : 0xff0000);
    const opacity = options.opacity !== undefined ? options.opacity : 0.8;
    const radius = options.radius !== undefined ? options.radius : 1;
    const num = options.num !== undefined ? options.num : 8;
    const speed = options.speed !== undefined ? options.speed : 1;

    const shader = {
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        depthTest: true,
        vertexShader: `
        varying vec2 vUv;
        varying float uvLength;
        void main() {
            vUv.x = (uv.x - 0.5) * 2.0;
            vUv.y = (uv.y - 0.5) * 2.0;
            uvLength = length(vUv);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
        fragmentShader: `
        uniform float radius;     
        uniform float time;            
        uniform float speed; 
        uniform float num; 
        varying vec2 vUv;
        varying float uvLength;
        uniform vec3 color;
        uniform float opacity;
        #define PI 3.14159265
        void main() {
            vec4 fragColor = vec4(color, 0.0);
            float sin = sin((uvLength - time * speed / num) * PI * 2.0 * num);
            float high = 0.999;
            float medium = 0.95;
            
            if (sin > high) {
                fragColor = vec4(mix(vec3(.8, 1., 1.), color, (1. - sin) / (1. - high)), 1.);
            } else if(sin > medium) {
                fragColor = vec4(color, mix(1., 0., 1.-(sin - medium) / (high - medium)));
            } else {
                fragColor = vec4(color, 0.);
            }
            gl_FragColor = vec4(fragColor.rgb, fragColor.a * opacity * (1. - uvLength));
        }
    `,
        uniforms: {
            speed: { value: speed },
            radius: { value: radius },
            time: { value: 0 },
            num: { value: num },
            color: { value: new Color(color) },
            opacity: { value: opacity },
        },
    };

    const material = new ShaderMaterial(shader);

    return material;
}

export function createSpreadShaderMaterial(options: CircleOptions): ShaderMaterial {
    const color = new Color(options.color !== undefined ? options.color : 0xff0000);
    const opacity = options.opacity !== undefined ? options.opacity : 0.8;
    const radius = options.radius !== undefined ? options.radius : 1;
    const speed = options.speed !== undefined ? options.speed : 1;

    const shader = {
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
        depthTest: true,
        vertexShader: `
        varying vec2 vUv;
        varying float uvLength;
        void main() {
            vUv.x = (uv.x - 0.5) * 2.0;
            vUv.y = (uv.y - 0.5) * 2.0;
            uvLength = length(vUv);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
        fragmentShader: `
        uniform float radius;     
        uniform float time;            
        uniform float speed; 
        varying vec2 vUv;
        varying float uvLength;
        uniform vec3 color;
        uniform float opacity;
        #define PI 3.14159265
        void main() {
            vec4 fragColor = vec4(color, 0.0);
            float timeDelta = (time * speed - floor(time * speed));
            const float innerLength = 0.2;
            const float outerLength = 0.05;
            float midLength = timeDelta * (1.0 - innerLength - outerLength) + innerLength;
            float maxLength = clamp(midLength + outerLength, 0.0, 1.0);

            
            float alpha1 = 0.0;
            float alpha2 = sin((timeDelta + 0.7) * PI * 0.5);
            if (uvLength > maxLength) {
                alpha1 = 0.0;
            } else if (uvLength > midLength) {
                alpha1 = (maxLength - uvLength) / ( maxLength - midLength);
            } else {
                alpha1 = uvLength / midLength;
            }
            float alpha = alpha1 * alpha2;
            fragColor = vec4(color, alpha);
            gl_FragColor = vec4(fragColor.rgb, fragColor.a * opacity);
        }
    `,
        uniforms: {
            speed: { value: speed },
            radius: { value: radius },
            time: { value: 0 },
            color: { value: new Color(color) },
            opacity: { value: opacity },
        },
    };

    const material = new ShaderMaterial(shader);

    return material;
}

export class CircleMesh extends Mesh {
    _startTime: number;
    constructor(geometry, options: CircleOptions = {}) {
        super(geometry);

        let material;

        if (options.material instanceof Material) {
            material = options.material;
        } else if (options.material === 'ripple') {
            material = createRippleShaderMaterial(options);
        } else if (options.material === 'radar') {
            material = createRadarShaderMaterial(options);
        } else if (options.material === 'spread') {
            material = createSpreadShaderMaterial(options);
        } else {
            material = createRippleShaderMaterial(options);
        }

        this.material = material;
        this._startTime = 0;
    }

    updateSceneTime(time: number, delta: number, scene) {
        if (this._startTime === 0) this._startTime = time;
        const deltaTime = time - this._startTime;
        if (this.material instanceof ShaderMaterial) {
            (this.material as ShaderMaterial).uniforms['time'].value = deltaTime / 1000;
        }
    }
}

export function createCircleMesh(featureData: FeatureData, options: CircleOptions) {
    const { geometries } = featureData;
    const { getCircleRadius, radius, segments = 32 } = options;

    const features = geometries.pointFeatures;

    const geometry = createCircleGeometry(features, getCircleRadius === undefined ? radius : getCircleRadius, segments);
    const mesh = new CircleMesh(geometry, options);
    return mesh;
}
