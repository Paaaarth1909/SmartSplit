export interface Member {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  members: Member[];
  createdAt: string;
}
