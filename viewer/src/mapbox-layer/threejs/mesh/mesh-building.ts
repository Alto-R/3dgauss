import { Texture, ColorRepresentation, Mesh, Color, EdgesGeometry } from 'three';

import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';

import type { Feature, Polygon } from 'geojson';
import { getFeatureData, type FeatureData, type SourceInfo } from '../geometry/geojson';

import { createExtrudeGeometry, createShapeFromPolygon } from './mesh-polygon';
import { Extrude3Geometry } from '../geometry/Extrude3Geometry';
import { mergeGeometriesByGroups } from '../geometry/BufferGeometryUtils';

import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import MeshUtils from './mesh-utils';
import { ColorRampParams, renderColorRamp } from '../utils/color-utils';

export type BuildingOptions = {
    color?: ColorRepresentation | undefined;
    opacity?: number | undefined;
    getElevation?: (feature: Feature) => number | number | undefined;
    getElevationBase?: (feature: Feature) => number | number | undefined;
    baseMaterial?: string | undefined;
    enableEdge?: boolean | undefined;
    gradient?: boolean | undefined;
    gradientColor?: ColorRepresentation | ColorRepresentation[] | undefined;
    gradientHeightMax?: number | undefined;
    gradientHeightMin?: number | undefined;
    lightColor?: ColorRepresentation | undefined;
    lightCircleTime?: number | undefined;
    lightBorderWidth?: number | undefined;
    lightMixRate?: number | undefined;
    material?: {
        top?: {
            color?: ColorRepresentation | undefined;
            opacity?: number | undefined;
            texture?: Texture | undefined;
            transparent?: boolean | undefined;
        };
        wall?: {
            color?: ColorRepresentation | undefined;
            opacity?: number | undefined;
            texture?: Texture | undefined;
            transparent?: boolean | undefined;
        };
        edge?: {
            color?: ColorRepresentation | undefined;
            opacity?: number | undefined;
            width?: number | undefined;
        };
    };
};

export function createBuildingGeometry(polygons: { geometry: Polygon; __source: SourceInfo }[], getElevation, getElevationBase) {
    const geometries = [];
    polygons.forEach((polygon) => {
        const feature = polygon.__source.object;
        const elevation = getFeatureData(getElevation, feature);
        const elevationBase = getFeatureData(getElevationBase, feature);

        const geometry = createExtrudeGeometry(polygon.geometry, elevation, elevationBase);
        geometries.push(geometry);
    });

    const geometry = mergeGeometriesByGroups(geometries);
    return geometry;
}

export class BuildingMesh extends Mesh {
    _startTime: number;
    constructor(geometry, options: BuildingOptions = {}) {
        super(geometry);

        const baseMaterial = MeshUtils.getMeshMaterial(options?.baseMaterial);

        if (options?.gradient) {
            let gradientColors: Color[] = [];
            if (Array.isArray(options?.gradientColor)) {
                gradientColors = options.gradientColor.map((element) => {
                    return new Color(element);
                });
            } else {
                const wallColor = options?.material?.wall?.color || options?.color;
                const topColor = options?.gradientColor || options?.material?.top?.color || options?.color;
                gradientColors.push(new Color(wallColor));
                gradientColors.push(new Color(topColor));
            }

            const colorRampParams: ColorRampParams = { colors: gradientColors };

            const gradientTexture = renderColorRamp(colorRampParams);
            const vertexShader = `
        varying float vHeight;
        void main() {
          vHeight = position.z;
        }
      `;

            const fragmentShader = `
        varying float vHeight;

        uniform float uTime;
        uniform float uLightCircleTime;
        uniform float uLightBorderWidth;
        uniform float uLightMixRate;
        uniform vec3 uLightColor;

        uniform float uGradientHeightMax;
        uniform float uGradientHeightMin;
				uniform sampler2D uGradientSampler;
        void main() {

          bool isLight = false;
          float refHeight = (vHeight - uGradientHeightMin) / (uGradientHeightMax - uGradientHeightMin);

          vec3 gradientColor = texture2D( uGradientSampler, vec2(refHeight, 0.5) ).xyz;
          
          if(uLightBorderWidth > 0.0 && uLightCircleTime > 0.0) {
            float sinRate = sin(uTime / uLightCircleTime * PI * 2.0);
            if ((refHeight > sinRate)  && 
              (refHeight < sinRate + uLightBorderWidth ) )
            {
              csm_DiffuseColor.xyz = mix(uLightColor, gradientColor, uLightMixRate);
              isLight = true;
            } 
          }
          
          if (!isLight) {
            csm_DiffuseColor.xyz = gradientColor;
          }

        }
      `;
            const gradientHeightMax = options?.gradientHeightMax ?? 100.0;
            const gradientHeightMin = options?.gradientHeightMin ?? 0.0;
            const lightBorderWidth = options?.lightBorderWidth ?? 0.01;
            const lightCircleTime = options?.lightCircleTime ?? 10.0;
            const lightColor = options?.lightColor ?? 0xffffff;
            const lightMixRate = options?.lightMixRate ?? 0.0;

            const materialTop = new CustomShaderMaterial({
                baseMaterial: baseMaterial,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                color: options?.material?.top?.color || options?.color,
                opacity: options?.material?.top?.opacity ?? options?.opacity ?? 1.0,
                map: options?.material?.top?.texture || null,
                transparent: options?.material?.top?.transparent || (options.opacity && options.opacity < 1),
                uniforms: {
                    uTime: { value: 0 },
                    uLightCircleTime: { value: lightCircleTime },
                    uLightBorderWidth: { value: lightBorderWidth },
                    uLightColor: { value: new Color(lightColor) },
                    uLightMixRate: { value: lightMixRate },
                    uGradientHeightMax: { value: gradientHeightMax },
                    uGradientHeightMin: { value: gradientHeightMin },
                    uGradientSampler: { value: gradientTexture },
                },
            });

            const materialWall = new CustomShaderMaterial({
                baseMaterial: baseMaterial,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                color: options?.material?.wall?.color || options?.color,
                opacity: options?.material?.wall?.opacity ?? options?.opacity ?? 1.0,
                map: options?.material?.wall?.texture || null,
                transparent: options?.material?.wall?.transparent || (options.opacity && options.opacity < 1),
                uniforms: {
                    uTime: { value: 0 },
                    uLightCircleTime: { value: lightCircleTime },
                    uLightBorderWidth: { value: lightBorderWidth },
                    uLightColor: { value: new Color(lightColor) },
                    uLightMixRate: { value: lightMixRate },
                    uGradientHeightMax: { value: gradientHeightMax },
                    uGradientHeightMin: { value: gradientHeightMin },
                    uGradientSampler: { value: gradientTexture },
                },
            });
            this.material = [materialTop, materialWall];
        } else {
            const materialTop = new baseMaterial({
                color: options?.material?.top?.color || options?.color,
                opacity: options?.material?.top?.opacity ?? options?.opacity ?? 1.0,
                map: options?.material?.top?.texture || null,
                transparent: options?.material?.top?.transparent || (options.opacity && options.opacity < 1),
            });

            const materialWall = new baseMaterial({
                color: options?.material?.wall?.color || options?.color,
                opacity: options?.material?.wall?.opacity ?? options?.opacity ?? 1.0,
                map: options?.material?.wall?.texture || null,
                transparent: options?.material?.wall?.transparent || (options.opacity && options.opacity < 1),
            });
            this.material = [materialTop, materialWall];
        }

        if (options?.enableEdge) {
            const color = options?.material?.edge?.color ?? options?.color;
            const opacity = options?.material?.edge?.opacity ?? options?.opacity ?? 1.0;
            const width = options?.material?.edge?.width ?? 1.0;

            const edges = new EdgesGeometry(geometry);
            let wideEdgesGeometry = new LineSegmentsGeometry();
            let wideEdges = wideEdgesGeometry.fromEdgesGeometry(edges);
            let edgesmaterial = new LineMaterial({
                color: color,
                linewidth: width,
                opacity: opacity,
                transparent: true,
                depthWrite: true,
                depthTest: true,
            });
            edgesmaterial.resolution.set(window.innerWidth, window.innerHeight);
            const edgesMesh = new LineSegments2(wideEdges, edgesmaterial);
            edgesMesh.name = this.name + '-edges';
            this.add(edgesMesh);
        }

        this._startTime = 0;
    }

    updateSceneTime(time: number, delta: number, scene) {
        if (this._startTime === 0) this._startTime = time;
        const deltaTime = time - this._startTime;
        if (this.material instanceof CustomShaderMaterial) {
            (this.material as CustomShaderMaterial).uniforms['uTime'].value = deltaTime / 1000;
        } else if (Array.isArray(this.material)) {
            this.material.forEach((material) => {
                if (material instanceof CustomShaderMaterial) {
                    (material as CustomShaderMaterial).uniforms['uTime'].value = deltaTime / 1000;
                }
            });
        }
    }
}

export function createBuildingMesh(featureData: FeatureData, options: BuildingOptions) {
    const { geometries } = featureData;
    const { getElevation, getElevationBase } = options;

    const geometry = createBuildingGeometry(geometries.polygonFeatures, getElevation, getElevationBase);

    const mesh = new BuildingMesh(geometry, options);
    return mesh;
}
