export type CommonTag = {
  id: number | undefined;
  name: string;
  color: string | null;
  hideWork: boolean;
  hideTag: boolean;
  aliases?: string[];
  created_at?: Date;
  updated_at?: Date;
};
