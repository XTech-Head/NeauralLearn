"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

function Provider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      createNewUser();
    }
  }, [isLoaded, isSignedIn]);

  const createNewUser = async () => {
    try {
      await fetch("/api/user", {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to create user", error);
    }
  };

  return <>{children}</>;
}

export default Provider;
