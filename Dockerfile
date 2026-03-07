# eclipse-temurin:21-jre-jammy = Java 21 on Ubuntu 22.04, supports arm64
FROM eclipse-temurin:21-jre-jammy

# Install Node.js 20 via NodeSource
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Firebase CLI and Claude Code CLI globally
RUN npm install -g firebase-tools @anthropic-ai/claude-code

# Create a non-root user (required for --dangerously-skip-permissions)
RUN useradd -m -u 1001 appuser

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files (file isolation: changes stay inside the container)
COPY . .

# Transfer ownership to non-root user
RUN chown -R appuser:appuser /app

USER appuser

# Firebase emulator ports: Auth (9099), Firestore (8080), Emulator UI (4000)
EXPOSE 9099 8080 4000

# Set emulator flag so firebase.ts connects to local emulators
ENV FIREBASE_EMULATOR=true

# Default: start Firebase emulators
CMD ["npx", "firebase", "emulators:start", "--only", "auth,firestore", "--project", "demo-ziptaxi"]
