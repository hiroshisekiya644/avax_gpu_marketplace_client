Based on your project files, here are two `README.md` files — one for the backend and one for the frontend of your AVAX GPU Marketplace project.

---

### 🔧 Backend (`avax-gpu-marketplace-backend`) – `README.md`

```markdown
# AVAX GPU Marketplace Backend

This is the backend service for the AVAX GPU Marketplace, built with Node.js and Express. It handles GPU deployments via Hyperstack, user authentication, SSH key management, payments, and WebSocket integration for real-time updates.

## 📦 Features

- GPU rental deployment via Hyperstack API
- WebSocket (Socket.IO) for real-time VM status and balance updates
- SSH key management with per-region support
- Integration with crypto payment systems using AVAX and USDT
- User authentication including Google OAuth
- Admin panel support for pre-created GPU environments
- Redis Pub/Sub architecture to decouple HTTP and WebSocket servers

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16
- Redis server (for pub/sub)
- Supabase project setup
- Hyperstack API credentials

### Installation

```bash
git clone https://github.com/your-repo/avax_gpu_marketplace_backend.git
cd avax_gpu_marketplace_backend
npm install
```

### Running the Server

```bash
npm start
```

This will run the backend server using `nodemon` with entrypoint at `api/index.js`.

## 🧩 Project Structure

```
api/                # Main server entry and routes
app/                # Application logic (controllers, services)
contracts/          # Smart contract interactions (if any)
dockerfile          # Docker config
```

## 🛠 Environment Variables

Create a `.env` file for your secrets:

```
SUPABASE_URL=...
SUPABASE_KEY=...
HYPERSTACK_API_KEY=...
REDIS_URL=...
JWT_SECRET=...
CALLBACK_BASE_URL=...
```

## 🧪 Testing

```bash
# (Not implemented yet)
npm test
```
