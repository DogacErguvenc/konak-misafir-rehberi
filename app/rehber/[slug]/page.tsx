import { GuestLoader } from "@/components/guide/guest-loader";
import { mockGuide } from "@/lib/mock-data";
export const metadata = { title: "Misafir Rehberi" };
export function generateStaticParams() {
  return [{ slug: mockGuide.slug }];
}
export default async function GuestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GuestLoader slug={slug} />;
}
