import { Layout } from "@/components/Layout";
import { ChatInterface } from "@/components/ChatInterface";

const Index = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <ChatInterface />
      </div>
    </Layout>
  );
};

export default Index;
