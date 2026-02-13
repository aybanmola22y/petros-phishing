import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const victimsFilePath = path.resolve(process.cwd(), 'victims.json');

export async function POST(req: NextRequest) {
  try {
    const { email, event } = await req.json();
    const log = {
      event: event || 'visited',
      email: email || null,
      timestamp: new Date().toISOString(),
    };

    // Only collect data for simulation failures for the digest
    if (event === 'simulation_failure') {
      let victims = [];
      try {
        if (fs.existsSync(victimsFilePath)) {
          const fileData = fs.readFileSync(victimsFilePath, 'utf-8');
          victims = JSON.parse(fileData);
        }
      } catch (error) {
        console.error('Error reading victims file:', error);
      }

      victims.push(log);

      try {
        fs.writeFileSync(victimsFilePath, JSON.stringify(victims, null, 2));
      } catch (error) {
        console.error('Error writing to victims file:', error);
      }

      return NextResponse.json({ success: true, message: 'Victim recorded for digest' });
    }

    // For other events like 'page_visited', we just acknowledge quietly
    return NextResponse.json({ success: true, message: 'Event logged' });
  } catch (error) {
    console.error('Error in log-visit API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  // Since we are no longer using logs.json, the GET request for logs
  // can either be removed or modified to indicate it's disabled.
  return NextResponse.json({
    message: 'Persistent JSON logging is disabled. Logs are now sent via email.'
  }, { status: 200 });
}
