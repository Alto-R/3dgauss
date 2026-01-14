import { CatmullRomCurve3, Matrix4, Object3D, Vector3 } from 'three';

import { SceneObject } from './scene-object';
import { Position } from '../threejs-types';

export type PathOptions = {
    id: string;
    path?: Position[];
    points?: Vector3[];
    duration: number;
    callback?: () => void;
};

export class PathObject extends SceneObject {
    private _object: any;
    private _options: PathOptions;
    private _path: CatmullRomCurve3;
    private _time: number;

    constructor(object: Object3D, options: PathOptions) {
        super();
        this._object = object;
        this._options = options;

        this._parentObjectName = 'ObjectPathGroup';
        this._time = 0;
    }

    override updateSceneTransform() {
        if (this._options.path) {
            this._options.points = this._options.path.map((point) => {
                const scenePoint = this._scene.toScenePosition(point);
                return scenePoint;
            });
            this._path = new CatmullRomCurve3(this._options.points, false);
        }
        this.updateMatrixWorld(true);
    }

    override updateSceneTime(time: number, delta: number) {
        this._time += delta;
        const t = (this._time % this._options.duration) / this._options.duration;
        let position = this._path.getPointAt(t);
        let tangent = this._path.getTangentAt(t).normalize();
        let target = position.clone().add(tangent);

        // TODO: world position to local postion
        if (this._object.parent) {
            const matrixWorldInv = this._object.parent.matrixWorld.clone().invert();
            position = position.applyMatrix4(matrixWorldInv);
            target = target.applyMatrix4(matrixWorldInv);
        }

        const m1 = new Matrix4();
        m1.lookAt(target, position, new Vector3(0, 0, 1));
        this._object.position.copy(position);
        this._object.quaternion.setFromRotationMatrix(m1);
    }
}
