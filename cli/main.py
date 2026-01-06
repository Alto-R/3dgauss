"""
3dgauss_view: Gaussian Splatting to 3D Tiles Converter and Viewer

Usage:
    python -m cli.main convert --input <path> --output <path> [options]
    python -m cli.main serve --data <path> [--port <port>]
    python -m cli.main --help
"""
import argparse
import sys
from multiprocessing import freeze_support

from .convert import run_convert
from .serve import run_serve


def main():
    parser = argparse.ArgumentParser(
        description="3D Gaussian Splatting to 3D Tiles Converter and Viewer",
        prog="3dgauss_view"
    )
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Convert command
    convert_parser = subparsers.add_parser('convert', help='Convert SPLAT files to 3D Tiles')
    convert_parser.add_argument('--input', '-i', required=True, help='Input .splat file or folder')
    convert_parser.add_argument('--output', '-o', required=True, help='Output folder')
    convert_parser.add_argument('--enu-origin', nargs=2, type=float, metavar=('lon', 'lat'),
                               help='ENU origin (longitude latitude). Required.')
    convert_parser.add_argument('--tile-zoom', type=int, default=20, help='Tile zoom level (default: 20)')
    convert_parser.add_argument('--tile-resolution', type=float, default=0.1, help='LOD resolution in meters (default: 0.1)')
    convert_parser.add_argument('--tile-error', type=float, default=1, help='Geometric error (default: 1)')
    convert_parser.add_argument('--min-alpha', type=float, default=1.0, help='Min alpha threshold (default: 1.0)')
    convert_parser.add_argument('--max-scale', type=float, default=10000, help='Max scale threshold (default: 10000)')
    convert_parser.add_argument('--flyers-num', type=int, default=25, help='Flyers detection neighbors (default: 25)')
    convert_parser.add_argument('--flyers-dis', type=float, default=10, help='Flyers detection distance factor (default: 10)')

    # Serve command
    serve_parser = subparsers.add_parser('serve', help='Start visualization server')
    serve_parser.add_argument('--data', '-d', required=True, help='3D Tiles folder path (tileset.json location)')
    serve_parser.add_argument('--port', '-p', type=int, default=8080, help='Server port (default: 8080)')
    serve_parser.add_argument('--center', nargs=2, type=float, metavar=('lon', 'lat'),
                             help='Map center (longitude latitude)')
    serve_parser.add_argument('--no-browser', action='store_true', help='Do not open browser automatically')

    args = parser.parse_args()

    if args.command == 'convert':
        run_convert(args)
    elif args.command == 'serve':
        run_serve(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    freeze_support()
    main()
