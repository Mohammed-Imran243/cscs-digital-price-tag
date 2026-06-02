# CSCS Digital Price Tag (ESL Connect App)

This repository contains the CSCS Digital Price Tag platform, consisting of a Java Spring Boot backend and a React (Vite) frontend UI. Follow this guide to set up the project from scratch on a new system after cloning.

## 📋 Prerequisites
Before you begin, ensure your new system has the following installed:
- **Git**
- **Java Development Kit (JDK) 17 or 21**
- **Node.js** (v18.x or v20.x recommended)
- **npm** (comes with Node.js)
- **Docker & Docker Compose** (Optional, for containerized deployment)

---

## 🚀 Step 1: Clone the Repository

```bash
git clone https://github.com/Mohammed-Imran243/cscs-digital-price-tag.git
cd cscs-digital-price-tag
```

---

## ⚙️ Step 2: Set up the Java Backend

The backend is a Spring Boot application built with Gradle that proxies requests and handles authentication with Dragon ESL cloud.

1. **Navigate to the backend directory:**
   ```bash
   cd cscs-digital-price-tag
   ```

2. **Run the Spring Boot application:**
   You don't need to install Gradle manually; the project includes a Gradle wrapper. Run the following command depending on your OS:

   **On Windows:**
   ```powershell
   .\gradlew.bat bootRun
   ```

   **On macOS / Linux:**
   ```bash
   ./gradlew bootRun
   ```

   *Note: On first run, Gradle will automatically download the necessary wrapper files and dependencies, which may take a few minutes.*

3. **Verify Backend Status:**
   The backend runs on **port 8080** by default. Once you see `Started [ApplicationName] in X seconds`, the API is ready.

---

## 💻 Step 3: Set up the React Frontend

The frontend is a React application built with Vite, TypeScript, and styled with vanilla CSS.

1. **Open a new terminal window** (leave the backend running) and navigate to the frontend directory from the root:
   ```bash
   cd cscs-digital-platform-ui
   ```

2. **Install Node modules (packages):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the Web App:**
   The Vite server will typically start on **port 5173**. Open your browser and navigate to:
   [http://localhost:5173](http://localhost:5173)

---

## 🐳 Step 4: Docker Deployment (Alternative)

If you prefer to run both the backend and frontend in isolated containers without installing Java or Node.js locally, you can use the provided Docker Compose configuration.

1. Ensure Docker Desktop is running.
2. From the **root** directory of the project, run:
   ```bash
   docker-compose up --build -d
   ```
3. Once built and started:
   - The **Backend** will be accessible on `http://localhost:8080`
   - The **Frontend** will be accessible on `http://localhost:5173`

*(To stop the containers, run `docker-compose down`)*

---

## 📁 Project Structure Quick Reference
- `/cscs-digital-price-tag/` - Java Spring Boot backend (Controllers, Services, Security Config).
- `/cscs-digital-platform-ui/` - React frontend (Pages, Components, API logic).
- `/docker-compose.yml` - Orchestration for easy deployment.