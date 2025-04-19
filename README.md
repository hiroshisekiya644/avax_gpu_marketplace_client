# AVAX GPU Marketplace Frontend

This is the frontend for the AVAX GPU Marketplace built with **Next.js**, **Tailwind CSS**, and **TypeScript**. It interfaces with the backend for GPU listings, user authentication, payments, and real-time VM status. 

## ✨ Features

- User dashboard to manage GPU rentals
- Login/Signup with Google
- Real-time GPU and balance updates using WebSocket
- Display of available GPUs with pricing (fetched from Hyperstack)
- Crypto deposit using AVAX and USDT
- SSH key management UI

## 🛠 Tech Stack

- Next.js (App Router)
- Tailwind CSS
- TypeScript
- Socket.IO Client
- Web3 / NowPayments Integration

## 🚀 Getting Started

### Installation

```bash
git clone https://github.com/hiroshisekiya644/avax_gpu_marketplace_client.git
cd avax_gpu_marketplace_client
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── components/        # UI components
├── pages/             # Next.js pages (App Router)
├── hooks/             # Custom hooks
├── services/          # API service layers
├── utils/             # Utilities and helpers
```

## 📦 Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_SOCKET_URL=http://localhost:8081
NEXT_PUBLIC_NOWPAYMENTS_KEY=...
```
