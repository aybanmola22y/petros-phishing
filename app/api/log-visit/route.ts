import { NextRequest, NextResponse } from 'next/server';
import { sendPhishingLog } from '@/lib/email';
import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const logsFilePath = path.resolve(process.cwd(), 'logs.json');
const victimsFilePath = path.resolve(process.cwd(), 'victims.json');

// Helper to record an entry
async function recordEntry(logEntry: any) {
  // 1. Storage on Vercel (using KV)
  if (process.env.VERCEL) {
    try {
      // Store in a list called 'phishing_logs'
      await kv.lpush('phishing_logs', logEntry);
      console.log('Logged to Vercel KV');
    } catch (err) {
      console.error('Failed to write to Vercel KV:', err);
    }
    return;
  }

  // 2. Local Storage fallback (File System)
  try {
    let data = [];
    if (fs.existsSync(logsFilePath)) {
      const content = fs.readFileSync(logsFilePath, 'utf-8');
      data = content ? JSON.parse(content) : [];
    }
    data.push(logEntry);
    fs.writeFileSync(logsFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Failed to write to logs.json:`, err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, event } = await req.json();
    const logEntry = {
      event: event || 'visited',
      email: email || null,
      timestamp: new Date().toISOString(),
    };

    // Record the entry (KV or File)
    await recordEntry(logEntry);

    // Send immediate email alert for simulation failures
    if (event === 'simulation_failure') {
      const emailResult = await sendPhishingLog(logEntry);

      if (!emailResult.success) {
        console.error('Failed to send email alert:', emailResult.error);
        return NextResponse.json({
          success: true,
          recorded: true,
          emailSent: false,
          error: String(emailResult.error)
        });
      }

      return NextResponse.json({ success: true, message: 'Victim recorded and alert email sent.' });
    }

    return NextResponse.json({ success: true, message: 'Event logged' });
  } catch (error) {
    console.error('Error in log-visit API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 1. Fetch from Vercel KV if available
    if (process.env.VERCEL) {
      try {
        const logs = await kv.lrange('phishing_logs', 0, -1);
        return NextResponse.json(logs || []);
      } catch (err) {
        console.error('Failed to read from Vercel KV:', err);
        // Fallback to empty array if KV fails
        return NextResponse.json([]);
      }
    }

    // 2. Fetch from local file system
    if (!fs.existsSync(logsFilePath)) {
      return NextResponse.json([]);
    }

    const fileData = fs.readFileSync(logsFilePath, 'utf-8');
    const logs = JSON.parse(fileData);

    return NextResponse.json(Array.isArray(logs) ? logs.reverse() : []);
  } catch (error) {
    console.error('Error reading logs:', error);
    return NextResponse.json({ error: 'Failed to load logs' }, { status: 500 });
  }
}
