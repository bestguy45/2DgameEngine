cmake_minimum_required(VERSION 3.20)
project(swift2d VERSION 0.1.0 LANGUAGES CXX)

add_library(swift2d src/renderer.cpp)
target_include_directories(swift2d PUBLIC include)
target_compile_features(swift2d PUBLIC cxx_std_20)
target_compile_options(swift2d PRIVATE $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall;-Wextra;-Wpedantic>)

add_executable(swift2d_example examples/checkerboard.cpp)
target_link_libraries(swift2d_example PRIVATE swift2d)

include(CTest)
if(BUILD_TESTING)
  add_executable(swift2d_tests tests/renderer_tests.cpp)
  target_link_libraries(swift2d_tests PRIVATE swift2d)
  add_test(NAME renderer COMMAND swift2d_tests)
endif()

add_executable(swift2d_bench bench/sprites.cpp)
target_link_libraries(swift2d_bench PRIVATE swift2d)
