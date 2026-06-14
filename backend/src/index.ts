import express from 'express';
import si from 'systeminformation';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log(`Client connected : ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`Client disconnected : ${socket.id}`)
    });
});


async function streamMetrics() {
  try {
    const cpu = await si.currentLoad();
    const ram = await si.mem();

    const metrics = {
        cpu: {
            usage: cpu.currentLoad
        },
        ram: {
            total: ram.total,
            active: ram.active,
            usage: (ram.active / ram.total) * 100,
        },
        timestamp: Date.now()
    };

    io.emit('metrics-update', metrics);

  } catch (error) {
    console.error("Error getting metrics:", error);
  }
}

setInterval(streamMetrics, 2000);

httpServer.listen(PORT, () => {
  console.log(`Server is monitoring on http://localhost:${PORT}`);
});
