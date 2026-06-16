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

io.on('connection', async (socket) => {
    console.log(`Client connected : ${socket.id}`);

    try {
        const osData = await si.osInfo();
        
        socket.emit("system-init", {
            hostname: osData.hostname,
            os: `${osData.distro} ${osData.release} (${osData.arch})`,
            bootTime: Date.now() - (si.time().uptime * 1000)
        });
    }catch (error) {
        console.error("Error while getting system data:", error);
    }

    socket.on('disconnect', () => {
        console.log(`Client disconnected : ${socket.id}`)
    });
});


async function streamMetrics() {
  try {
    const cpu = await si.currentLoad();
    const ram = await si.mem();
    const disks = await si.fsSize();

    const mainDisks = disks.filter(disk => disk.mount === '/' || disk.fs.startsWith('/dev/'));

    const metrics = {
        cpu: {
            usage: cpu.currentLoad
        },
        ram: {
            total: ram.total,
            active: ram.active,
            usage: (ram.active / ram.total) * 100,
        },

        disks: mainDisks.map(disk => ({
            fs: disk.fs,
            mount: disk.mount,
            size: disk.size,
            used: disk.used,
            use: disk.use
        })),

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
