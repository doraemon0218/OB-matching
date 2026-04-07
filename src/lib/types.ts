export type JrYear = "1" | "2";

export type JrRow = {
  id: string;
  last: string;
  first: string;
  nick: string;
  year: JrYear;
  spec1: string;
  spec2: string;
  spec3: string;
  mentor: string | null;
  created_at: string;
};

/** OB 向け一覧（実名なし） */
export type JrPublic = {
  id: string;
  nick: string;
  year: JrYear;
  specs: [string, string, string];
  mentor: string | null;
  likeCount: number;
  likedByMe: boolean;
};

export type ObRow = {
  id: string;
  last: string;
  first: string;
  spec: string;
  msg: string | null;
  created_at: string;
};

export type LikeRow = {
  ob_id: string;
  jr_id: string;
  created_at: string;
  viewed_at: string | null;
};
