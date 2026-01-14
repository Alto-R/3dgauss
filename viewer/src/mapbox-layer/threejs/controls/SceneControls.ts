import { ThreejsSceneLayer } from '../threejs-scene';
import { FirstPersonControls, FirstPersonControlsOptions } from './FirstPersonControls';

import { AlongPathControls, AlongPathControlsOptions } from './AlongPathControls';
import { AroundPointControls, AroundPointControlsOptions } from './AroundPointControls';

export type ControlsOptions = { type } & (FirstPersonControlsOptions | AlongPathControlsOptions | AroundPointControlsOptions | undefined);
export type Controls = FirstPersonControls | AlongPathControls | AroundPointControls | undefined;

export class SceneControls {
    private _scene: ThreejsSceneLayer;
    private _controls: Controls;

    constructor(scene: ThreejsSceneLayer) {
        this._scene = scene;
        this._controls = undefined;
    }

    setControls(controlsOptions: ControlsOptions) {
        let threeControls = null;
        switch (controlsOptions.type) {
            case 'firstPerson':
                threeControls = new FirstPersonControls(this._scene, controlsOptions);
                break;
            case 'alongPath':
                threeControls = new AlongPathControls(this._scene, controlsOptions);
                break;
            case 'aroundPoint':
                threeControls = new AroundPointControls(this._scene, controlsOptions);
                break;
        }

        this._setControls(threeControls);
        return threeControls;
    }

    getControls() {
        return this._controls;
    }

    private _setControls(controls: Controls) {
        if (this._controls === controls) return;

        if (this._controls) {
            this._controls.disable();
        }

        this._controls = controls;

        if (this._controls) {
            this._controls.enable();
        }
    }
}
