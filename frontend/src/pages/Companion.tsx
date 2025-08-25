import { Layout } from "@/components/Layout";
import { AlertTriangle, Phone, MessageCircle, Shield, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Companion = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">SOS Help</h1>
              {/* <p className="text-muted-foreground">Following are wellness support available 24/7</p> */}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-900">Manas Helpline</h3>
              <p className="text-red-700 mb-4 text-sm">
                National mental health helpline providing psychological support 24/7
              </p>
              <div className="text-2xl font-bold text-red-800 mb-3">08046110007</div>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                <Phone className="w-4 h-4 mr-2" />
                Call Manas
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-blue-900">Kiran Helpline</h3>
              <p className="text-blue-700 mb-4 text-sm">
                24/7 toll-free mental health rehabilitation helpline
              </p>
              <div className="text-2xl font-bold text-blue-800 mb-3">18005990019</div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Phone className="w-4 h-4 mr-2" />
                Call Kiran
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-green-900">Vandrevala Foundation</h3>
              <p className="text-green-700 mb-4 text-sm">
                24/7 crisis support and outreach helpline for mental health
              </p>
              <div className="text-2xl font-bold text-green-800 mb-3">9999666555</div>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Phone className="w-4 h-4 mr-2" />
                Call Vandrevala
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center bg-red-50 border-red-200">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2 text-red-900">Suicide Prevention</h3>
            <p className="text-sm text-red-700">Immediate help for suicidal thoughts</p>
          </Card>
          
          <Card className="p-6 text-center bg-orange-50 border-orange-200">
            <Shield className="w-8 h-8 text-orange-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2 text-orange-900">Crisis Resources</h3>
            <p className="text-sm text-orange-700">Access local emergency mental health services</p>
          </Card>
          
          <Card className="p-6 text-center bg-purple-50 border-purple-200">
            <Heart className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2 text-purple-900">Self-Care Tools</h3>
            <p className="text-sm text-purple-700">Immediate coping strategies and grounding techniques</p>
          </Card>
        </div>

        <Card className="p-8 bg-gradient-to-r from-red-600 to-orange-600 text-white">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h3 className="text-xl font-semibold mb-4">If you're in immediate danger</h3>
            <p className="mb-6 opacity-90">
              Please call 911 or go to your nearest emergency room immediately
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="bg-white text-red-600 hover:bg-gray-100">
                Call 911
              </Button>
              <Button className="bg-red-700 hover:bg-red-800 text-white">
                Find Emergency Room
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Companion;