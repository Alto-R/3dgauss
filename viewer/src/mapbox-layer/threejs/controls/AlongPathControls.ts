import { ThreejsSceneLayer } from '../threejs-scene';
import { Position } from '../threejs-types';
import { extend } from '../utils/Util';
import { BaseControls } from './BaseControls';
import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';
import { FollowCamera } from './FollowCamera';
import { CameraOptions } from 'mapbox-gl';
import { updateMapCameraPosition } from './ControlUtils';

export type AlongPathControlsOptions = {
    path?: Position[];
    points?: Vector3[];
    pathClose?: boolean;
    duration?: number;

    cameraPitch?: number;
    cameraBearing?: number;
    cameraDistance?: number;
};

const defaultOptions: AlongPathControlsOptions = {
    path: [],
    points: [],
    pathClose: false,
    duration: 10,

    cameraPitch: 45,
    cameraBearing: 0,
    cameraDistance: 10,
};

export class AlongPathControls extends BaseControls {
    options: AlongPathControlsOptions;
    followCamera: FollowCamera;
    mapCameraPosition: CameraOptions = {};

    private _path: CatmullRomCurve3;
    private _time: number;

    constructor(scene: ThreejsSceneLayer, options: AlongPathControlsOptions) {
        super(scene);

        this.options = extend({}, defaultOptions, options);

        this.followCamera = new FollowCamera();

        this.updatePath();
    }

    updatePath() {
        if (this.options.path) {
            this.options.points = this.options.path.map((point) => {
                const scenePoint = this.scene.toScenePosition(point);
                return scenePoint;
            });
        }

        if (this.options.points) {
            this._time = 0;
            this._path = new CatmullRomCurve3(this.options.points, this.options.pathClose);
        }
    }

    override update(time: number) {
        if (!this.enabled) {
            return;
        }

        this.UpdateMapCameraPosition(time);

        const map = this.scene.getMap();
        map.jumpTo(this.mapCameraPosition);
    }

    public UpdateMapCameraPosition(time: number = 0.0) {
        if (this._path === undefined) {
            return;
        }

        this._time += time;
        const t = (this._time % this.options.duration) / this.options.duration;
        let position = this._path.getPointAt(t);
        let tangent = this._path.getTangentAt(t).normalize();

        tangent.projectOnPlane(new Vector3(0, 0, 1)).normalize();
        this.followCamera.cameraPitch = this.options.cameraPitch;
        this.followCamera.cameraDistance = this.options.cameraDistance;
        this.followCamera.cameraBearing = this.options.cameraBearing + MathUtils.radToDeg(Math.atan2(tangent.x, tangent.y));
        this.followCamera.objectPosition.copy(position);

        this.followCamera.update(time);

        this.mapCameraPosition = updateMapCameraPosition(this.scene, this.followCamera);

        return this.mapCameraPosition;
    }
}
