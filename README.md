# 3dgauss_view

高斯泼溅数据转换与可视化工具。将 .splat 格式的 3D Gaussian Splatting 数据转换为 3D Tiles，并提供 Web 可视化界面。

## 功能

- 将 .splat 文件转换为 Cesium 3D Tiles（带 LOD 支持）
- 基于 React Three Fiber 的 Web 可视化
- 命令行工具

## 安装

### Python 依赖

```bash
cd 3dgauss_view
pip install -r requirements.txt
```

### Node.js 依赖

```bash
cd viewer
npm install
```

## 使用

### 1. 转换数据

```bash
python -m cli.main convert -i ./data/splats -o ./output/tiles --enu-origin 113.950997 22.582630

```

**参数说明：**

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-i, --input` | 输入 .splat 文件或目录 | 必填 |
| `-o, --output` | 输出目录 | 必填 |
| `--enu-origin` | ENU 坐标原点 (经度 纬度) | 必填 |
| `--tile-zoom` | 瓦片级别 | 20 |
| `--tile-resolution` | LOD 分辨率 (米) | 0.1 |
| `--tile-error` | 几何误差 | 1.0 |
| `--min-alpha` | 最小透明度阈值 | 1.0 |
| `--max-scale` | 最大缩放阈值 | 10000 |

### 2. 启动可视化

#### 开发模式

```bash
cd viewer
npm run dev
# 访问 http://localhost:5173
```

#### 生产模式

```bash
# 构建前端
cd viewer && npm run build && cd ..

# 启动服务器
python -m cli.main serve -d ./output/tiles/result
# 访问 http://localhost:8080
```

## 项目结构

```
3dgauss_view/
├── cli/                 # 命令行工具
│   ├── main.py          # CLI 入口
│   ├── convert.py       # 转换命令
│   └── serve.py         # 服务器命令
├── converter/           # Python 转换模块
│   ├── pipeline.py      # 统一转换流程
│   ├── splat_to_tiles.py
│   ├── clean_tiles.py
│   ├── build_lod.py
│   └── convert_3dtiles.py
└── viewer/              # React Three Fiber 前端
    ├── src/
    │   ├── App.tsx
    │   └── components/
    └── package.json
```

## 依赖

- Python 3.8+
- Node.js 18+
- numpy, scipy, pygltflib, pyproj, tqdm
- React, React Three Fiber, Three.js, 3d-tiles-renderer

## 致谢

基于以下项目：
- [splat-3dtiles](https://github.com/example/splat-3dtiles)
- [mapbox-3d-tiles](https://github.com/example/mapbox-3d-tiles)
