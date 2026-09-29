"""Run after building: python3 -m unittest discover -s tests -p 'editor_tests.py'."""
import importlib.util
import json
from pathlib import Path
import struct
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('editor_server', ROOT / 'editor' / 'server.py')
editor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(editor)

class EditorIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = editor.ThreadingHTTPServer(('127.0.0.1', 0), editor.Handler)
        cls.server.renderer = ROOT / 'build' / 'swift2d_editor_render'
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def render(self, scene):
        return urlopen(Request(self.url + '/api/render', data=json.dumps(scene).encode(),
                               headers={'Content-Type': 'application/json'}), timeout=5)

    def test_native_frame_pixels_and_hidden_sprite(self):
        scene = {'width': 2, 'height': 2, 'background': '#000000', 'sprites': [
            {'x': 0, 'y': 0, 'width': 1, 'height': 1, 'color': '#ff0000', 'alpha': 255},
            {'x': 0, 'y': 0, 'width': 2, 'height': 2, 'color': '#ffffff', 'visible': False}]}
        with self.render(scene) as response:
            image = response.read()
            self.assertEqual(response.headers['Content-Type'], 'image/bmp')
        self.assertEqual(image[:2], b'BM')
        self.assertEqual(struct.unpack_from('<II', image, 18), (2, 2))
        self.assertEqual(struct.unpack_from('<IIII', image, 54),
                         (0xff000000, 0xff000000, 0xffff0000, 0xff000000))

    def test_bad_scene_is_rejected(self):
        for scene in [{'width': 99999}, {'width': 2, 'height': 2, 'background': '#000000', 'sprites': ['bad']}]:
            with self.assertRaises(HTTPError) as error:
                self.render(scene)
            self.assertEqual(error.exception.code, 400)

    def test_ui_is_served(self):
        with urlopen(self.url + '/', timeout=5) as response:
            self.assertIn(b'Swift2D Scene Editor', response.read())
        with urlopen(self.url + '/editor.js', timeout=5) as response:
            self.assertIn(b'/api/render', response.read())

if __name__ == '__main__':
    unittest.main()
