export interface Challenge {
  id: number;
  type: "video" | "image" | "text";
  title: string;
  description: string;
  mediaUrl?: string;
  content: string;
  completed: boolean;
}
