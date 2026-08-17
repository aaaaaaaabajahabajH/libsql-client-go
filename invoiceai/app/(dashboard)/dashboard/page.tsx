import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>لوحة التحكم</CardTitle>
          <CardDescription>مسجّل الدخول باسم {user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            قيد الإنشاء — مرحلة Dashboard: إجمالي المبيعات، المستحقات، الفواتير
            المدفوعة/المتأخرة، رسم بياني، آخر الفواتير.
          </p>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}
