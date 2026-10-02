"use client";

import { useState } from "react";
import { Category } from "@/types";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  return {
    categories,
    loading,
    setCategories,
  };
}
