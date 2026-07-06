FROM node:20
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
COPY . .
EXPOSE 4000
CMD ["node", "dist/index.js"]
