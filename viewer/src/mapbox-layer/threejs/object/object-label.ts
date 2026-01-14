import { Object3D, Mesh, Color, Material, Vector3, Box3, Matrix4, Vector2, Object3DEventMap } from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { SceneObject } from './scene-object';
import { ThreejsSceneLayer } from '../threejs-scene';

export type Anchor = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back';

export type LabelOptions = {
    id: string;
    element?: HTMLElement;
    offset?: [number, number];
    anchor?: Anchor;
    color?: string;
    scale?: number;
    draggable?: boolean;
    clickTolerance?: number;
    rotation?: number;
    rotationAlignment?: string;
    pitchAlignment?: string;
    occludedOpacity?: number;
    className?: string;
};

export class LabelObject extends SceneObject {
    _object: Object3D;
    _options: LabelOptions;

    _label: CSS2DObject | null = null;

    constructor(obejct: Object3D, options: LabelOptions) {
        super();

        this._object = obejct;
        this._options = options;
        this._parentObjectName = 'ObjectLabelGroup';
    }

    override updateSceneTransform() {
        const options = this._options;
        const obejct = this._object;

        const anchorType = (options && options.anchor) || 'center';

        const bbox = new Box3().setFromObject(obejct);
        const anchor = this._getAnchor(anchorType, bbox);

        this._label.position.copy(anchor);
    }

    override addToScene(scene: ThreejsSceneLayer): this {
        const options = this._options;

        let element = options instanceof HTMLElement ? options : options.element;
        let offset = new Vector2().fromArray((options && options.offset) || [0, 0]);

        this._label = new CSS2DObject(element);
        this._label.center = offset;
        this.add(this._label);

        return super.addToScene(scene);
    }

    override removeFromScene(): this {
        if (this._label) {
            this.remove(this._label);
        }

        return super.removeFromScene();
    }

    private _getAnchor(anchor: Anchor, boundingBox: Box3): Vector3 {
        const center = boundingBox.getCenter(new Vector3());

        switch (anchor) {
            case 'center':
                return center;
            case 'top':
                return new Vector3(center.x, center.y, boundingBox.max.z);
            case 'bottom':
                return new Vector3(center.x, center.y, boundingBox.min.z);
            case 'left':
                return new Vector3(boundingBox.min.x, center.y, center.z);
            case 'right':
                return new Vector3(boundingBox.max.x, center.y, center.z);
            case 'front':
                return new Vector3(center.x, boundingBox.min.y, center.z);
            case 'back':
                return new Vector3(center.x, boundingBox.max.y, center.z);

            default: // return top
                return center;
        }
    }
}
