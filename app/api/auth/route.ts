import { NextResponse } from 'next/server';
import { getAcademiaData } from '@/lib/scraper';

export async function POST(req: Request) {
  try {
    const { netid, password } = await req.json();

    if (!netid || !password) {
      return NextResponse.json({ message: "Credentials required" }, { status: 400 });
    }

    const data = await getAcademiaData(netid, password);

    return NextResponse.json({ 
      success: true, 
      attendance: data 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to fetch data" 
    }, { status: 500 });
  }
}