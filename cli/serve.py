"""
Serve command handler - Static file server for 3D Tiles
"""
import sys
import os
import http.server
import socketserver
import webbrowser
import json
from functools import partial


class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    支持 CORS 的静态文件服务器
    """

    def __init__(self, *args, data_dir=None, **kwargs):
        self.data_dir = data_dir
        super().__init__(*args, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def translate_path(self, path):
        """重写路径转换，支持自定义数据目录"""
        if path.startswith('/data/'):
            # 移除 /data/ 前缀，返回数据目录中的文件
            relative_path = path[6:]  # 去掉 '/data/'
            return os.path.join(self.data_dir, relative_path)
        return super().translate_path(path)


def generate_viewer_html(center=None, tileset_url="/data/tileset.json"):
    """
    生成简单的查看器 HTML
    """
    center_js = f"[{center[0]}, {center[1]}]" if center else "[0, 0]"

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3DGauss Viewer</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
        #root {{ width: 100vw; height: 100vh; }}
        .loading {{
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }}
        .loading h1 {{ color: #333; margin-bottom: 20px; }}
        .loading p {{ color: #666; }}
        .info {{
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(255,255,255,0.9);
            padding: 15px;
            border-radius: 8px;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .info h2 {{ font-size: 14px; margin-bottom: 10px; color: #333; }}
        .info p {{ font-size: 12px; color: #666; margin: 5px 0; }}
        .info code {{ background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }}
    </style>
</head>
<body>
    <div id="root">
        <div class="loading">
            <h1>3DGauss Viewer</h1>
            <p>请在 viewer 目录运行 <code>npm run dev</code> 启动完整的 React 可视化界面</p>
            <p style="margin-top: 20px;">或者访问以下 API:</p>
            <p><code>GET /data/tileset.json</code> - 3D Tiles 数据</p>
        </div>
        <div class="info">
            <h2>服务器信息</h2>
            <p>Tileset URL: <code>{tileset_url}</code></p>
            <p>Center: <code>{center_js}</code></p>
            <p style="margin-top: 10px;">使用 React Three Fiber 可视化:</p>
            <p><code>cd viewer && npm run dev</code></p>
        </div>
    </div>
</body>
</html>
'''


def run_serve(args):
    """
    运行服务器命令
    """
    data_dir = os.path.abspath(args.data)
    port = args.port
    center = args.center if args.center else None

    # 检查数据目录
    if not os.path.exists(data_dir):
        print(f"错误: 数据目录不存在: {data_dir}")
        sys.exit(1)

    # 检查 tileset.json
    tileset_path = os.path.join(data_dir, 'tileset.json')
    if not os.path.exists(tileset_path):
        print(f"错误: 找不到 tileset.json: {tileset_path}")
        sys.exit(1)

    print(f"3dgauss_view Server")
    print(f"=" * 50)
    print(f"数据目录: {data_dir}")
    print(f"端口: {port}")
    if center:
        print(f"中心点: {center}")
    print(f"=" * 50)

    # 创建临时的 index.html
    viewer_html = generate_viewer_html(center)
    temp_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'server', 'static')
    os.makedirs(temp_dir, exist_ok=True)
    index_path = os.path.join(temp_dir, 'index.html')
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(viewer_html)

    # 切换到静态文件目录
    os.chdir(temp_dir)

    # 创建带有自定义数据目录的处理器
    handler = partial(CORSRequestHandler, data_dir=data_dir)

    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            url = f"http://localhost:{port}"
            print(f"\n服务器已启动: {url}")
            print(f"3D Tiles 数据: {url}/data/tileset.json")
            print(f"\n按 Ctrl+C 停止服务器")

            # 打开浏览器
            if not args.no_browser:
                webbrowser.open(url)

            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except OSError as e:
        if e.errno == 98 or e.errno == 10048:  # Linux / Windows
            print(f"错误: 端口 {port} 已被占用，请尝试其他端口")
        else:
            raise
