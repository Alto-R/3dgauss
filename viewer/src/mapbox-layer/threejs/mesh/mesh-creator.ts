import { Object3D } from 'three';

import type { FeatureData } from '../geometry/geojson';

import { createBuildingMesh, BuildingOptions } from './mesh-building';
import { createLineMesh, LineOptions } from './mesh-line';
import { createPolygonMesh, PolygonOptions } from './mesh-polygon';
import { createWaterMesh, WaterOptions } from './mesh-water';
import { createFenceMesh, FenceOptions } from './mesh-fence';
import { CircleOptions, createCircleMesh } from './mesh-circle';

import type { GeoJSON, Geometry } from 'geojson';
import { createTubeMesh, TubeOptions } from './mesh-tube';

export type MeshBaseOptions = {
    id: string;
    data: string | GeoJSON | Geometry[];
    callback?: (object: Object3D, featureData: FeatureData) => void;
};

export type WaterMeshOptions = { type: 'water' } & WaterOptions;
export type LineMeshOptions = { type: 'line' } & LineOptions;
export type PolygonMeshOptions = { type: 'polygon' } & PolygonOptions;
export type BuildingMeshOptions = { type: 'building' } & BuildingOptions;
export type FenceMeshOptions = { type: 'fence' } & FenceOptions;
export type CircleMeshOptions = { type: 'circle' } & CircleOptions;
export type TubeMeshOptions = { type: 'tube' } & TubeOptions;

export type MeshOptions = MeshBaseOptions & (WaterMeshOptions | LineMeshOptions | PolygonMeshOptions | BuildingMeshOptions | FenceMeshOptions | CircleMeshOptions | TubeMeshOptions);

const createMeshMap = {
    water: createWaterMesh,
    line: createLineMesh,
    polygon: createPolygonMesh,
    building: createBuildingMesh,
    fence: createFenceMesh,
    circle: createCircleMesh,
    tube: createTubeMesh,
};

export default class MeshCreator {
    static supportMeshLayer(type: string): boolean {
        return createMeshMap.hasOwnProperty(type);
    }

    static create(featureData: FeatureData, options: MeshOptions): Object3D | null {
        // todo: create mesh
        const { id, data, type, callback, ...restOptions } = options;
        if (!createMeshMap.hasOwnProperty(type)) {
            console.warn(`Mesh type ${type} is not supported`);
            return null;
        }

        const createMeshFunc = createMeshMap[type];
        if (createMeshFunc) {
            // @ts-ignore
            return createMeshFunc(featureData, restOptions);
        }
        return null;
    }
}
