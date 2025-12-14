import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  Send,
  MapPin,
  Loader2,
} from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    message: "",
    budget: "",
    timeline: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(
        "https://scs-ltd.app.n8n.cloud/webhook/lead-capture",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            company: data.businessName,
            message: data.message,
            budget: data.budget,
            timeline: data.timeline,
            source: "website-form",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Webhook request failed");
      }
    },
    onSuccess: () => {
      setIsSubmitted(true);
      setFormData({
        name: "",
        businessName: "",
        email: "",
        message: "",
        budget: "",
        timeline: "",
      });
      setTimeout(() => setIsSubmitted(false), 8000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessageMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-green-50 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Lets Build Your{" "}
          <span className="gradient-text">Smart Content System</span>
        </h1>
        <p className="text-xl text-gray-600">
          Ready to automate your content and scale your business?
        </p>
      </section>

      {/* Contact */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <Card className="shadow-xl border-none">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Send Us a Message</h2>
              </div>

              {isSubmitted && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-semibold">
                    Thank you! Your message has been sent.
                  </p>
                </div>
              )}

              {sendMessageMutation.isError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-semibold">
                    Something went wrong. Please try again.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label>Your Name *</Label>
                  <Input
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    disabled={sendMessageMutation.isPending}
                    className="h-12"
                  />
                </div>

                <div>
                  <Label>Business Name *</Label>
                  <Input
                    name="businessName"
                    required
                    value={formData.businessName}
                    onChange={handleChange}
                    disabled={sendMessageMutation.isPending}
                    className="h-12"
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={sendMessageMutation.isPending}
                    className="h-12"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Budget *</Label>
                    <select
                      name="budget"
                      required
                      value={formData.budget}
                      onChange={handleChange}
                      disabled={sendMessageMutation.isPending}
                      className="h-12 w-full rounded-md border border-input bg-background px-3"
                    >
                      <option value="">Select budget</option>
                      <option value="Under £1,000">Under £1,000</option>
                      <option value="£1,000 – £5,000">£1,000 – £5,000</option>
                      <option value="£5,000 – £10,000">£5,000 – £10,000</option>
                      <option value="£10,000+">£10,000+</option>
                    </select>
                  </div>

                  <div>
                    <Label>Timeline *</Label>
                    <select
                      name="timeline"
                      required
                      value={formData.timeline}
                      onChange={handleChange}
                      disabled={sendMessageMutation.isPending}
                      className="h-12 w-full rounded-md border border-input bg-background px-3"
                    >
                      <option value="">Select timeline</option>
                      <option value="Immediate">Immediate</option>
                      <option value="Within 1 month">Within 1 month</option>
                      <option value="1-3 months">1-3 months</option>
                      <option value="Just exploring">Just exploring</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Message *</Label>
                  <Textarea
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    disabled={sendMessageMutation.isPending}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={sendMessageMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-6"
                >
                  {sendMessageMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 flex gap-4">
                <Mail className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold">Email</p>
                  <p>support@smartcontentsolutions.co.uk</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex gap-4">
                <Clock className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold">Business Hours</p>
                  <p>Monday to Friday, 9am to 5pm GMT</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex gap-4">
                <MapPin className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold">Location</p>
                  <p>United Kingdom</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
