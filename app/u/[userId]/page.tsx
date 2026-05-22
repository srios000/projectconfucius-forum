import WallClient from "./WallClient";

type Props = { params: Promise<{ userId: string }> };

export default async function WallRoute({ params }: Props) {
  const { userId } = await params;
  return <WallClient userId={userId} />;
}
