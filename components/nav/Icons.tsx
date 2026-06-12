import { ViewGrid, Group, CreditCard, RefreshDouble, MediaVideo, Settings, Globe } from "iconoir-react";

const sz = { width: 19, height: 19, strokeWidth: 1.7 };

export const Icons = {
  overview: () => <ViewGrid {...sz} />,
  clients: () => <Group {...sz} />,
  payments: () => <CreditCard {...sz} />,
  rollovers: () => <RefreshDouble {...sz} />,
  deliveries: () => <MediaVideo {...sz} />,
  settings: () => <Settings {...sz} />,
  retainer: () => <Globe {...sz} />,
};

export type IconName = keyof typeof Icons;
