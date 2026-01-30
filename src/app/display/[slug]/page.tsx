import { BannerDisplay } from "./_components/LocationBannerDisplay";

export default function LocationDisplayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <BannerDisplay params={params} />;
}
