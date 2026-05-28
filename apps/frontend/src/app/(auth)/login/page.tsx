"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { useAuthStore } from "@/store/auth";
import { useTranslation } from "@/components/providers/language-provider";
import { Mail, Lock, Shield } from "lucide-react";

type LoginFormValues = {
  email: string;
  password: string;
  twoFactorCode?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const login = useAuthStore((state) => state.login);

  const loginSchema = z.object({
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(6, t("auth.passwordMin")),
    twoFactorCode: z.string().optional(),
  });

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      twoFactorCode: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);

    try {
      const result = await login(data.email, data.password, data.twoFactorCode);

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        toast.info(t("auth.enterTwoFactor"));
      } else {
        toast.success(t("auth.loginSuccess"));
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || t("auth.loginError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="animate-stagger">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          {t("auth.welcome")}
        </h2>
        <p className="text-gray-400">
          {t("auth.loginToAccount")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300 text-sm font-medium">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      disabled={isLoading}
                      className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 transition-colors"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300 text-sm font-medium">{t("auth.password")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 transition-colors"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          {requiresTwoFactor && (
            <FormField
              control={form.control}
              name="twoFactorCode"
              render={({ field }) => (
                <FormItem className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <FormLabel className="text-gray-300 text-sm font-medium">{t("auth.twoFactorCode")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        disabled={isLoading}
                        className="pl-12 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 tracking-widest text-center text-lg transition-colors"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          )}

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-150 hover:shadow-violet-500/40 active:scale-[0.98]"
          >
            {isLoading ? (
              <Icons.spinner className="h-5 w-5 animate-spin" />
            ) : (
              t("auth.login")
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-8 text-center">
        <p className="text-gray-400">
          {t("auth.noAccount")}{" "}
          <Link
            href="/register"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            {t("auth.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
