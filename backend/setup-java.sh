#!/bin/bash
set -e

# Check if system java actually works
if javac -version >/dev/null 2>&1 && java -version >/dev/null 2>&1; then
    echo "Using system Java: $(java -version 2>&1 | head -n 1)"
    exit 0
fi

JDK_DIR="$(cd "$(dirname "$0")" && pwd)/.jdk"
if [ -x "$JDK_DIR/Contents/Home/bin/javac" ]; then
    echo "Using portable OpenJDK at $JDK_DIR"
    exit 0
fi

echo "No system Java detected. Downloading portable Adoptium Temurin OpenJDK 17 for macOS x64..."
mkdir -p "$JDK_DIR"
ARCHIVE="/tmp/temurin17-mac.tar.gz"
curl -L -f -s -o "$ARCHIVE" "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.20.1%2B1/OpenJDK17U-jdk_x64_mac_hotspot_17.0.20.1_1.tar.gz"

echo "Extracting OpenJDK 17..."
tar -xzf "$ARCHIVE" -C "$JDK_DIR" --strip-components=1
rm -f "$ARCHIVE"

echo "OpenJDK 17 setup complete at $JDK_DIR"
"$JDK_DIR/Contents/Home/bin/java" -version
