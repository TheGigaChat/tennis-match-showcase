import { Suspense } from "react";
import UserPreferencesPage from "@/components/UserPreferencesPage";

export const dynamic = "force-dynamic"; // avoid prerender/export errors for search params

export default function Page() {
  return (
    <Suspense fallback={null}>
      <UserPreferencesPage mode="settings" />
    </Suspense>
  );
}
