FROM node:8
EXPOSE 4000

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install
RUN npm install -g prisma
# migrate db to localhost://3306
# RUN prisma deploy

COPY . .

CMD [ "npm", "start" ]
