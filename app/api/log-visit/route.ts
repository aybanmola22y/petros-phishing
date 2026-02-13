import { NextRequest, NextResponse } from 'next/server';
import { sendPhishingLog, sendVictimDigest } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email, event } = await req.json();
    const log = {
      event: event || 'visited',
      email: email || null,
      timestamp: new Date().toISOString(),
    };

    // On Vercel, we can't reliably write to local files. 
    // Instead, we send an immediate email alert for simulation failures.
    if (event === 'simulation_failure') {
      const emailResult = await sendPhishingLog(log);

      if (!emailResult.success) {
        console.error('Failed to send email alert:', emailResult.error);
        return NextResponse.json({
          success: false,
          message: 'Email alert failed. Check Vercel environment variables.',
          error: String(emailResult.error)
        }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Victim recorded and alert email sent.' });
    }

    // For other events like 'page_visited', we just acknowledge quietly
    return NextResponse.json({ success: true, message: 'Event logged' });
  } catch (error) {
    console.error('Error in log-visit API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  // Manual trigger for a digest test
  const testVictims = [
    { email: "test-victim@example.com", timestamp: new Date().toISOString() }
  ];

  const result = await sendVictimDigest(testVictims);

  if (result.success) {
    return NextResponse.json({
      message: 'Digest test sent successfully to your configured RECIPIENT_EMAIL.'
    });
  } else {
    return NextResponse.json({
      message: 'Failed to send digest test. Ensure GMAIL_EMAIL, GMAIL_PASSWORD, and RECIPIENT_EMAIL are set.',
      error: result.error
    }, { status: 500 });
  }
}
