export type UserVote = {
  slope: number;
  power: number;
  end: number;
};

export type UserVotes = { current: UserVote; next: UserVote };
