#include "swift2d/renderer.hpp"

#include <array>
#include <fstream>
#include <iostream>

int main() {
  swift2d::Renderer renderer(320, 180);
  renderer.clear(0xff18202bu);
  std::array<std::uint32_t, 16 * 16> pixels{};
  for (int y = 0; y < 16; ++y)
    for (int x = 0; x < 16; ++x)
      pixels[y * 16 + x] = ((x / 4 + y / 4) % 2) ? 0xffffca62u : 0xff49c6b4u;
  const swift2d::Sprite sprite{16, 16, pixels};
  for (int y = 0; y < 10; ++y)
    for (int x = 0; x < 18; ++x)
      renderer.draw({&sprite, x * 18, y * 18});

  std::ofstream out("checkerboard.ppm", std::ios::binary);
  out << "P6\n" << renderer.width() << ' ' << renderer.height() << "\n255\n";
  for (auto pixel : renderer.pixels()) {
    const char rgb[]{char(pixel >> 16), char(pixel >> 8), char(pixel)};
    out.write(rgb, 3);
  }
  if (!out) { std::cerr << "could not write checkerboard.ppm\n"; return 1; }
  std::cout << "Wrote checkerboard.ppm\n";
}
