import { Vector2, Texture, ColorRepresentation, Vector3, Side } from 'three';

import type { FeatureData } from '../geometry/geojson';

import { createPolygonsGeometry } from './mesh-polygon';
import { Water } from './Water';

export type WaterOptions = {
    color?: ColorRepresentation | undefined;
    textureWidth?: number | undefined;
    textureHeight?: number | undefined;
    clipBias?: number | undefined;
    flowDirection?: Vector2 | undefined;
    flowSpeed?: number | undefined;
    reflectivity?: number | undefined;
    scale?: number | undefined;
    shader?: object | undefined;
    flowMap?: Texture | undefined;
    normalMap0?: Texture | undefined;
    normalMap1?: Texture | undefined;
    up?: Vector3 | undefined;
    alpha?: number | undefined;

    waterColor?: ColorRepresentation | undefined;
    eye?: Vector3 | undefined;
    distortionScale?: number | undefined;
    side?: Side | undefined;
    fog?: boolean | undefined;
    sunColor?: ColorRepresentation | undefined;
    sunDirection?: Vector3 | undefined;
    waterNormals?: Texture | undefined;
    time?: number | undefined;
};

export function createWaterMesh(featureData: FeatureData, options: WaterOptions) {
    const { geometries } = featureData;
    const waterGeometry = createPolygonsGeometry(geometries.polygonFeatures);

    options.flowDirection = new Vector2(1, 1);
    options.up = new Vector3(0, 1, 0);
    const water = new Water(waterGeometry, options);
    return water;
}
