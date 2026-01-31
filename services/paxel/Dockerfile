# Base Image
FROM node:20-bookworm

# 1. Install XeLaTeX and Dependencies
# texlive-xetex: The engine
# texlive-lang-korean: For KoTeX support
# fonts-nanum: Korean fonts
# --no-install-recommends: Keep image size smaller
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-xetex \
    texlive-lang-korean \
    fonts-nanum \
    && rm -rf /var/lib/apt/lists/*

# 2. Setup App
WORKDIR /app

# 3. Create non-root user
# Node image comes with 'node' user (uid 1000). We just ensure perms.
RUN chown node:node /app

# 4. Copy Code
COPY --chown=node:node package.json .
COPY --chown=node:node tsconfig.json .
# Assuming 'npm install' or 'bun install' happens before build or here.
# Since we are in a monorepo context usually, dependencies might be tricky if not bundled.
# But "Single Dockerfile under services/paxel/" suggests it should be standalone-buildable or context-aware.
# We will assume standalone build capability for simplicity, OR copy node_modules if we run from root.
# Standard pattern: Install dependencies inside docker.
RUN npm install

COPY --chown=node:node src ./src

# 5. Build
RUN npm run build

# 6. Runtime Config
USER node
ENV PORT=3000
EXPOSE 3000

# 7. Start
CMD ["npm", "start"]
