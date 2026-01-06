"""
Convert command handler
"""
import sys
import os

# 添加父目录到路径以支持相对导入
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from converter.pipeline import run_pipeline


def run_convert(args):
    """
    运行转换命令
    """
    input_path = args.input
    output_path = args.output

    # 检查输入路径
    if not os.path.exists(input_path):
        print(f"错误: 输入路径不存在: {input_path}")
        sys.exit(1)

    # 检查 ENU 原点
    if not args.enu_origin:
        print("错误: 必须指定 --enu-origin 参数 (经度 纬度)")
        sys.exit(1)

    enu_origin = (args.enu_origin[0], args.enu_origin[1])

    print(f"3dgauss_view Converter")
    print(f"=" * 50)
    print(f"输入路径: {input_path}")
    print(f"输出路径: {output_path}")
    print(f"ENU 原点: {enu_origin}")
    print(f"瓦片级别: {args.tile_zoom}")
    print(f"LOD 分辨率: {args.tile_resolution}")
    print(f"几何误差: {args.tile_error}")
    print(f"=" * 50)

    try:
        result_dir = run_pipeline(
            input_path=input_path,
            output_path=output_path,
            enu_origin=enu_origin,
            tile_zoom=args.tile_zoom,
            tile_resolution=args.tile_resolution,
            tile_error=args.tile_error,
            min_alpha=args.min_alpha,
            max_scale=args.max_scale,
            flyers_num=args.flyers_num,
            flyers_dis=args.flyers_dis
        )
        print(f"\n转换成功!")
        print(f"输出文件: {os.path.join(result_dir, 'tileset.json')}")
    except Exception as e:
        print(f"转换失败: {e}")
        sys.exit(1)
