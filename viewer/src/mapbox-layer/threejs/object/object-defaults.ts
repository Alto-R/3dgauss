import { Object3D, Mesh, Color, LineBasicMaterial, MeshPhongMaterial, DoubleSide } from 'three';

export const _defaults = {
    colors: {
        red: new Color(0xff0000),
        yellow: new Color(0xffff00),
        green: new Color(0x00ff00),
        black: new Color(0x000000),
    },

    materials: {
        boxNormalMaterial: new LineBasicMaterial({
            color: new Color(0xff0000),
        }),
        boxOverMaterial: new LineBasicMaterial({ color: new Color(0xffff00) }),
        boxSelectedMaterial: new LineBasicMaterial({
            color: new Color(0x00ff00),
        }),
    },

    line: {
        geometry: null,
        color: 'black',
        width: 1,
        opacity: 1,
    },

    label: {
        htmlElement: null,
        cssClass: ' label3D',
        alwaysVisible: false,
        topMargin: -0.5,
    },

    tooltip: {
        text: '',
        cssClass: 'toolTip text-xs',
        mapboxStyle: false,
        topMargin: 0,
    },

    sphere: {
        position: [0, 0, 0],
        radius: 1,
        sides: 20,
        units: 'scene',
        material: 'MeshBasicMaterial',
        anchor: 'bottom-left',
        bbox: true,
        tooltip: true,
        raycasted: true,
    },

    tube: {
        geometry: null,
        radius: 1,
        sides: 6,
        units: 'scene',
        material: 'MeshBasicMaterial',
        anchor: 'center',
        bbox: true,
        tooltip: true,
        raycasted: true,
    },

    loadObj: {
        type: null,
        obj: null,
        units: 'scene',
        scale: 1,
        rotation: 0,
        defaultAnimation: 0,
        anchor: 'bottom-left',
        bbox: true,
        tooltip: true,
        raycasted: true,
        clone: true,
    },

    Object3D: {
        obj: null,
        units: 'scene',
        anchor: 'bottom-left',
        bbox: true,
        tooltip: true,
        raycasted: true,
    },

    extrusion: {
        coordinates: [[[]]],
        geometryOptions: {},
        height: 100,
        materials: new MeshPhongMaterial({ color: 0x660000, side: DoubleSide }),
        scale: 1,
        rotation: 0,
        units: 'scene',
        anchor: 'center',
        bbox: true,
        tooltip: true,
        raycasted: true,
    },
};
