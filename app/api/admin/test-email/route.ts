import { NextResponse } from 'next/server';
import { sendVictimDigest } from '@/lib/email';

export async function GET() {
  const testVictims = [
    { email: "test-notification@example.com", timestamp: new Date().toISOString() }
  ];

  console.log('Manual email test triggered via /api/admin/test-email');
  const result = await sendVictimDigest(testVictims);

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully to your configured RECIPIENT_EMAIL.',
      recipient: process.env.RECIPIENT_EMAIL
    });
  } else {
    return NextResponse.json({
      success: false,
      message: 'Failed to send test email. Check your SMTP configuration and server logs.',
      error: result.error
    }, { status: 500 });
  }
}
