"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  suspendUserAction,
  deleteUserAction,
  resetCreditsAction,
  changePlanAction,
} from "@/actions/admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserActionsProps {
  userId: string;
  isSuspended: boolean;
  currentPlan: string;
  currentBalance: number;
  currentAllowance: number;
}

export function UserActions({
  userId,
  isSuspended,
  currentPlan,
  currentBalance,
  currentAllowance,
}: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Credits dialog
  const [creditsOpen, setCreditsOpen] = React.useState(false);
  const [newBalance, setNewBalance] = React.useState(String(currentBalance));
  const [newAllowance, setNewAllowance] = React.useState(String(currentAllowance));

  // Plan dialog
  const [planOpen, setPlanOpen] = React.useState(false);
  const [plan, setPlan] = React.useState(currentPlan);

  async function run(key: string, fn: () => Promise<{ success: boolean; error?: string }>) {
    setLoading(key);
    setError(null);
    const result = await fn();
    setLoading(null);
    if (!result.success) {
      setError(result.error ?? "Action failed");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {/* Suspend / Unsuspend */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={!!loading} size="sm" variant={isSuspended ? "outline" : "outline"}>
              {loading === "suspend" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSuspended ? "Unsuspend" : "Suspend"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isSuspended ? "Unsuspend user?" : "Suspend user?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isSuspended
                  ? "The user will regain access to the platform."
                  : "The user will be signed out from all devices and lose access."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  run("suspend", () => suspendUserAction(userId, !isSuspended))
                }
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset credits */}
        <Button size="sm" variant="outline" onClick={() => setCreditsOpen(true)}>
          Reset credits
        </Button>

        {/* Change plan */}
        <Button size="sm" variant="outline" onClick={() => setPlanOpen(true)}>
          Change plan
        </Button>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={!!loading} size="sm" variant="destructive">
              {loading === "delete" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete user
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this user?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes the user account and all associated data. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => run("delete", () => deleteUserAction(userId))}
              >
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Credits dialog */}
      <Dialog open={creditsOpen} onOpenChange={setCreditsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset credits</DialogTitle>
            <DialogDescription>
              Set a new balance and optional monthly allowance override for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">New balance</label>
              <Input
                min={0}
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Monthly allowance (optional)</label>
              <Input
                min={0}
                placeholder="Leave unchanged"
                type="number"
                value={newAllowance}
                onChange={(e) => setNewAllowance(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsOpen(false)}>Cancel</Button>
            <Button
              disabled={!!loading}
              onClick={async () => {
                await run("credits", () =>
                  resetCreditsAction({
                    userId,
                    balance: Number(newBalance),
                    allowance: newAllowance ? Number(newAllowance) : undefined,
                  }),
                );
                setCreditsOpen(false);
              }}
            >
              {loading === "credits" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan dialog */}
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change subscription plan</DialogTitle>
            <DialogDescription>
              Changing the plan also updates the user&apos;s credit allowance.
            </DialogDescription>
          </DialogHeader>
          <Select value={plan} onValueChange={setPlan}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free (20 credits)</SelectItem>
              <SelectItem value="starter">Starter (500 credits)</SelectItem>
              <SelectItem value="pro">Pro (Unlimited)</SelectItem>
              <SelectItem value="enterprise">Enterprise (Unlimited)</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanOpen(false)}>Cancel</Button>
            <Button
              disabled={!!loading || plan === currentPlan}
              onClick={async () => {
                await run("plan", () => changePlanAction({ userId, plan }));
                setPlanOpen(false);
              }}
            >
              {loading === "plan" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Change plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
