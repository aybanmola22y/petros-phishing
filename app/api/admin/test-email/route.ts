import { NextResponse } from 'next/server';
import { sendVictimDigest, verifyConnection } from '@/lib/email';

export async function GET() {
  console.log('Manual email test triggered via /api/admin/test-email');
  
  // 1. Verify connection first
  const connection = await verifyConnection();
  if (!connection.success) {
    return NextResponse.json({
      success: false,
      message: 'SMTP Connection Failed. Verify GMAIL_EMAIL and GMAIL_PASSWORD.',
      error: connection.error,
      user: process.env.GMAIL_EMAIL ? `${process.env.GMAIL_EMAIL.substring(0, 3)}...` : 'not set'
    }, { status: 500 });
  }

  const testVictims = [
    { email: "test-notification@example.com", timestamp: new Date().toISOString() }
  ];

  const result = await sendVictimDigest(testVictims);

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: 'Connection verified and test email sent!',
      recipient: process.env.RECIPIENT_EMAIL
    });
  } else {
    return NextResponse.json({
      success: false,
      message: 'Connection was OK, but sending failed.',
      error: result.error
    }, { status: 500 });
  }
}
