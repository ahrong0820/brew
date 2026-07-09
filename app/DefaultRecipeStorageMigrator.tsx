"use client";

import { useEffect } from "react";
import { migrateDefaultRecipeClientStorage } from "@/lib/recipes/defaultRecipeStorageMigration";

export default function DefaultRecipeStorageMigrator() {
  useEffect(() => {
    migrateDefaultRecipeClientStorage();
  }, []);

  return null;
}
