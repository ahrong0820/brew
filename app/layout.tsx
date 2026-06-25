import type { Metadata } from "next";
import BeanLibraryDrawer from "./BeanLibraryDrawer";
import BrewHistoryDrawer from "./BrewHistoryDrawer";
import BrewSessionFeedbackTracker from "./BrewSessionFeedbackTracker";
import GrindMicronDrawer from "./GrindMicronDrawer";
import MobileCoffeeNav from "./MobileCoffeeNav";
import MobileRecipeEnhancer from "./MobileRecipeEnhancer";
import NextBrewAdjustmentDrawer from "./NextBrewAdjustmentDrawer";
import RecommendationDrawer from "./RecommendationDrawerV2";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "핸드드립 레시피 노트",
  description: "핸드드립 커피 레시피와 브루잉 타이머를 정리하는 웹페이지입니다.",
  icons: {
    icon: `${basePath}/favicon.svg`,
    shortcut: `${basePath}/favicon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <MobileRecipeEnhancer />
        <GrindMicronDrawer />
        <BrewHistoryDrawer />
        <RecommendationDrawer />
        <BeanLibraryDrawer />
        <BrewSessionFeedbackTracker />
        <NextBrewAdjustmentDrawer />
        <MobileCoffeeNav />
        {children}
      </body>
    </html>
  );
}
