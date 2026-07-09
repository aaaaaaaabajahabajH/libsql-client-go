import Link from "next/link";
import { Search, UserX, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { listAdminUsers } from "@/services/admin/users";
import type { DbPlanType } from "@/types/database";

export const metadata = { title: "Admin — Users" };
export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  plan?: string;
  page?: string;
  suspended?: string;
}

const PLAN_BADGE: Record<string, string> = {
  free: "secondary",
  starter: "outline",
  pro: "default",
  enterprise: "default",
};

function UserSearch({ q, plan }: { q: string; plan: string }) {
  return (
    <form className="flex items-center gap-3 mb-6" method="get">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="pl-8"
        />
      </div>
      <Select name="plan" defaultValue={plan}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All plans" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All plans</SelectItem>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="starter">Starter</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" size="sm">Filter</Button>
    </form>
  );
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const plan = (params.plan ?? "all") as DbPlanType | "all";
  const page = Math.max(1, Number(params.page ?? "1"));

  const { users, total, totalPages } = await listAdminUsers({
    search: q,
    plan,
    page,
    pageSize: 20,
  });

  return (
    <>
      <PageHeader
        title="Users"
        description={`${total.toLocaleString()} total users`}
      />

      <UserSearch q={q} plan={plan} />

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Credits</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  <UserX className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No users found
                </td>
              </tr>
            )}
            {users.map((user) => {
              const initials = (user.full_name ?? user.email)
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium leading-none">
                          {user.full_name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant={PLAN_BADGE[user.plan] as "default" | "secondary" | "outline" ?? "secondary"} className="capitalize text-[11px]">
                      {user.plan}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {user.credits
                      ? `${user.credits.balance.toLocaleString()} / ${user.credits.monthly_allowance >= 999_999 ? "∞" : user.credits.monthly_allowance.toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {new Date(user.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.is_suspended ? "suspended" : "active"} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/users/${user.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page <= 1}
            >
              <Link href={`?q=${q}&plan=${plan}&page=${page - 1}`}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
            >
              <Link href={`?q=${q}&plan=${plan}&page=${page + 1}`}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
