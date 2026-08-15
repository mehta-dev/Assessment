export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  title: string;
  avatar: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  username?: string;
  title?: string;
  avatar?: string;
}