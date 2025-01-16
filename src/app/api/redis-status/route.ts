import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    available: !!process.env.REDIS_URL
  })
} 