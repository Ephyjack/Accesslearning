import { createBrowserRouter } from "react-router";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { StudentDashboard } from "./components/StudentDashboard";
import { ClassroomInterface } from "./components/ClassroomInterface";
import { CommunityPage } from "./components/CommunityPage";
import { TeacherDiscovery } from "./components/TeacherDiscovery";
import { PublicTeacherProfile } from "./components/PublicTeacherProfile";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/auth", Component: AuthPage },
  { path: "/onboarding", Component: OnboardingFlow },
  { path: "/teacher", Component: TeacherDashboard },
  { path: "/student", Component: StudentDashboard },
  { path: "/classroom/:id", Component: ClassroomInterface },
  { path: "/community/:id", Component: CommunityPage },
  { path: "/community", Component: CommunityPage },
  { path: "/explore/teachers", Component: TeacherDiscovery },
  { path: "/profile/:id", Component: PublicTeacherProfile },
]);


