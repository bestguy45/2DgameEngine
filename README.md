# Swift2D

A small C++20 foundation for a fast 2D game engine, with a local visual scene editor. The core is a dependency-free software sprite renderer with an owned framebuffer, clipped draws, transparent pixels, alpha blending, a reproducible benchmark, and a PPM example. It is not yet a complete engine: windowing, input, audio, asset loading, animation, collision, and a GPU backend are future work.

## Build and try it

```sh
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j
ctest --test-dir build --output-on-failure
./build/swift2d_example # writes checkerboard.ppm
./build/swift2d_bench 300
```

`Sprite` borrows its pixel memory, so keep the pixel buffer alive through every draw call. Commands are consumed immediately. The framebuffer is opaque; source pixels use straight alpha in `0xAARRGGBB` format. There is no heap allocation in the draw path once the renderer and command buffer have been created. Draw calls clip to the framebuffer and skip fully transparent pixels.

## Visual scene editor

Build the project, then start the local editor (Python 3.10 or newer):

```sh
python3 editor/server.py
```

On Windows, pass the executable path if needed: `python editor/server.py --renderer build/Release/swift2d_editor_render.exe`.

Open `http://127.0.0.1:8765` in a modern browser. Add or duplicate colored rectangle sprites, select them in the scene list or viewport, drag to move, and edit their name, position, size, color, opacity, and visibility. Arrow keys move the selected sprite by one pixel; Shift moves by eight. The toolbar saves scenes as JSON downloads and opens saved JSON scenes. New scene replaces the current scene after confirmation. Save before closing the browser; scenes are not automatically persisted.

The viewport is rendered by the actual C++ engine through a local process bridge. Grid and selection outlines are editor overlays. The preview update time includes process startup and transfer, so it is not a runtime game benchmark. This first editor supports solid rectangle sprites; textures, animation, and play mode are future work. The server listens only on the local computer.

If CMake is unavailable, build the editor bridge directly:

```sh
mkdir -p build
g++ -std=c++20 -O2 -Iinclude src/renderer.cpp tools/editor_render.cpp -o build/swift2d_editor_render
python3 editor/server.py
```

## Editor checks

Editor integration tests use Python's standard library. Client control tests require Node.js and use mocked DOM/canvas objects; they do not replace a browser smoke test.

```sh
python3 -m unittest discover -s tests -p editor_tests.py
node tests/editor_controls.test.cjs
```

## Runtime benchmarks

The benchmark draws 10,000 opaque 16×16 sprites into a 1280×720 framebuffer per frame. Run a Release build on the target machine and record compiler, CPU, frame time, and workload before making optimization claims. Compare changes on the same machine; use a profiler to find bottlenecks. This single synthetic benchmark does not measure input latency, GPU rendering, or a complete game.

Planned milestones: platform window/input layer; texture atlas and batched GPU renderer; fixed-step simulation; asset pipeline; profiling on representative scenes. Prefer measured improvements over speculative complexity.

