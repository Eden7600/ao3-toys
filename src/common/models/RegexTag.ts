export type RegexTag = {
  id?: number;
  name: string;
  regex: string;
  color: string | null;
  hideWork: boolean;
  hideTag: boolean;
  caseInsensitive?: boolean;
  created_at?: Date;
  updated_at?: Date;
};
