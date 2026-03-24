import { NextRequest, NextResponse } from 'next/server';
import { sendPhishingLog } from '@/lib/email';
import fs from 'fs';
import path from 'path';

const logsFilePath = path.resolve(process.cwd(), 'logs.json');
const victimsFilePath = path.resolve(process.cwd(), 'victims.json');

// Helper to append to JSON file
function appendToLogFile(filePath: string, entry: any) {
  try {
    let data = [];
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      data = content ? JSON.parse(content) : [];
    }
    data.push(entry);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Failed to write to ${filePath}:`, err);
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

    // 1. Always record to logs.json (for general history)
    appendToLogFile(logsFilePath, logEntry);

    // 2. If it's a simulation failure, also record to victims.json (for digest system)
    if (event === 'simulation_failure') {
      appendToLogFile(victimsFilePath, { email: logEntry.email, timestamp: logEntry.timestamp });
    }

    // 3. Send immediate email alert for simulation failures
    if (event === 'simulation_failure') {
      const emailResult = await sendPhishingLog(logEntry);

      if (!emailResult.success) {
        console.error('Failed to send email alert:', emailResult.error);
        // We still return success: true because we recorded it locally, 
        // but we include the error for debugging.
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
    if (!fs.existsSync(logsFilePath)) {
      return NextResponse.json([]);
    }

    const fileData = fs.readFileSync(logsFilePath, 'utf-8');
    const logs = JSON.parse(fileData);

    // Return the logs in reverse chronological order for the UI
    return NextResponse.json(Array.isArray(logs) ? logs.reverse() : []);
  } catch (error) {
    console.error('Error reading logs:', error);
    return NextResponse.json({ error: 'Failed to load logs' }, { status: 500 });
  }
}
