import { Textarea } from "@/components/ui/textarea";

const TextResponse = ({
  text,
  setText,
}: {
  text: string;
  setText: (value: string) => void;
}) => {
  return (
    <div className="w-full">
      <Textarea
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your thoughts here..."
      />
    </div>
  );
};

export default TextResponse;
