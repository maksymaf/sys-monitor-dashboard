import { useState, useEffect } from "react";
import { io, Socket } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MetricData {
  cpu: { usage: number };
  ram: { total: number; active: number; usage: number };
  disks: Array<{
    fs: string;
    mount: string;
    size: number;
    used: number;
    use: number;
  }>;
  timestamp: number;
}

export default function App() {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [history, setHistory] = useState<MetricData[]>([]);

  useEffect(() => {
    const socket : Socket = io('http://localhost:5000');

    socket.on('metrics-update', (data : MetricData) => {
      setMetrics(data);

      setHistory((prevHistory) => {
        const updatedHistory = [...prevHistory, data];

        if (updatedHistory.length > 20){
          updatedHistory.shift();
        }

        return updatedHistory;
      });
    });

    return () => {
      socket.disconnect();
    }
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };
  
return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-ctp-lavender">Metrics Dashboard</h1>
        <p className="text-ctp-subtext text-sm">Real-time metrics of your server</p>
      </header>

      {!metrics ? (
        <div className="text-center py-20 text-ctp-subtext animate-pulse text-xl">
          Connecting to monitoring agent...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-ctp-surface p-6 rounded-xl border border-ctp-overlay shadow-xl">
            <h2 className="text-xl font-semibold mb-2 text-ctp-text">CPU Usage</h2>
            <div className="text-4xl font-black text-ctp-green mb-4">
              {metrics.cpu.usage.toFixed(1)}%
            </div>
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#51576d" />
                  <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#a5adce" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#a5adce" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#414559', borderColor: '#51576d', color: '#c6d0f5' }} 
                    labelFormatter={formatTime}
                  />
                  <Line type="monotone" dataKey="cpu.usage" stroke="#a6d189" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-ctp-surface p-6 rounded-xl border border-ctp-overlay shadow-xl">
            <h2 className="text-xl font-semibold mb-2 text-ctp-text">RAM Usage</h2>
            <div className="text-4xl font-black text-ctp-blue mb-1">
              {metrics.ram.usage.toFixed(1)}%
            </div>
            <div className="text-xs text-ctp-subtext mb-4">
              {(metrics.ram.active / 1024 / 1024 / 1024).toFixed(2)} GB / {(metrics.ram.total / 1024 / 1024 / 1024).toFixed(2)} GB
            </div>
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#51576d" />
                  <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#a5adce" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#a5adce" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#414559', borderColor: '#51576d', color: '#c6d0f5' }} 
                    labelFormatter={formatTime}
                  />
                  <Line type="monotone" dataKey="ram.usage" stroke="#8caaee" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-ctp-surface p-6 rounded-xl border border-ctp-overlay shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-ctp-text">Storage Usage</h2>
            
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {metrics.disks.map((disk, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs text-ctp-subtext">
                    <span className="font-bold truncate max-w-[150px]">{disk.mount} ({disk.fs})</span>
                    <span>
                      {(disk.used / 1024 / 1024 / 1024).toFixed(1)} GB / {(disk.size / 1024 / 1024 / 1024).toFixed(1)} GB
                    </span>
                  </div>
                  
                  <div className="w-full bg-ctp-base rounded-full h-4 overflow-hidden border border-ctp-overlay">
                    <div 
                      className="bg-ctp-lavender h-full rounded-full transition-all duration-500"
                      style={{ width: `${disk.use}%` }}
                    />
                  </div>
                  
                  <div className="text-right text-xs font-bold text-ctp-lavender">
                    {disk.use.toFixed(1)}% used
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
