#include <gtest/gtest.h>
#include <iostream>

// A simple test to ensure GTest is set up correctly.
TEST(HelloTest, BasicAssertions) {
    // Expect two strings not to be equal.
    EXPECT_STRNE("hello", "world");
    // Expect equality.
    EXPECT_EQ(7 * 6, 42);
}

// You can add more tests for your backend logic here.
// For example, testing the JSON parsing, API handlers (by mocking requests), etc.
