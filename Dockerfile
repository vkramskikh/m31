FROM node:8.9.0-slim
ADD ./ /app
WORKDIR /app
RUN npm install
ENTRYPOINT [ "npm", "start", "--", "--data-dir", "/app/data", "--host", "0.0.0.0" ]

