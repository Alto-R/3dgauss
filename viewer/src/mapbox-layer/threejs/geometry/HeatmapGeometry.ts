import { BufferGeometry, Vector2, Vector3 } from 'three';
import { Float32BufferAttribute } from 'three';

class HeatmapGeometry extends BufferGeometry {
    parameters: {
        v1: Vector3;
        v2: Vector3;
        v3: Vector3;
        v4: Vector3;
        widthSegments: number;
        heightSegments: number;
    };

    constructor(v1 = new Vector3(-1, 1, 0), v2 = new Vector3(-1, -1, 0), v3 = new Vector3(1, -1, 0), v4 = new Vector3(1, 1, 0), widthSegments = 1, heightSegments = 1) {
        super();

        // @ts-ignore
        this.type = 'HeatmapGeometry';

        this.parameters = {
            v1: v1,
            v2: v2,
            v3: v3,
            v4: v4,
            widthSegments: widthSegments,
            heightSegments: heightSegments,
        };

        const gridX = Math.floor(widthSegments);
        const gridY = Math.floor(heightSegments);

        const gridX1 = gridX + 1;
        const gridY1 = gridY + 1;

        //

        const indices = [];
        const vertices = [];
        const normals = [];
        const uvs = [];

        for (let iy = 0; iy < gridY1; iy++) {
            // const y = iy * segment_height - height_half;
            const uvY = iy / gridY;
            const vy1 = new Vector3().lerpVectors(v1, v2, uvY);
            const vy2 = new Vector3().lerpVectors(v4, v3, uvY);

            for (let ix = 0; ix < gridX1; ix++) {
                const uvX = ix / gridX;
                const vx = new Vector3().lerpVectors(vy1, vy2, uvX);
                // const x = ix * segment_width - width_half;

                vertices.push(vx.x, vx.y, vx.z);

                normals.push(0, 0, 1);

                uvs.push(uvX);
                uvs.push(1 - uvY);
            }
        }

        for (let iy = 0; iy < gridY; iy++) {
            for (let ix = 0; ix < gridX; ix++) {
                const a = ix + gridX1 * iy;
                const b = ix + gridX1 * (iy + 1);
                const c = ix + 1 + gridX1 * (iy + 1);
                const d = ix + 1 + gridX1 * iy;

                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        this.setIndex(indices);
        this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    }

    getUV(v) {
        const { v1, v2, v3, v4 } = this.parameters;
        const uvY1 = (v1.y - v.y) / (v1.y - v2.y);
        const uvY2 = (v4.y - v.y) / (v4.y - v3.y);
        const uvY = (uvY1 + uvY2) / 2;

        const vy1 = new Vector3().lerpVectors(v1, v2, uvY);
        const vy2 = new Vector3().lerpVectors(v4, v3, uvY);
        const uvX = (vy1.x - v.x) / (vy1.x - vy2.x);
        return new Vector2(uvX, uvY);
    }

    override copy(source) {
        super.copy(source);

        this.parameters = Object.assign({}, source.parameters);

        return this;
    }

    static fromJSON(data) {
        return new HeatmapGeometry(data.v1, data.v2, data.v3, data.v4, data.widthSegments, data.heightSegments);
    }
}

function getHeatmapGeometrySize(v1 = new Vector3(-1, 1, 0), v2 = new Vector3(-1, -1, 0), v3 = new Vector3(1, -1, 0), v4 = new Vector3(1, 1, 0)) {
    const width = (new Vector3().subVectors(v3, v2).length() + new Vector3().subVectors(v4, v1).length()) / 2;
    const height = (new Vector3().subVectors(v1, v2).length() + new Vector3().subVectors(v4, v3).length()) / 2;

    return [width, height];
}

export { HeatmapGeometry, getHeatmapGeometrySize };
