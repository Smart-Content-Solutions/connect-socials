import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  ArrowRight,
  Sparkles,
  FileText,
  Calendar,
  BarChart3,
  Mail,
  Loader2
} from "lucide-react";

export default function StarterPlan() {
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    business_name: "",
    customer_email: "",
    notes: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

  // ---- Mutation (Send to n8n webhook) ----
  const submitOrderMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        package_name: "Starter",
        package_price: 49,
      };

      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Webhook submission failed");
      }

      return res.json();
    },

    onSuccess: () => {
      setTimeout(() => {
        setShowForm(false);
        setTimeout(() => setIsSubmitted(true), 300);
      }, 1000);

      setFormData({
        customer_name: "",
        business_name: "",
        customer_email: "",
        notes: "",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitOrderMutation.mutate(formData);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ---- Features Section Data ----
  const features = [
    {
      icon: FileText,
      title: "2 AI-Generated Blog Posts per Week",
      description:
        "Professionally written, SEO-optimized content tailored to your brand voice and industry keywords",
    },
    {
      icon: Calendar,
      title: "Monthly Content Calendar",
      description:
        "Automatically created based on your business goals, seasonal trends, and audience interests",
    },
    {
      icon: BarChart3,
      title: "Automatic Website Posting",
      description:
        "Content published directly to your website with optimized headlines, tags, and summaries for SEO",
    },
    {
      icon: Mail,
      title: "Monthly Performance Summary",
      description:
        "Detailed report delivered to your inbox showing content performance and engagement metrics",
    },
  ];

  const includedItems = [
    "AI-optimized headlines and meta descriptions",
    "Keyword research and SEO optimization",
    "Custom brand voice training",
    "Automatic posting to your website",
    "Email support for setup and adjustments",
    "No long-term contracts",
    "Cancel anytime",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* HERO */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-green-100 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Perfect for Small Businesses
            </span>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-6">Starter Plan</h1>
          <p className="text-xl text-gray-600 mb-4">
            Smart Content Automation for Small Businesses
          </p>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Perfect for small businesses that want to automate their online presence quickly
            and affordably
          </p>

          <div className="inline-flex items-baseline gap-2 mb-8">
            <span className="text-6xl font-bold gradient-text">£49</span>
            <span className="text-2xl text-gray-600">/month</span>
          </div>

          <Button
            size="lg"
            onClick={scrollToForm}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white text-xl px-12 py-8 group"
          >
            Get Started with Starter Plan
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-sm text-gray-500 mt-6">
            7-day trial period • No setup fees • Cancel anytime
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4">What's Included</h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            Everything you need to automate your content creation
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {features.map((f, i) => (
              <Card key={i} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mb-6">
                    <f.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-none shadow-xl">
            <CardHeader className="text-center pb-4">
              <h3 className="text-2xl font-bold text-gray-900">Complete Package Includes</h3>
            </CardHeader>

            <CardContent className="p-8 grid md:grid-cols-2 gap-4">
              {includedItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-lg">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FORM */}
      <section ref={formRef} className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 mb-2">
              You've selected the <span className="font-bold gradient-text">Starter Plan (£49/month)</span>
            </p>
            <p className="text-lg text-gray-600">
              Fill in your details and we'll contact you within 24 hours.
            </p>
          </div>

          {/* FORM + SUCCESS MESSAGE */}
          <div className="relative min-h-[600px]">

            {/* ---- FORM ---- */}
            {showForm && !isSubmitted && (
              <Card className="border-none shadow-2xl transition-all duration-500">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          name="customer_name"
                          required
                          value={formData.customer_name}
                          onChange={handleChange}
                          disabled={submitOrderMutation.isPending}
                          className="h-12"
                        />
                      </div>

                      <div>
                        <Label>Business Name *</Label>
                        <Input
                          name="business_name"
                          required
                          value={formData.business_name}
                          onChange={handleChange}
                          disabled={submitOrderMutation.isPending}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Email *</Label>
                      <Input
                        name="customer_email"
                        type="email"
                        required
                        value={formData.customer_email}
                        onChange={handleChange}
                        disabled={submitOrderMutation.isPending}
                        className="h-12"
                      />
                    </div>

                    <div>
                      <Label>Notes (optional)</Label>
                      <Textarea
                        name="notes"
                        rows={4}
                        value={formData.notes}
                        onChange={handleChange}
                        disabled={submitOrderMutation.isPending}
                        className="resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitOrderMutation.isPending}
                      className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white text-xl py-8"
                    >
                      {submitOrderMutation.isPending ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Confirm & Get Started
                        </>
                      )}
                    </Button>

                    <p className="text-center text-sm text-gray-500">
                      By submitting you agree to our terms. We'll contact you regarding setup.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ---- SUCCESS MESSAGE ---- */}
            {isSubmitted && (
              <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
                <Card className="border-none shadow-2xl bg-gradient-to-br from-white via-blue-50 to-green-50 max-w-2xl w-full">
                  <CardContent className="p-12 text-center">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <CheckCircle className="w-14 h-14 text-white" />
                      </div>
                    </div>

                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      Thank you for choosing Smart Content Solutions!
                    </h3>

                    <p className="text-lg text-gray-600 mb-8">
                      Our team will contact you within 24 hours to finalize your setup.
                    </p>

                    <Link to="/" className="inline-block">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-6"
                      >
                        Back to Home
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>

                    <p className="text-sm text-gray-500 mt-4">
                      Check your email for confirmation.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {!isSubmitted && (
            <p className="text-center text-gray-600 mt-8">
              Have questions?{" "}
              <Link to="/contact" className="text-blue-600 font-semibold hover:underline">
                Contact us
              </Link>{" "}
              or{" "}
              <Link to="/packages" className="text-blue-600 font-semibold hover:underline">
                view other packages
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
