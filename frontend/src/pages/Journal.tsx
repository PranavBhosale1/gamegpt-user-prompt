import { Layout } from "@/components/Layout";
import { Users, Phone, MessageCircle, Calendar, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Journal = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Connect to a Therapist</h1>
                <p className="text-muted-foreground">Professional mental health support when you need it most</p>
              </div>
            </div>
            
            <Button className="bg-gradient-hero hover:shadow-glow">
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Therapist Options */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Licensed Therapists</h3>
                <p className="text-muted-foreground">Professional counselors available 24/7</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Available</Badge>
            </div>
            
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Connect with certified mental health professionals for personalized therapy sessions, cognitive behavioral therapy, and emotional support.
              </p>
              
              <Button className="w-full bg-gradient-hero hover:shadow-glow">
                <Phone className="w-4 h-4 mr-2" />
                Connect Now
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-calm rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Crisis Support</h3>
                <p className="text-muted-foreground">Immediate help for urgent situations</p>
              </div>
              <Badge className="bg-red-100 text-red-800">Emergency</Badge>
            </div>
            
            <div className="space-y-3">
              <p className="text-muted-foreground">
                24/7 crisis intervention and suicide prevention support. Trained professionals ready to help in your darkest moments.
              </p>
              
              <Button variant="destructive" className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Emergency Support
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-warm">
            <div className="text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">You're Not Alone</h3>
              <p className="text-muted-foreground mb-4">
                Professional mental health support is just a click away. Take the first step towards better mental wellness today.
              </p>
              <Button className="bg-gradient-hero hover:shadow-glow">
                Get Started
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Journal;