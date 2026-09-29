#include "swift2d/renderer.hpp"

#include <algorithm>
#include <stdexcept>

namespace swift2d {

Renderer::Renderer(int width, int height) : width_(width), height_(height) {
  if (width <= 0 || height <= 0 ||
      static_cast<std::uint64_t>(width) * static_cast<std::uint64_t>(height) > pixels_.max_size())
    throw std::invalid_argument("invalid framebuffer dimensions");
  pixels_.resize(static_cast<std::size_t>(width) * static_cast<std::size_t>(height));
}

void Renderer::clear(std::uint32_t color) noexcept {
  std::fill(pixels_.begin(), pixels_.end(), color);
}

void Renderer::draw(const Draw& command) noexcept {
  if (!command.sprite) return;
  const Sprite& s = *command.sprite;
  if (s.width <= 0 || s.height <= 0 ||
      static_cast<std::uint64_t>(s.width) * static_cast<std::uint64_t>(s.height) > s.pixels.size()) return;

  // Widen coordinates before addition so even extreme int coordinates clip safely.
  const auto left = std::max<std::int64_t>(0, command.x);
  const auto top = std::max<std::int64_t>(0, command.y);
  const auto right = std::min<std::int64_t>(width_, std::int64_t(command.x) + s.width);
  const auto bottom = std::min<std::int64_t>(height_, std::int64_t(command.y) + s.height);
  if (left >= right || top >= bottom) return;

  for (auto y = top; y < bottom; ++y) {
    auto* dst = pixels_.data() + y * width_ + left;
    const auto* src = s.pixels.data() + (y - command.y) * s.width + (left - command.x);
    for (auto x = left; x < right; ++x, ++src, ++dst) {
      const auto alpha = *src >> 24;
      if (alpha == 255) { *dst = *src; continue; }
      if (alpha == 0) continue;
      const auto inv = 255 - alpha;
      const auto d = *dst;
      // Straight-alpha RGB over an opaque framebuffer; alpha output is opaque.
      const auto rb = ((((*src & 0x00ff00ffu) * alpha + (d & 0x00ff00ffu) * inv + 0x00800080u) >> 8) & 0x00ff00ffu);
      const auto g = ((((*src & 0x0000ff00u) * alpha + (d & 0x0000ff00u) * inv + 0x00008000u) >> 8) & 0x0000ff00u);
      *dst = 0xff000000u | rb | g;
    }
  }
}

void Renderer::draw(std::span<const Draw> commands) noexcept {
  for (const auto& command : commands) draw(command);
}

} // namespace swift2d
