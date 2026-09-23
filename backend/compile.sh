#!/usr/bin/env bash
set -e

# Change to backend directory
cd "$(dirname "$0")"

# Ensure bin directory exists
mkdir -p bin

# Detect Java compiler
if command -v javac >/dev/null 2>&1; then
    JAVAC_CMD="javac"
elif [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/javac" ]; then
    JAVAC_CMD="$JAVA_HOME/bin/javac"
elif [ -x "/usr/local/opt/openjdk/bin/javac" ]; then
    JAVAC_CMD="/usr/local/opt/openjdk/bin/javac"
else
    echo "ERROR: javac not found in PATH or standard locations."
    exit 1
fi

echo "=== Compiling Mars Colony Simulation Backend ==="
echo "Using compiler: $($JAVAC_CMD -version 2>&1)"

# Find all Java source files and compile into bin/
SOURCES=$(find src -name "*.java")
$JAVAC_CMD -d bin -encoding UTF-8 $SOURCES

echo "=== Compilation Succeeded ==="
echo "Class files generated in: $(pwd)/bin"
