import AuthForm from "@/components/AuthForm";

export const metadata = { title: "로그인 · 일간 ToDo" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;

  return (
    <AuthForm
      mode="login"
      notice={
        registered ? "가입이 완료되었습니다. 로그인해 주세요." : undefined
      }
    />
  );
}
