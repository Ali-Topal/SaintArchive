import RaffleList from "@/components/RaffleList";

export const revalidate = 180;

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps = {}) {
  const resolvedSearchParams =
    searchParams !== undefined
      ? await searchParams
      : ({} as Record<string, string | string[] | undefined>);

  return <RaffleList searchParams={resolvedSearchParams} />;
}
