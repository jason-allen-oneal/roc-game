import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { 
          error: "Missing required fields",
          details: {
            email: !email ? "Email is required" : null,
            password: !password ? "Password is required" : null
          }
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          error: "User already exists",
          details: "An account with this email address already exists. Please use a different email or try logging in."
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    });

    return NextResponse.json(
      { 
        success: true,
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { 
        error: "Registration failed",
        details: error instanceof Error ? error.message : "An unexpected error occurred during registration"
      },
      { status: 500 }
    );
  }
} 