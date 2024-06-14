export type UserVote = {
  // the rate at which the voting power changes over time
  slope: number;
  power: number;
  end: number;
};

export type UserVotes = { current: UserVote; next: UserVote };
