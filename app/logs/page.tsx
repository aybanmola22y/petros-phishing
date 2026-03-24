"use client"
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, Mail } from "lucide-react";

type Log = {
  event: string;
  email: string | null;
  timestamp: string;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/log-visit");
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        console.error("Unexpected log data format:", data);
        setError("Failed to load logs. Invalid data format.");
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setError("Failed to connect to the log server.");
    } finally {
      setLoading(false);
    }
  };

  const triggerTestEmail = async () => {
    setTestSending(true);
    setTestMessage(null);
    try {
      const res = await fetch("/api/admin/test-email");
      const data = await res.json();
      if (data.success) {
        setTestMessage("✅ Test email sent! Check your inbox.");
      } else {
        setTestMessage(`❌ Failed: ${data.error || data.message}`);
      }
    } catch (err) {
      setTestMessage("❌ Connection error during test.");
    } finally {
      setTestSending(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <Card className="max-w-6xl mx-auto border-white/10 bg-slate-900 shadow-2xl">
        <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <CardTitle className="text-3xl font-black text-white uppercase italic tracking-tight">
              Phishing <span className="text-red-600">Visitor Logs</span>
            </CardTitle>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mt-1">
              Internal Security Monitoring System
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              onClick={triggerTestEmail} 
              disabled={testSending}
              className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5 uppercase text-xs font-bold tracking-widest h-10 px-6 rounded-xl"
            >
              {testSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Send Test Email
            </Button>
            
            <Button 
              onClick={fetchLogs} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-500 text-white uppercase text-xs font-bold tracking-widest h-10 px-6 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.3)]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {testMessage && (
            <div className={`mb-6 p-4 rounded-xl font-mono text-sm border ${
              testMessage.startsWith('✅') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {testMessage}
            </div>
          )}

          {error && (
            <div className="text-center py-12 bg-red-500/5 rounded-2xl border border-red-500/10">
              <p className="text-red-400 font-mono text-sm">{error}</p>
              <Button variant="link" onClick={fetchLogs} className="text-red-600 uppercase text-xs mt-2">Try Again</Button>
            </div>
          )}

          {loading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
              <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Decrypting local records...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl">
              <p className="text-slate-600 font-mono text-sm uppercase tracking-widest italic">No surveillance data recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-black/50 text-left border-b border-white/5">
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Target Email</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action Event</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-black/20">
                  {logs.map((log, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 font-mono text-sm">
                        {log.email ? (
                          <span className="text-blue-400 group-hover:text-blue-300 transition-colors">{log.email}</span>
                        ) : (
                          <span className="text-slate-700 italic">UNKNOWN_USER_ID</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          log.event === 'simulation_failure' 
                            ? 'bg-red-500/20 text-red-500 border border-red-500/30' 
                            : 'bg-slate-800 text-slate-400 border border-white/10'
                        }`}>
                          {log.event.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
