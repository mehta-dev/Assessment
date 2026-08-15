"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  fallback?: string;
  label?: string;
}

export default function BackButton({
  fallback = "/",
  label = "Back",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    /*
     * Go to the actual previous page when browser
     * history is available.
     *
     * Otherwise use the supplied fallback route.
     */
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallback);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
    >
      ← {label}
    </button>
  );
}