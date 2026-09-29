# Swift2D

A small C++20 foundation for a fast 2D game engine. This first milestone is a dependency-free software sprite renderer with an owned framebuffer, clipped draws, transparent pixels, alpha blending, a reproducible benchmark, and a PPM example. It is not yet a complete engine: windowing, input, audio, asset loading, animation, collision, and a GPU backend are future work.

## Build and try it

```sh
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j
ctest --test-dir build --output-on-failure
./build/swift2d_example # writes checkerboard.ppm
./build/swift2d_bench 300
```

`Sprite` borrows its pixel memory, so keep the pixel buffer alive through every draw call. Commands are consumed immediately. The framebuffer is opaque; source pixels use straight alpha in `0xAARRGGBB` format. There is no heap allocation in the draw path once the renderer and command buffer have been created. Draw calls clip to the framebuffer and skip fully transparent pixels.

## Performance work

The benchmark draws 10,000 opaque 16×16 sprites into a 1280×720 framebuffer per frame. Run a Release build on the target machine and record compiler, CPU, frame time, and workload before making optimization claims. Compare changes on the same machine; use a profiler to find bottlenecks. This single synthetic benchmark does not measure input latency, GPU rendering, or a complete game.

Planned milestones: platform window/input layer; texture atlas and batched GPU renderer; fixed-step simulation; asset pipeline; profiling on representative scenes. Prefer measured improvements over speculative complexity.
