FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# Install Angular CLI and Firebase CLI globally
# We use 'su node' to install global packages for the non-root user if we wanted them in their home, 
# but installing as root to /usr/local/lib/node_modules is standard for dev containers so they are in PATH.
RUN npm install -g @angular/cli firebase-tools

# Optional: Install other global tools if needed
# RUN npm install -g <your-package-here>
