# ZeroCloud ⚡🛡️

> **Zero Cloud. Zero Servers. 100% Client-Side Compute.**

ZeroCloud is an interactive web-based benchmarking and privacy lab demonstrating that modern client devices possess the compute power and cryptographic capabilities to handle intensive workloads directly in the browser—eliminating cloud egress costs, server latency, and data privacy vulnerabilities.

---

## 🚀 Key Features

- **🔒 Zero-Knowledge File Inspector**: Inspect, calculate SHA-256 digests, and analyze metadata of local files entirely in-memory using the native Web Crypto API (`crypto.subtle`) without uploading a single byte to an external server.
- **⚡ Client-Side CPU Compute Benchmark**: Dispatches non-blocking numerical operations (vector dot products, matrix manipulations, and prime checks) to benchmark raw client floating-point throughput without locking the main UI thread.
- **🎮 Real-Time Canvas / GPU Engine**: Interactive canvas-based hardware rendering that visualizes real-time particle simulations and framerates powered by client GPU rasterization.
- **📊 Real-Time Network & Privacy Monitor**: Live telemetric verification demonstrating zero outgoing network requests during intensive compute and analytical workflows.

---

## 🛠️ Tech Stack

- **Framework**: React 18 / 19 (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Browser APIs**: Web Crypto API (`crypto.subtle`), HTML5 Canvas API, Performance API
- **Build Tooling**: Vite, ESLint

---

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Puneet-Kumar-Shivaay/zerocloud.git
   cd zerocloud
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Building for Production

To create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 🔒 Security & Privacy Architecture

- **No Remote Telemetry**: Zero analytics, external trackers, or remote telemetry collection.
- **Ephemeral Memory Allocation**: Uploaded files and generated memory buffers reside strictly in client RAM and are released immediately upon teardown or tab closure.
- **Sandboxed Execution**: All cryptographic hashes and vector benchmarks execute within the browser's native client security boundary.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).