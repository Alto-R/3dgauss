"""
统一转换流程
将 .splat 文件转换为 3D Tiles
"""
import os
from typing import Tuple

from .splat_to_tiles import split_to_tiles
from .clean_tiles import clean_tiles
from .build_lod import build_lod_tiles
from .convert_3dtiles import convert_to_3dtiles


def run_pipeline(
    input_path: str,
    output_path: str,
    enu_origin: Tuple[float, float] = (0.0, 0.0),
    tile_zoom: int = 20,
    tile_resolution: float = 0.1,
    tile_error: float = 1.0,
    min_alpha: float = 1.0,
    max_scale: float = 10000,
    flyers_num: int = 25,
    flyers_dis: float = 10.0
):
    """
    运行完整的转换流程:
    1. 切割瓦片
    2. 清洗数据
    3. 构建 LOD
    4. 转换为 3D Tiles
    """

    split_output_dir = os.path.join(output_path, "split")
    build_output_dir = os.path.join(output_path, "build")
    result_output_dir = os.path.join(output_path, "result")

    clean_output_dir = os.path.join(build_output_dir, f"{tile_zoom}")

    # 步骤 1: 切割瓦片 (已完成，跳过)
    # print(f"----split_to_tiles start:[{tile_zoom}][{input_path}][{split_output_dir}]")
    # split_to_tiles(input_path, split_output_dir, enu_origin, tile_zoom)

    # 步骤 2: 清洗数据 (已完成，跳过)
    # print(f"----clean_tiles start:[{tile_zoom}][{split_output_dir}][{clean_output_dir}]")
    # clean_tiles(split_output_dir, clean_output_dir, min_alpha, max_scale, flyers_num, flyers_dis)

    # 步骤 3: 构建 LOD (5 级)
    lod_zoom = tile_zoom - 1
    lod_input_dir = clean_output_dir
    while lod_zoom > tile_zoom - 6:
        lod_output_dir = os.path.join(build_output_dir, f"{lod_zoom}")

        print(f"----build_lod_tiles start:[{lod_zoom}][{lod_input_dir}][{lod_output_dir}]")
        build_lod_tiles(lod_input_dir, lod_output_dir, enu_origin, lod_zoom, tile_resolution)

        lod_input_dir = lod_output_dir
        lod_zoom -= 1

    # 步骤 4: 转换为 3D Tiles
    print(f"----convert_to_3dtiles start:[{build_output_dir}][{result_output_dir}]")
    convert_to_3dtiles(build_output_dir, result_output_dir, enu_origin, tile_zoom, tile_error)

    print(f"转换完成! 输出目录: {result_output_dir}")
    return result_output_dir
