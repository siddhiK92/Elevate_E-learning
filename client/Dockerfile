FROM public.ecr.aws/docker/library/node:18 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM public.ecr.aws/docker/library/nginx:latest
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
