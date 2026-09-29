#include "swift2d/renderer.hpp"

#include <array>
#include <chrono>
#include <cstdlib>
#include <iostream>
#include <vector>

int main(int argc, char** argv) {
  const int frames = argc > 1 ? std::atoi(argv[1]) : 300;
  if (frames <= 0) return 1;
  std::array<std::uint32_t, 16 * 16> pixels{};
  pixels.fill(0xff40a0ffu);
  swift2d::Sprite sprite{16, 16, pixels};
  std::vector<swift2d::Draw> commands;
  for (int i = 0; i < 10000; ++i)
    commands.push_back({&sprite, (i * 73) % 1300 - 10, (i * 37) % 740 - 10});
  swift2d::Renderer renderer(1280, 720);
  const auto start = std::chrono::steady_clock::now();
  for (int i = 0; i < frames; ++i) {
    renderer.clear(0xff000000u);
    renderer.draw(commands);
  }
  const auto elapsed = std::chrono::duration<double>(std::chrono::steady_clock::now() - start).count();
  std::cout << frames << " frames, 10000 sprites/frame, " << elapsed / frames * 1000
            << " ms/frame, checksum " << renderer.pixels()[0] << '\n';
}
