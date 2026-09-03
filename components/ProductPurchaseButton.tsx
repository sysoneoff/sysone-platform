"use client";

import { useState } from "react";

type Props = {
  productSlug: string;
  priceLabel: string;
};

export function ProductPurchaseButton({ productSlug, priceLabel }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startPurchase() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug }),
      });

      if (response.status === 401) {
        const returnTo = "/products/" + encodeURIComponent(productSlug);
        window.location.assign(
          "/login?returnTo=" + encodeURIComponent(returnTo),
        );
        return;
      }

      if (response.status === 409) {
        window.location.assign("/account#downloads");
        return;
      }

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "order_creation_failed");
      }

      window.location.assign("/account#orders");
    } catch {
      setError("Order could not be created. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="button buttonPrimary buttonLarge"
        onClick={startPurchase}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Creating order..." : `Start purchase · ${priceLabel}`}
      </button>
      {error ? <small role="alert">{error}</small> : null}
    </div>
  );
}
