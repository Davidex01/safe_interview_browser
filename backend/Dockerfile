# Dockerfile for the C++ Backend

# --- Build Stage ---
# Use a base image with CMake and a C++ compiler
FROM mcr.microsoft.com/devcontainers/cpp:1-ubuntu-22.04 AS build

# Set the working directory
WORKDIR /app

# Copy the source code into the container
COPY . .

# Configure the project with CMake
# This will also fetch dependencies like httplib and json
RUN cmake -B build -S .

# Build the project
RUN cmake --build build

# --- Run Stage ---
# Use a smaller, more secure base image for the final application
FROM ubuntu:22.04

# Set the working directory
WORKDIR /app

# Copy the compiled executable from the build stage
COPY --from=build /app/build/interview_backend .

# Expose the port the server will run on
EXPOSE 8080

# Command to run the backend server
CMD ["./interview_backend"]
