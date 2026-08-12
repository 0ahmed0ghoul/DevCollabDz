import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../database/prisma.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return user;
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.password
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  const accessToken = jwt.sign(
    {
      userId: user.id,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}