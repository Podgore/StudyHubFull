FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

ARG REACT_APP_API_ORIGIN=http://localhost:5209
ENV REACT_APP_API_ORIGIN=$REACT_APP_API_ORIGIN
ARG REACT_APP_USE_GATEWAY=0
ENV REACT_APP_USE_GATEWAY=$REACT_APP_USE_GATEWAY

COPY public ./public
COPY src ./src
COPY tsconfig.json ./

RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
