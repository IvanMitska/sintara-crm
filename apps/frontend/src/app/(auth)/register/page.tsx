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
import { PhoneInput } from "@/components/ui/phone-input";
import { Icons } from "@/components/icons";
import { useAuthStore } from "@/store/auth";
import { useTranslation } from "@/components/providers/language-provider";
import { Mail, Lock, User, Building2 } from "lucide-react";

type RegisterFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  organizationName: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const register = useAuthStore((state) => state.register);

  const registerSchema = z.object({
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(6, t("auth.passwordMin")),
    confirmPassword: z.string(),
    firstName: z.string().min(1, t("auth.enterFirstName")),
    lastName: z.string().min(1, t("auth.enterLastName")),
    phone: z.string().optional(),
    organizationName: z.string().min(1, t("auth.enterCompanyName")),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("auth.passwordsNoMatch"),
    path: ["confirmPassword"],
  });

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      organizationName: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);

    try {
      await register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        organizationName: data.organizationName,
      });

      toast.success(t("auth.registerSuccessFull"));
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || t("auth.registerError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="animate-stagger">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {t("auth.createAccount")}
        </h2>
        <p className="text-gray-400">
          {t("auth.registerSubtitle")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 text-sm font-medium">{t("auth.firstName")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        placeholder={t("auth.firstNamePlaceholder")}
                        disabled={isLoading}
                        className="pl-10 h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 transition-colors"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 text-sm font-medium">{t("auth.lastName")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        placeholder={t("auth.lastNamePlaceholder")}
                        disabled={isLoading}
                        className="pl-10 h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 transition-colors"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="organizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300 text-sm font-medium">{t("auth.companyName")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      placeholder={t("auth.companyPlaceholder")}
                      disabled={isLoading}
                      className="pl-12 h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 transition-colors"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

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
                      className="pl-12 h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 transition-colors"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300 text-sm font-medium">
                  {t("auth.phone")} <span className="text-gray-500">({t("auth.phoneOptional")})</span>
                </FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                    placeholder="999 123-45-67"
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
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
                      className="pl-12 h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 transition-colors"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300 text-sm font-medium">{t("auth.confirmPasswordLabel")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="pl-12 h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20 transition-colors"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-400 text-xs" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-150 hover:shadow-violet-500/40 active:scale-[0.98] mt-2"
          >
            {isLoading ? (
              <Icons.spinner className="h-5 w-5 animate-spin" />
            ) : (
              t("auth.register")
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <p className="text-gray-400">
          {t("auth.haveAccount")}{" "}
          <Link
            href="/login"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            {t("auth.login")}
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-gray-500">
        {t("auth.termsText")}{" "}
        <Link href="#" className="text-gray-400 hover:text-white transition-colors">
          {t("auth.termsLink")}
        </Link>
      </p>
    </div>
  );
}
