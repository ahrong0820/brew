import type { EvidenceContext } from "../lib/types/evidence";
import type { Bean } from "../lib/types/coffee";

export const multiRegionBeanFixture: Pick<
  Bean,
  "originCountry" | "originGroup" | "originRegions"
> = {
  originCountry: "ethiopia",
  originGroup: "east-africa",
  originRegions: ["Guji", "Sidama"],
};

export const regionalEvidenceContextFixture: EvidenceContext = {
  bean: {
    originCountries: ["ethiopia"],
    originGroups: ["east-africa"],
    originRegions: ["Guji"],
  },
};
