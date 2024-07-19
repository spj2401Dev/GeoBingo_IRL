FROM node:21

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8000 8000
EXPOSE 8080 8080

CMD ["npm", "start"]
