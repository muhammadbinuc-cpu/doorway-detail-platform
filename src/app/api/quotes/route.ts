// src/app/api/quotes/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, service, address, phone } = body;

    // 1. Validation
    if (!name || !service || !address || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 2. The FSM Logic (Writing to Firestore)
    const docRef = await addDoc(collection(db, 'jobs'), {
      customerName: name,
      serviceType: service,
      address: address, 
      phone: phone,
      status: 'LEAD_RECEIVED', // <--- The Resume "FSM" Claim
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error) {
    console.error('Error adding document: ', error);
   return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} // <--- Make sure it looks like this (no extra symbols)git init