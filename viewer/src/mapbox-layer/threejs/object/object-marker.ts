import { Vector3 } from 'three';
import { Position } from '../threejs-types';
import { SceneObject } from './scene-object';
import { ThreejsSceneLayer } from '../threejs-scene';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export type MarkerOptions = {
    id: string;
    data: {
        element?: HTMLElement;
        position?: Position;
        point?: Vector3;
    }[];
};

export class MarkerObject extends SceneObject {
    _options: MarkerOptions;
    _markers: CSS2DObject[];

    constructor(options: MarkerOptions) {
        super();
        this._options = options;
        this._parentObjectName = 'ObjectMarkerGroup';
        this._markers = [];
    }

    override updateSceneTransform() {
        if (this._markers.length != this._options.data.length) return;

        this._options.data.forEach((marker, index) => {
            if (marker.position) {
                marker.point = this._scene.toScenePosition(marker.position);
            }

            const object = this._markers[index];
            object.position.copy(marker.point);
        });

        this.updateMatrixWorld(true);
    }

    override addToScene(scene: ThreejsSceneLayer): this {
        this.name = this._options.id + '-root';

        this._markers = [];
        this._options.data.forEach((marker) => {
            const object = new CSS2DObject(marker.element);
            this.add(object);

            this._markers.push(object);
        });

        return super.addToScene(scene);
    }

    override removeFromScene(): this {
        this.clear();
        this._markers = [];
        return super.removeFromScene();
    }
}
