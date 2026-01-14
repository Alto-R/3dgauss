import { Object3D } from 'three';
import { loadGeojson, projectFeatureData } from '../geometry/geojson';
import type { FeatureData } from '../geometry/geojson';
import { LngLatLike } from 'mapbox-gl';

import type { MeshOptions } from './mesh-creator';
export type { MeshOptions };
import MeshCreator from './mesh-creator';
import { SceneObject } from '../object/scene-object';
import { ThreejsSceneLayer } from '../threejs-scene';

export class MeshObject extends SceneObject {
    _options: MeshOptions;
    _featrueData: FeatureData | undefined;
    _meshObject: Object3D | undefined;

    constructor(options: MeshOptions) {
        super();
        this._options = options;
        this._featrueData = undefined;
        this._meshObject = undefined;
    }

    override updateSceneTransform() {
        if (this._featrueData == undefined) return;

        const dataCenter: LngLatLike = [this._featrueData.centroid[0], this._featrueData.centroid[1]];
        const meshToWorldOffsetInMeters = this._scene.toScenePosition(dataCenter);

        this.position.set(meshToWorldOffsetInMeters.x, meshToWorldOffsetInMeters.y, meshToWorldOffsetInMeters.z);
        this.updateMatrixWorld(true);
    }

    override updateSceneTime(time: number, delta: number) {
        if (this._meshObject) {
            // @ts-expect-error
            if (this._meshObject.updateSceneTime) {
                // @ts-expect-error
                this._meshObject.updateSceneTime(time, delta, this._scene);
            }
        }
    }

    override addToScene(scene: ThreejsSceneLayer): this {
        loadGeojson(this._options.data).then((featureData) => {
            this._featrueData = featureData;

            const dataCenter: LngLatLike = [this._featrueData.centroid[0], this._featrueData.centroid[1]];
            projectFeatureData(this._featrueData, dataCenter);

            this._scene = scene;
            this.updateSceneTransform();

            const mesh = MeshCreator.create(this._featrueData, this._options);
            if (mesh) {
                this._meshObject = mesh;
                this.add(mesh);
                if (this._options.callback) {
                    this._options.callback(mesh, this._featrueData);
                }
            }
        });

        return super.addToScene(scene);
    }

    override removeFromScene(): this {
        if (this._meshObject) {
            this.remove(this._meshObject);
            this._meshObject = undefined;
        }
        return super.removeFromScene();
    }
}
