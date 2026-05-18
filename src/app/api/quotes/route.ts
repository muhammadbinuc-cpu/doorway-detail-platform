// 🔒 src/app/api/quotes/route.ts - Quote Submission API with Rate Limiting
// Protected by: rate limiting, input validation

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { rateLimitResponse } from '@/lib/rate-limit';
import { QuoteSchema } from '@/lib/validation';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    // 🔒 Rate limiting: 5 quotes per 15 minutes, 1hr block after exceeding
    const rateLimited = await rateLimitResponse('quote');
    if (rateLimited) return rateLimited;

    const body = await request.json();

    // 🔒 Validate and sanitize input with Zod
    let validated;
    try {
      validated = QuoteSchema.parse({
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        service: body.service
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        return NextResponse.json(
          { error: `${firstError.path.join('.')}: ${firstError.message}` },
          { status: 400 }
        );
      }
      throw error;
    }

    // 🔒 Write to Firestore with validated/sanitized data
    const docRef = await addDoc(collection(db, 'jobs'), {
      customerName: validated.name,
      serviceType: validated.service,
      address: validated.address,
      phone: validated.phone,
      email: validated.email,
      status: 'LEAD_RECEIVED', // 🔒 FSM initial state
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error) {
    // 🔒 Log error internally, return generic message
    console.error('Error adding document:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}