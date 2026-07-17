import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.payload) {
      return NextResponse.json(
        { error: "Missing required fields: name and payload" },
        { status: 400 },
      );
    }

    const newEvent = await prisma.event.create({
      data: {
        name: body.name,
        payload: body.payload,
      },
    });

    return NextResponse.json(
      { message: "Event received and stored", eventId: newEvent.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
