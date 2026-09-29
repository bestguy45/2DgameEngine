#include "swift2d/renderer.hpp"
#include <iostream>
#include <vector>
#include <cstdint>
#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

static void word(std::uint32_t n, int bytes) {
  for (int i = 0; i < bytes; ++i) std::cout.put(char(n >> (i * 8)));
}

// Small process bridge: validated scene records on stdin, 32-bit BMP on stdout.
int main() {
#ifdef _WIN32
  _setmode(_fileno(stdout), _O_BINARY);
#endif
  int width, height, count;
  std::uint32_t background;
  if (!(std::cin >> width >> height >> background >> count) || width < 1 || height < 1 ||
      width > 1920 || height > 1080 || count < 0 || count > 1000) return 1;
  swift2d::Renderer renderer(width, height);
  renderer.clear(background | 0xff000000u);
  for (int i = 0; i < count; ++i) {
    int x, y, w, h;
    std::uint32_t color;
    if (!(std::cin >> x >> y >> w >> h >> color) || w < 1 || h < 1 || w > 256 || h > 256)
      return 1;
    std::vector<std::uint32_t> pixels(static_cast<std::size_t>(w) * h, color);
    swift2d::Sprite sprite{w, h, pixels};
    renderer.draw({&sprite, x, y});
  }
  const auto size = std::uint32_t(width * height * 4);
  std::cout.put('B'); std::cout.put('M');
  word(size + 54, 4); word(0, 4); word(54, 4);
  word(40, 4); word(width, 4); word(height, 4); word(1, 2); word(32, 2);
  word(0, 4); word(size, 4); word(2835, 4); word(2835, 4); word(0, 4); word(0, 4);
  for (int y = height - 1; y >= 0; --y)
    for (int x = 0; x < width; ++x)
      word(renderer.pixels()[static_cast<std::size_t>(y) * width + x], 4);
}
