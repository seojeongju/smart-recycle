export type GuideStep = {
  order: number;
  title: string;
  body: string;
  required: number | boolean;
};

export type UpcycleTip = {
  title: string;
  body: string;
  caution: string | null;
};

export type GuidePayload = {
  item_id: string;
  category_id: string;
  name_ko: string;
  category_name: string;
  summary_ko: string;
  bin_type: string;
  special_bin_type: string | null;
  steps: GuideStep[];
  tips: UpcycleTip[];
};
