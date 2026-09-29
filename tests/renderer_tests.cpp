#include "swift2d/renderer.hpp"

#include <array>
#include <cassert>
#include <climits>
#include <stdexcept>

int main() {
  bool threw = false;
  try { swift2d::Renderer invalid(0, 2); } catch (const std::invalid_argument&) { threw = true; }
  assert(threw);
  swift2d::Renderer renderer(2, 2);
  renderer.clear(0xff000000u);
  const std::array<std::uint32_t, 4> pixels{0xffff0000u, 0x00000000u, 0xffffffffu, 0x80ffffffu};
  const swift2d::Sprite sprite{2, 2, pixels};
  renderer.draw({&sprite, -1, -1});
  assert(renderer.pixels()[0] == 0xff808080u);
  renderer.draw({&sprite, 0, 0});
  assert(renderer.pixels()[0] == 0xffff0000u);
  assert(renderer.pixels()[1] == 0xff000000u);
  assert(renderer.pixels()[2] == 0xffffffffu);
  renderer.draw({&sprite, INT_MAX, INT_MAX});
  renderer.draw({&sprite, INT_MIN, INT_MIN});
  assert(renderer.pixels()[0] == 0xffff0000u);
  const swift2d::Sprite malformed{3, 3, pixels};
  renderer.draw({&malformed, 0, 0});
  assert(renderer.pixels()[0] == 0xffff0000u);
}
