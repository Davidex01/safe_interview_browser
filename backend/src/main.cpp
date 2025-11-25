#include <httplib.h>
#include <nlohmann/json.hpp>
#include <iostream>
#include <string>
#include <vector>

// Use nlohmann::json for convenience
using json = nlohmann::json;

// --- Mock Database ---
// In a real application, this would be a proper database (e.g., SQLite, PostgreSQL).
// For the hackathon, we'll use in-memory data structures.

// Represents a candidate's code submission
struct Submission {
    std::string code;
    std::string language;
    // Add other relevant fields like timestamps, results, etc.
};

// Represents an interview session
struct InterviewSession {
    std::string candidateId;
    std::vector<std::string> taskIds;
    int currentTaskIndex = 0;
    std::vector<Submission> submissions;
    // Add other session data like start/end times, anti-cheating flags, etc.
};

// --- SciBox LLM Client ---
// A simple function to interact with the SciBox LLM API.
// In a real app, this would be more robust, with error handling, etc.
std::string ask_scibox(const std::string& prompt) {
    // The SciBox API endpoint provided in the documentation
    httplib::Client cli("http://sk-MDFGBTPrukY4IRJEmEFVhg:11434"); // IMPORTANT: Replace <IP> with the actual IP
    cli.set_connection_timeout(60); // 60 seconds timeout

    json request_body = {
        {"model", "gwen2-32b-awq"},
        {"stream", false},
        {"messages", {
            {{"role", "user"}, {"content", prompt}}
        }}
    };

    if (auto res = cli.Post("/api/chat", request_body.dump(), "application/json")) {
        if (res->status == 200) {
            try {
                json response_json = json::parse(res->body);
                return response_json["message"]["content"].get<std::string>();
            } catch (const json::parse_error& e) {
                return "Error: Failed to parse LLM response.";
            }
        } else {
            return "Error: Received status " + std::to_string(res->status) + " from LLM service.";
        }
    } else {
        auto err = res.error();
        return "Error: Failed to connect to LLM service: " + httplib::to_string(err);
    }
}

// --- Main Application ---
int main() {
    // Create an HTTP server instance
    httplib::Server svr;

    // --- API Endpoints ---

    // GET /api/health - A simple health check endpoint
    svr.Get("/api/health", [](const httplib::Request&, httplib::Response& res) {
        json response = {
            {"status", "ok"},
            {"message", "Backend is running"}
        };
        res.set_content(response.dump(), "application/json");
    });

    // POST /api/interview/submit - Endpoint for code submission
    svr.Post("/api/interview/submit", [](const httplib::Request& req, httplib::Response& res) {
        json response;
        try {
            json body = json::parse(req.body);
            std::string code = body.at("code");
            std::string language = body.at("language");

            // TODO: Implement secure code execution in a Docker container.
            // For now, we'll just simulate it and send the code to the LLM for analysis.

            std::cout << "Received code in " << language << ":\n" << code << std::endl;

            // Example of using the LLM to analyze the code
            std::string prompt = "Analyze the following C++ code for correctness, style, and potential bugs. Provide a short summary.\n\n```cpp\n" + code + "\n```";
            std::string analysis = ask_scibox(prompt);

            response = {
                {"status", "success"},
                {"message", "Code received and sent for analysis."},
                {"analysis", analysis},
                {"test_results", { // Mock test results
                    {"visible_tests", {
                        {"test_1", "passed"},
                        {"test_2", "passed"}
                    }},
                    {"hidden_tests", "passed"} // Simplified result
                }}
            };
            res.set_content(response.dump(), "application/json");

        } catch (const json::parse_error& e) {
            res.status = 400;
            response = {{"error", "Invalid JSON format"}};
            res.set_content(response.dump(), "application/json");
        } catch (const json::out_of_range& e) {
            res.status = 400;
            response = {{"error", "Missing required fields (e.g., 'code', 'language')"}};
            res.set_content(response.dump(), "application/json");
        }
    });
    
    // POST /api/anticheat/event - Endpoint to log potential cheating events
    svr.Post("/api/anticheat/event", [](const httplib::Request& req, httplib::Response& res) {
        try {
            json body = json::parse(req.body);
            std::string event_type = body.at("event_type"); // e.g., "focus_lost", "paste"
            
            // In a real app, you would log this event to the user's session for later review.
            std::cout << "[Anti-Cheat] Received event: " << event_type << std::endl;
            if (body.contains("details")) {
                std::cout << "  Details: " << body["details"].dump() << std::endl;
            }

            res.set_content(json{{"status", "logged"}}.dump(), "application/json");

        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", "Invalid request"}}.dump(), "application/json");
        }
    });


    // --- CORS Middleware ---
    // This is crucial for allowing the frontend (running on a different port) to communicate with the backend.
    svr.set_logger([](const httplib::Request& req, const httplib::Response& res) {
        // You can add logging here if you want to see requests.
        // For example: std::cout << "Request: " << req.method << " " << req.path << std::endl;
    });

    svr.set_pre_routing_handler([](const httplib::Request& req, httplib::Response& res) {
        // Handle OPTIONS requests for CORS preflight
        if (req.method == "OPTIONS") {
            res.set_header("Access-Control-Allow-Origin", "*"); // In production, restrict this to your frontend's domain
            res.set_header("Access-Control-Allow-Headers", "Content-Type");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.status = 204; // No Content
            return httplib::Server::HandlerResponse::Handled;
        }
        return httplib::Server::HandlerResponse::Unhandled;
    });

    svr.set_post_routing_handler([](const httplib::Request&, httplib::Response& res) {
        // Add CORS header to all responses
        res.set_header("Access-Control-Allow-Origin", "*"); // In production, restrict this to your frontend's domain
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
