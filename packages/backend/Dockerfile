FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
# CEF dev server hardcodes host="localhost" — patch it to bind on all interfaces
# so other containers can reach it via Docker networking
RUN sed -i 's/const host = "localhost"/const host = "0.0.0.0"/' \
    node_modules/commoneventframework/dist/dev/devServ.js
COPY . .
EXPOSE 8888
CMD sh -c "npm run migrate && npm run seed && npx ts-node src/index.ts --local"
