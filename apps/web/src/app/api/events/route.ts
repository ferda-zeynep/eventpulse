import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { eventQueue } from "../../../lib/queue";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        jobs: {
          select: {
            id: true,
            type: true,
            status: true,
            bullJobId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

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

    const job = await eventQueue.add(body.name, {
      eventId: newEvent.id,
      name: body.name,
      payload: body.payload,
    });

    await prisma.job.create({
      data: {
        eventId: newEvent.id,
        type: "PROCESS_EVENT",
        status: "PENDING",
        bullJobId: job.id,
        maxRetries: 3,
      },
    });

    return NextResponse.json(
      {
        message: "Event accepted and queued successfully",
        eventId: newEvent.id,
        bullJobId: job.id,
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
