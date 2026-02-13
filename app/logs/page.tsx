"use client"
import { useEffect, useState } from "react";

type Log = {
  event: string;
  email: string | null;
  timestamp: string;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    fetch("/api/log-visit")
      .then((res) => res.json())
      .then((data) => setLogs(data));
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Visitor Logs</h1>
      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Event</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={index}>
              <td>{log.email || "(no email)"}</td>
              <td>{log.event}</td>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
