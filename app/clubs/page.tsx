import Navbar from "@/components/Navbar";

export default function ClubsPage() {
  return (
    <div className="flex items-start gap-10 px-8 py-10">
      <Navbar />
      <div className="flex-1">
        <h1 className="font-heading text-4xl font-bold text-foreground">
          Find your community
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Browse all clubs and pick what fits you.
        </p>
      </div>
    </div>
  );
}
