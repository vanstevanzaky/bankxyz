"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (res.ok) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="spinner spinner-lg mx-auto mb-4" />
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Memuat BankXYZ...
        </p>
      </div>
    </div>
  );
}
