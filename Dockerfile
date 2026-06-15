# Step 1: Use an official Node.js 16 image to build the app
FROM node:20-alpine AS build

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Step 4: Install dependencies
RUN npm install --legacy-peer-deps

# Step 4.1: Verify TypeScript version (optional, for debugging)
RUN npm list typescript

# Step 5: Copy the rest of the app files
COPY . .

# Step 6: Build the Angular app for production
RUN npm run build -- --configuration production

# Step 7: Use a lightweight web server to serve the app
FROM nginx:alpine

# Step 8: Copy the custom Nginx configuration into the conf.d folder (not nginx.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Step 9: Test the Nginx configuration
RUN nginx -t

# Step 10: Copy the built app from the build stage to Nginx's public folder
COPY --from=build /app/dist/ng-tailadmin/browser/ /usr/share/nginx/html

# Step 11: Expose port 80
EXPOSE 80

# Step 12: Start the Nginx server to serve the app
CMD ["nginx", "-g", "daemon off;"]