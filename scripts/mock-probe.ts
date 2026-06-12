import { getMockViews } from "../lib/mock";

for (const v of getMockViews()) {
  const c = v.computation?.current;
  console.log(
    `${v.client.name.padEnd(18)} health=${v.health.padEnd(11)} used=${c?.usedFromFresh}/${c?.allotment} over=${c?.overageThisPeriod} roll=${c?.rollover.available} days=${c?.rollover.daysToNextExpiry} outstanding=${v.outstanding}`,
  );
}
