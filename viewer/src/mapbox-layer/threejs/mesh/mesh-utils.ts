import {
    MeshBasicMaterial,
    MeshDepthMaterial,
    MeshDistanceMaterial,
    MeshLambertMaterial,
    MeshPhongMaterial,
    MeshStandardMaterial,
    MeshToonMaterial,
    MeshPhysicalMaterial,
    MeshNormalMaterial,
    MeshMatcapMaterial,
    BufferGeometry,
    BufferAttribute,
} from 'three';

export default class MeshUtils {
    static getMeshMaterial(baseMaterial: string) {
        switch (baseMaterial) {
            case 'basic':
                return MeshBasicMaterial;
            case 'standard':
                return MeshStandardMaterial;
            case 'lambert':
                return MeshLambertMaterial;
            case 'phong':
                return MeshPhongMaterial;
            case 'depth':
                return MeshDepthMaterial;
            case 'distance':
                return MeshDistanceMaterial;
            case 'toon':
                return MeshToonMaterial;
            case 'physical':
                return MeshPhysicalMaterial;
            case 'normal':
                return MeshNormalMaterial;
            case 'matcap':
                return MeshMatcapMaterial;
            default:
                return MeshBasicMaterial;
        }
    }

    //重置UV 是否从中点 还是左上角的点
    static resetUV(geometry: BufferGeometry, isCenter: boolean = false) {
        geometry.computeBoundingBox();
        const { max, min } = geometry.boundingBox;
        geometry.deleteAttribute('uv');
        const roomX = max.x - min.x;
        const roomY = max.y - min.y;
        const PuvList = [];
        for (let i = 0; i < geometry.attributes.position.count; i++) {
            if (isCenter) {
                PuvList.push((geometry.attributes.position.getX(i) - (min.x + max.x) / 2) / roomX);
                PuvList.push((geometry.attributes.position.getY(i) - (min.y + max.y) / 2) / roomY);
            } else {
                PuvList.push((geometry.attributes.position.getX(i) - min.x) / roomX);
                PuvList.push((geometry.attributes.position.getY(i) - min.y) / roomY);
            }
        }
        const Puvs = new Float32Array(PuvList);
        geometry.setAttribute('uv', new BufferAttribute(Puvs, 2));
    }
}
