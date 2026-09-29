#pragma once

#include <cstdint>
#include <span>
#include <vector>

namespace swift2d {

// Pixels are 0xAARRGGBB in host memory. Output examples use a binary PPM.
struct Sprite {
  int width = 0;
  int height = 0;
  std::span<const std::uint32_t> pixels;
};

struct Draw {
  const Sprite* sprite = nullptr;
  int x = 0;
  int y = 0;
};

class Renderer {
public:
  Renderer(int width, int height);
  [[nodiscard]] int width() const noexcept { return width_; }
  [[nodiscard]] int height() const noexcept { return height_; }
  [[nodiscard]] std::span<const std::uint32_t> pixels() const noexcept { return pixels_; }
  void clear(std::uint32_t color) noexcept;
  void draw(const Draw& command) noexcept;
  void draw(std::span<const Draw> commands) noexcept;

private:
  int width_;
  int height_;
  std::vector<std::uint32_t> pixels_;
};

} // namespace swift2d
