export interface CommentAuthor {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  title?: string;
  avatar?: string;
}

export interface Comment {
  _id: string;
  content: string;

  task:
    | string
    | {
        _id: string;
      };

  author: CommentAuthor;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCommentData {
  content: string;
  task: string;
  author: string;
}