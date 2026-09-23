#!/usr/bin/env bash
set -e

# Change to backend directory
cd "$(dirname "$0")"

# Detect Java runtime
if command -v java >/dev/null 2>&1; then
    JAVA_CMD="java"
elif [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    JAVA_CMD="$JAVA_HOME/bin/java"
elif [ -x "/usr/local/opt/openjdk/bin/java" ]; then
    JAVA_CMD="/usr/local/opt/openjdk/bin/java"
else
    echo "ERROR: java not found in PATH or standard locations."
    exit 1
fi

# Auto-compile if bin is missing or Main.class does not exist
if [ ! -f "bin/colony/Main.class" ]; then
    echo "Binaries missing. Running compile.sh first..."
    ./compile.sh
fi

echo "=== Starting Mars Colony REST API Server ==="
$JAVA_CMD -cp bin colony.Main --server
