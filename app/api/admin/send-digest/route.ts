import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sendVictimDigest } from '@/lib/email';

const victimsFilePath = path.resolve(process.cwd(), 'victims.json');

export async function GET() {
    try {
        if (!fs.existsSync(victimsFilePath)) {
            return NextResponse.json({ message: 'No victims recorded yet.' });
        }

        const fileData = fs.readFileSync(victimsFilePath, 'utf-8');
        const victims = JSON.parse(fileData);

        if (victims.length === 0) {
            return NextResponse.json({ message: 'No new victims to report.' });
        }

        const result = await sendVictimDigest(victims);

        if (result.success) {
            // Clear the victims file after successful digest
            fs.writeFileSync(victimsFilePath, JSON.stringify([], null, 2));
            return NextResponse.json({
                success: true,
                message: `Digest sent successfully for ${victims.length} victims. List cleared.`
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'Failed to send digest email.',
                error: result.error
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in send-digest API:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
