#!/usr/bin/env python3
"""Local editor and bounded bridge to the native Swift2D renderer."""
import argparse
import json
from pathlib import Path
import subprocess
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parent

def integer(value, low, high):
    if type(value) is not int or not low <= value <= high:
        raise ValueError(f"Expected an integer between {low} and {high}")
    return value

def color(value, alpha=255):
    if not isinstance(value, str) or len(value) != 7 or value[0] != '#':
        raise ValueError('Colors must use #RRGGBB')
    return (alpha << 24) | int(value[1:], 16)

def records(scene):
    width = integer(scene['width'], 1, 1920)
    height = integer(scene['height'], 1, 1080)
    sprites = scene['sprites']
    if not isinstance(sprites, list) or len(sprites) > 1000:
        raise ValueError('A scene supports at most 1000 sprites')
    if any(not isinstance(sprite, dict) or type(sprite.get('visible', True)) is not bool for sprite in sprites):
        raise ValueError('Sprites must be objects with boolean visibility')
    visible = [sprite for sprite in sprites if sprite.get('visible', True)]
    rows = [f"{width} {height} {color(scene['background'])} {len(visible)}"]
    for sprite in visible:
        values = [integer(sprite[key], low, high) for key, low, high in
                  [('x', -10000, 10000), ('y', -10000, 10000), ('width', 1, 256), ('height', 1, 256)]]
        values.append(color(sprite['color'], integer(sprite.get('alpha', 255), 0, 255)))
        rows.append(' '.join(map(str, values)))
    return ('\n'.join(rows) + '\n').encode()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path != '/api/render':
            self.send_error(404)
            return
        try:
            length = int(self.headers.get('Content-Length', 0))
            if not 0 < length <= 512000:
                raise ValueError('Scene request is too large or empty')
            payload = records(json.loads(self.rfile.read(length)))
            result = subprocess.run([str(self.server.renderer)], input=payload,
                                    capture_output=True, timeout=5, check=True)
            self.send_response(200)
            self.send_header('Content-Type', 'image/bmp')
            self.send_header('Content-Length', str(len(result.stdout)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(result.stdout)
        except (ValueError, KeyError, TypeError, OSError, subprocess.SubprocessError) as error:
            self.send_error(400, str(error))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--renderer', type=Path, default=ROOT.parent / 'build' / 'swift2d_editor_render')
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    if not args.renderer.is_file():
        parser.error('Build swift2d_editor_render first, or pass --renderer /path/to/executable')
    with ThreadingHTTPServer(('127.0.0.1', args.port), Handler) as server:
        server.renderer = args.renderer.resolve()
        print(f'Swift2D editor: http://127.0.0.1:{args.port}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass

if __name__ == '__main__':
    main()
