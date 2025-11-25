# Safe Interview Browser - Backend

This document provides instructions on how to build, run, and test the C++ backend for the Safe Interview Browser platform.

## 1. Prerequisites

- **C++ Compiler**: A modern C++ compiler that supports C++17 (e.g., GCC, Clang, MSVC).
- **CMake**: Version 3.15 or higher.
- **Git**: Required for fetching dependencies.
- **Docker**: Required for containerized execution and deployment.
- **(Windows)** Visual Studio: Recommended for easier development, but not strictly necessary if you use another build system like Ninja.

## 2. Dependencies

The project uses `CMake`'s `FetchContent` module to automatically download and manage the following dependencies:

- **cpp-httplib**: A header-only, cross-platform C++ HTTP/HTTPS library. Used to create the REST API server.
- **nlohmann/json**: A header-only C++ library for intuitive JSON parsing and serialization.
- **GoogleTest**: A testing framework for writing C++ tests.

These dependencies are downloaded at configure time, so an internet connection is required for the first build.

## 3. Building the Backend

You can build the project using standard CMake commands.

### 3.1. From the Command Line

1.  **Clone the repository** (if you haven't already).
2.  **Navigate to the `backend` directory**:
    ```bash
    cd path/to/your/project/backend
    ```
3.  **Configure CMake**:
    This command creates a `build` directory and prepares the build system.
    ```bash
    cmake -B build -S .
    ```
    *On Windows, you might want to specify a generator, e.g., for Visual Studio:*
    ```bash
    cmake -B build -S . -G "Visual Studio 16 2019" -A x64
    ```
4.  **Build the project**:
    This command compiles the source code and creates the executable.
    ```bash
    cmake --build build
    ```
    The executable `interview_backend` (or `interview_backend.exe` on Windows) will be located in the `build/` directory.

### 3.2. Using Visual Studio (Windows)

1.  Open Visual Studio.
2.  Select "Open a local folder" and navigate to the `backend` directory.
3.  Visual Studio should automatically detect the `CMakeLists.txt` and configure the project.
4.  Set `interview_backend.exe` as the startup item.
5.  Build and run the project using the "Start" button (or F5).

## 4. Running the Backend

Once built, you can run the server directly from the command line:

```bash
./build/interview_backend
```

Or on Windows:

```powershell
.\build\interview_backend.exe
```

The server will start and listen on `http://localhost:8080`.

**Important**: The backend needs to connect to the SciBox LLM service. Make sure to update the IP address in `src/main.cpp` in the `ask_scibox` function:

```cpp
// Change "<IP>" to the correct IP address
httplib::Client cli("http://<IP>:11434");
```

## 5. Running with Docker

A `Dockerfile` is provided for easy containerization.

1.  **Build the Docker image**:
    From the `backend` directory, run:
    ```bash
    docker build -t interview-backend .
    ```
2.  **Run the Docker container**:
    ```bash
    docker run -p 8080:8080 --rm interview-backend
    ```
    This command starts the container, maps port 8080 on your host to port 8080 in the container, and automatically removes the container when it stops (`--rm`).

    If your SciBox LLM service is running on the host machine, you may need to use a special Docker network address to connect to it (e.g., `host.docker.internal` on Windows/Mac).

## 6. Running Tests

The project is set up with GoogleTest.

1.  **Build the tests**:
    The tests are built along with the main application when you run `cmake --build build`. The test executable is `backend_tests` (or `backend_tests.exe`).
2.  **Run the tests**:
    You can run the tests using `CTest`, which is integrated with CMake. From the `build` directory:
    ```bash
    ctest
    ```
    This will discover and run all tests defined in the project.
