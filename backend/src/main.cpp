#include <httplib.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <cstdlib> // For system()

// Use nlohmann::json for convenience
using json = nlohmann::json;

// --- Main Application ---
int main() {
    // Create an HTTP server instance
    httplib::Server svr;

    // POST /api/generate-tasks - Endpoint to generate interview tasks
    svr.Post("/api/generate-tasks", [](const httplib::Request& req, httplib::Response& res) {
        json response;
        int status = 200;
        try {
            json body = json::parse(req.body);
            std::string vacancy = body.at("vacancy");

            // 1. Write the vacancy to a text file
            std::ofstream vacancy_file("vacancy.txt");
            if (!vacancy_file.is_open()) {
                throw std::runtime_error("Failed to open vacancy.txt for writing.");
            }
            vacancy_file << vacancy;
            vacancy_file.close();

            // 2. Run the Python script
            // Make sure 'python' is in your system's PATH.
            // You might need to use 'python3' depending on your setup.
            std::cout << "Running generation.py script..." << std::endl;
            int script_result = std::system("python generation.py");

            if (script_result != 0) {
                throw std::runtime_error("Python script execution failed with code " + std::to_string(script_result));
            }
            std::cout << "Python script finished." << std::endl;

            // 3. Read the generated JSON file
            std::ifstream tasks_file("ai_tasks.json");
            if (!tasks_file.is_open()) {
                throw std::runtime_error("Failed to open ai_tasks.json after script execution.");
            }
            
            response = json::parse(tasks_file);
            tasks_file.close();

        } catch (const json::parse_error& e) {
            status = 400;
            response = {{"error", "Invalid JSON format in request"}};
        } catch (const json::out_of_range& e) {
            status = 400;
            response = {{"error", "Missing 'vacancy' field in request"}};
        } catch (const std::exception& e) {
            status = 500; // Internal Server Error
            response = {{"error", e.what()}};
        }

        res.status = status;
        res.set_content(response.dump(), "application/json");
    });

    // --- CORS Middleware ---
    svr.set_pre_routing_handler([](const httplib::Request& req, httplib::Response& res) {
        if (req.method == "OPTIONS") {
            res.set_header("Access-Control-Allow-Origin", "*");
            res.set_header("Access-Control-Allow-Headers", "Content-Type");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.status = 204;
            return httplib::Server::HandlerResponse::Handled;
        }
        return httplib::Server::HandlerResponse::Unhandled;
    });

    svr.set_post_routing_handler([](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
    });

    // --- Start Server ---
    int port = 8080;
    std::cout << "Backend server starting on http://localhost:" << port << std::endl;
    if (!svr.listen("0.0.0.0", port)) {
        std::cerr << "Failed to start server!" << std::endl;
        return 1;
    }

    return 0;
}
