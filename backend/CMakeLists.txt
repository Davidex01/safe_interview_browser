cmake_minimum_required(VERSION 3.15)
project(safe_interview_browser_backend CXX)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include FetchContent module to manage dependencies
include(FetchContent)

# Add cpp-httplib dependency for the HTTP server
FetchContent_Declare(
  httplib
  GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
  GIT_TAG v0.15.3
)

# Add nlohmann_json dependency for easy JSON parsing
FetchContent_Declare(
  json
  GIT_REPOSITORY https://github.com/nlohmann/json.git
  GIT_TAG v3.11.3
)

FetchContent_MakeAvailable(httplib json)

# Add executable
add_executable(interview_backend src/main.cpp)

# httplib and nlohmann_json are header-only, so we just need to provide include paths.
target_include_directories(interview_backend PUBLIC 
    ${httplib_SOURCE_DIR}
    ${json_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# For Windows: link against ws2_32 for networking
if(WIN32)
  target_link_libraries(interview_backend PRIVATE ws2_32)
endif()

# --- Google Test ---
# Add Google Test for unit testing
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG release-1.12.1
)
FetchContent_MakeAvailable(googletest)

# Enable testing for the project
enable_testing()

# Add the test executable
add_executable(backend_tests tests/basic_tests.cpp)

# Link the test executable against GTest and the main project's code (if needed)
target_link_libraries(backend_tests PRIVATE gtest_main)

# Add the test to CTest
include(GoogleTest)
gtest_discover_tests(backend_tests)


message(STATUS "Project configured successfully!")
message(STATUS "httplib source dir: ${httplib_SOURCE_DIR}")
message(STATUS "json source dir: ${json_SOURCE_DIR}/include")
