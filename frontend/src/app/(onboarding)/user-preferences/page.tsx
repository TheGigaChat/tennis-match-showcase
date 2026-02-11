import { Suspense } from "react";
import UserPreferencesPage from "@/components/UserPreferencesPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <UserPreferencesPage mode="onboarding" />
    </Suspense>
  );
}
