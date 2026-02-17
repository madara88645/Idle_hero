FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npx expo install react-dom react-native-web typescript @types/react

COPY . .

EXPOSE 8081

# Bind to 0.0.0.0 to allow external access
ENV EXPO_WEBPACK_DEV_SERVER_HOST=0.0.0.0

CMD ["npx", "expo", "start", "--web", "--port", "8081", "--host", "lan"]
