# Multi-stage build for lottery prediction website
# Constitutional compliance: Ethical AI with responsible gambling

# Backend Python stage
FROM python:3.11-slim as backend

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ .

# Set environment variables for constitutional compliance
ENV FLASK_ENV=production
ENV ETHICAL_COMPLIANCE_ENABLED=true
ENV MAX_PREDICTION_CONFIDENCE=0.85
ENV RESPONSIBLE_GAMBLING_REQUIRED=true

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "run:app"]

# Frontend Node.js stage
FROM node:18-alpine as frontend

# Set working directory
WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend application code
COPY frontend/ .

# Build the frontend application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine as production

# Copy frontend build to nginx
COPY --from=frontend /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]