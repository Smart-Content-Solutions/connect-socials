import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, ArrowLeft, CreditCard, Lock } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const packageName = searchParams.get("package");
  const packagePrice = packageName === "Starter" ? 49 :
                        packageName === "Pro" ? 99 : 0;

  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    business_name: "",
    phone: "",
    billing_address: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
    notes: "",
  });

  useEffect(() => {
    if (!packageName || (packageName !== "Starter" && packageName !== "Pro")) {
      navigate("/packages");
    }
  }, [packageName, navigate]);

  // 🔥 Replace this with your backend webhook
  const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

  const createOrderMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        package_name: packageName,
        package_price: packagePrice,
      };

      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    },

    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 5000);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createOrderMutation.mutate(formData);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // SUCCESS SCREEN
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-2xl border-none">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-3xl font-bold mb-4">
              Order Received Successfully!
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              Thank you for choosing the{" "}
              <span className="font-bold gradient-text">{packageName}</span> plan.
            </p>

            <p className="text-gray-600 mb-6">
              A confirmation email will be sent to <b>{formData.customer_email}</b>.
            </p>

            <p className="text-sm text-gray-500">
              Redirecting you to homepage...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/packages")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Packages
          </Button>

          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Checkout – <span className="gradient-text">{packageName}</span>
          </h1>

          <p className="text-xl text-gray-600">
            Complete your details and we’ll contact you shortly.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* ORDER FORM */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-none">

              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Your Information</h2>
                    <p className="text-sm text-gray-600">
                      We'll use this to set up your subscription.
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* NAME + EMAIL */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label>Full Name *</Label>
                      <Input
                        required
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <Label>Email *</Label>
                      <Input
                        required
                        type="email"
                        name="customer_email"
                        value={formData.customer_email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* BUSINESS + PHONE */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label>Business Name *</Label>
                      <Input
                        required
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <Label>Phone</Label>
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* ADDRESS */}
                  <div>
                    <Label>Billing Address</Label>
                    <Input
                      name="billing_address"
                      value={formData.billing_address}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <Label>City</Label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <Label>Postcode</Label>
                      <Input
                        name="postcode"
                        value={formData.postcode}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <Label>Country</Label>
                      <Input
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* NOTES */}
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      name="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </div>

                  {/* SUBMIT */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white text-lg py-6"
                    disabled={createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? "Processing..." : "Complete Order"}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Lock className="w-4 h-4" />
                    Your information is secure
                  </div>

                </form>
              </CardContent>
            </Card>
          </div>

          {/* SUMMARY */}
          <div>
            <Card className="shadow-xl border-none sticky top-24">
              <CardHeader className="border-b bg-gray-50">
                <h3 className="font-bold text-lg">Order Summary</h3>
              </CardHeader>

              <CardContent className="p-6 space-y-6">

                <div className="flex justify-between">
                  <span>Package</span>
                  <b>{packageName}</b>
                </div>

                <div className="flex justify-between">
                  <span>Monthly Price</span>
                  <b>£{packagePrice}</b>
                </div>

                <div className="border-t pt-4 flex justify-between text-xl font-bold">
                  <span>Total Today</span>
                  <span className="gradient-text text-2xl">£{packagePrice}</span>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
