import type { Tag } from "@/lib/tags";

/* Every node in the hero globe is a kind of person you'll find on campus.
   Each descriptor maps to a real tag, so clicking a node lands on the
   filtered directory. Written for people, not org charts. */

export type CrowdEntry = {
  label: string;
  tag: Tag;
};

export const CROWD: CrowdEntry[] = [
  { label: "the quiz bowl nerds", tag: "Academic" },
  { label: "people who harmonize unprompted", tag: "A Cappella" },
  { label: "the direction givers", tag: "Advising" },
  { label: "the petition carriers", tag: "Advocacy" },
  { label: "paint-under-the-fingernails people", tag: "Arts" },
  { label: "the networking naturals", tag: "Business" },
  { label: "bake-sale masterminds", tag: "Charity" },
  { label: "town-hall regulars", tag: "Civic engagement" },
  { label: "the weekend warriors", tag: "Club Sports" },
  { label: "people who commit to the bit", tag: "Comedy" },
  { label: "the chronic volunteers", tag: "Community Service" },
  { label: "people who keep score", tag: "Competitive" },
  { label: "slide-deck whisperers", tag: "Consulting" },
  { label: "the potluck hosts", tag: "Cultural" },
  { label: "the can't-sit-still people", tag: "Dance" },
  { label: "kerning noticers", tag: "Design" },
  { label: "duct-tape optimists", tag: "Engineering" },
  { label: "dorm-room founders", tag: "Entrepreneurship" },
  { label: "compost evangelists", tag: "Environmental" },
  {
    label: "first-gen trailblazers",
    tag: "First Generation Low Income (FGLI)",
  },
  { label: "the snack providers", tag: "Food" },
  { label: "the map nerds", tag: "Global affairs" },
  { label: "the letter wearers", tag: "Greek Life" },
  { label: "wellness-check friends", tag: "Health" },
  { label: "the patient explainers", tag: "Instructional" },
  { label: "deadline adrenaline junkies", tag: "Journalism" },
  { label: "future objection-raisers", tag: "Law" },
  { label: "found-family builders", tag: "LGBTQ+" },
  { label: "behind-the-camera people", tag: "Media" },
  { label: "future 3 a.m. pager people", tag: "Medicine" },
  { label: "big-sibling energy", tag: "Mentorship" },
  { label: "shower singers gone public", tag: "Music" },
  { label: "the trail-mix people", tag: "Outdoors" },
  { label: "the workshop runners", tag: "Peer Education" },
  { label: "stage-light chasers", tag: "Performing Arts" },
  { label: "debate-at-dinner people", tag: "Politics" },
  { label: "the résumé polishers", tag: "Pre-professional" },
  { label: "the 3 a.m. debuggers", tag: "Programming" },
  { label: "margin scribblers", tag: "Publication" },
  { label: "the podium people", tag: "Public speaking" },
  { label: "professional fun-havers", tag: "Recreation" },
  { label: "the soul searchers", tag: "Religious/Spiritual" },
  { label: "lab-goggle romantics", tag: "Science" },
  { label: "the ones who know everyone", tag: "Social" },
  { label: "people watchers, professionally", tag: "Social Science" },
  { label: "the delightfully niche", tag: "Special Interest" },
  { label: "the meeting-minute keepers", tag: "Student Governance" },
  { label: "gadget tinkerers", tag: "Technology" },
  { label: "dramatic, on purpose", tag: "Theatre" },
  { label: "the wanderlusted", tag: "Travel" },
  { label: "the org-chart people", tag: "Umbrella Organization" },
  { label: "midnight novelists", tag: "Writing" },
  { label: "the kid-energy matchers", tag: "Youth" },
];
