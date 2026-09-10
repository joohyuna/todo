import { z } from "zod";

// 클라이언트 폼(react-hook-form + zodResolver)과 서버 API(route handler)에서
// 같은 규칙을 공유하기 위한 단일 소스.

export const loginSchema = z.object({
  email: z.email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

export const registerSchema = z.object({
  email: z.email("올바른 이메일 형식이 아닙니다."),
  nickname: z
    .string()
    .trim()
    .min(2, "닉네임은 2자 이상이어야 합니다.")
    .max(20, "닉네임은 20자 이하여야 합니다."),
  password: z
    .string()
    .min(6, "비밀번호는 6자 이상이어야 합니다.")
    .max(72, "비밀번호는 72자 이하여야 합니다."), // bcrypt 72바이트 경계
});

export const todoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "할 일 내용을 입력하세요.")
    .max(200, "할 일은 200자 이하여야 합니다."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD 여야 합니다."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type TodoInput = z.infer<typeof todoSchema>;
