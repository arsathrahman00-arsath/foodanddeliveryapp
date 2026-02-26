import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { authApi, getApiErrorMessage } from "@/lib/api";

const usernameSchema = z.object({
  user_name: z.string().min(1, "Username is required").max(50, "Username too long"),
});

const passwordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain at least 1 number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least 1 special character")
      .max(100, "Password too long"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type UsernameForm = z.infer<typeof usernameSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const ForgotPasswordDialog: React.FC = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [userCode, setUserCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const usernameForm = useForm<UsernameForm>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { user_name: "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const resetAll = () => {
    setStep("verify");
    setUserCode("");
    setShowPassword(false);
    usernameForm.reset();
    passwordForm.reset();
  };

  const handleVerify = async (data: UsernameForm) => {
    setIsLoading(true);
    try {
      const res = await authApi.verifyUser({ user_name: data.user_name });
      if (res.status === "success" || res.status === "ok") {
        const code = res.data?.user_code || (res as any).user_code;
        if (code) {
          setUserCode(code);
          setStep("reset");
        } else {
          usernameForm.setError("user_name", { message: "User not found" });
        }
      } else {
        usernameForm.setError("user_name", {
          message: res.message || "User not found",
        });
      }
    } catch (error) {
      usernameForm.setError("user_name", {
        message: getApiErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: PasswordForm) => {
    setIsLoading(true);
    try {
      const res = await authApi.updatePassword({
        user_code: userCode,
        new_password: data.new_password,
      });
      if (res.status === "success" || res.status === "ok") {
        toast({
          title: "Password updated!",
          description: "You can now log in with your new password.",
        });
        setOpen(false);
        resetAll();
      } else {
        toast({
          title: "Update failed",
          description: res.message || "Unable to update password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetAll();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-sm text-primary hover:underline transition-colors"
        >
          Forgot Password?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <DialogTitle>
              {step === "verify" ? "Forgot Password" : "Reset Password"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {step === "verify"
              ? "Enter your username to verify your account."
              : "Create a new password for your account."}
          </DialogDescription>
        </DialogHeader>

        {step === "verify" ? (
          <form
            onSubmit={usernameForm.handleSubmit(handleVerify)}
            className="space-y-4 mt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="forgot-username">Username</Label>
              <Input
                id="forgot-username"
                placeholder="Enter your username"
                {...usernameForm.register("user_name")}
                className="h-11"
              />
              {usernameForm.formState.errors.user_name && (
                <p className="text-sm text-destructive">
                  {usernameForm.formState.errors.user_name.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-warm hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify Username"}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={passwordForm.handleSubmit(handleResetPassword)}
            className="space-y-4 mt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  {...passwordForm.register("new_password")}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordForm.formState.errors.new_password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Confirm new password"
                {...passwordForm.register("confirm_password")}
                className="h-11"
              />
              {passwordForm.formState.errors.confirm_password && (
                <p className="text-sm text-destructive">
                  {passwordForm.formState.errors.confirm_password.message}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => {
                  setStep("verify");
                  passwordForm.reset();
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-gradient-warm hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
