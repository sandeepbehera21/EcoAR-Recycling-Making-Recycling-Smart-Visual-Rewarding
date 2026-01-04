import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
    AlertTriangle,
    Camera,
    MapPin,
    Send,
    Loader2,
    CheckCircle,
    Trash2,
    Bug,
    MessageSquare,
} from "lucide-react";

const reportTypes = [
    { value: "bin_issue", label: "Bin Issue", icon: Trash2, description: "Full, broken, or missing bin" },
    { value: "bug", label: "App Bug", icon: Bug, description: "Technical issue with the app" },
    { value: "suggestion", label: "Suggestion", icon: MessageSquare, description: "Feature request or improvement" },
];

const ReportIssue = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [reportType, setReportType] = useState("");
    const [message, setMessage] = useState("");
    const [photo, setPhoto] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationAddress, setLocationAddress] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [user, authLoading, navigate]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const getCurrentLocation = () => {
        setIsGettingLocation(true);

        if (!navigator.geolocation) {
            toast({
                title: "Error",
                description: "Geolocation is not supported by your browser",
                variant: "destructive",
            });
            setIsGettingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });

                // Try to get address from coordinates (reverse geocoding)
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    setLocationAddress(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                } catch {
                    setLocationAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                }

                setIsGettingLocation(false);
            },
            (error) => {
                toast({
                    title: "Location Error",
                    description: "Unable to get your location. Please try again.",
                    variant: "destructive",
                });
                setIsGettingLocation(false);
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reportType || !message) {
            toast({
                title: "Missing Information",
                description: "Please select a report type and provide details.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await axios.post("http://localhost:5000/api/reports", {
                type: reportType,
                message,
                photoURL: photo,
                location,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            setIsSuccess(true);
            toast({
                title: "Report Submitted!",
                description: "Thank you for helping improve our community.",
            });

            // Reset form after 2 seconds
            setTimeout(() => {
                setReportType("");
                setMessage("");
                setPhoto(null);
                setLocation(null);
                setLocationAddress("");
                setIsSuccess(false);
            }, 3000);
        } catch (error) {
            console.error("Submit error:", error);
            toast({
                title: "Submission Failed",
                description: "Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container py-12">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 rounded-xl bg-destructive/10">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Report an Issue</h1>
                            <p className="text-muted-foreground">Help us improve by reporting problems</p>
                        </div>
                    </div>

                    {isSuccess ? (
                        <Card className="glass-card animate-fade-in-up">
                            <CardContent className="py-16 text-center">
                                <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-6">
                                    <CheckCircle className="h-16 w-16 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                                <p className="text-muted-foreground">
                                    Your report has been submitted successfully. We'll review it shortly.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="glass-card animate-fade-in-up">
                            <CardHeader>
                                <CardTitle>Submit a Report</CardTitle>
                                <CardDescription>
                                    Let us know about bin issues, app bugs, or suggestions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Report Type */}
                                    <div className="space-y-2">
                                        <Label>Report Type *</Label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {reportTypes.map((type) => (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => setReportType(type.value)}
                                                    className={`p-4 rounded-xl border-2 transition-all ${reportType === type.value
                                                            ? "border-primary bg-primary/10"
                                                            : "border-border hover:border-primary/50"
                                                        }`}
                                                >
                                                    <type.icon
                                                        className={`h-6 w-6 mx-auto mb-2 ${reportType === type.value ? "text-primary" : "text-muted-foreground"
                                                            }`}
                                                    />
                                                    <p className="text-sm font-medium">{type.label}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Description *</Label>
                                        <Textarea
                                            id="message"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Describe the issue in detail..."
                                            rows={4}
                                            className="resize-none"
                                        />
                                    </div>

                                    {/* Photo Upload */}
                                    <div className="space-y-2">
                                        <Label>Photo (Optional)</Label>
                                        <div className="flex items-center gap-4">
                                            {photo ? (
                                                <div className="relative">
                                                    <img
                                                        src={photo}
                                                        alt="Uploaded"
                                                        className="h-24 w-24 object-cover rounded-lg"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setPhoto(null)}
                                                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center h-24 w-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                                                    <Camera className="h-6 w-6 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground mt-1">Add Photo</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handlePhotoUpload}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Location */}
                                    {reportType === "bin_issue" && (
                                        <div className="space-y-2">
                                            <Label>Location</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={locationAddress}
                                                    onChange={(e) => setLocationAddress(e.target.value)}
                                                    placeholder="Location address"
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={getCurrentLocation}
                                                    disabled={isGettingLocation}
                                                >
                                                    {isGettingLocation ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <MapPin className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                            {location && (
                                                <p className="text-xs text-muted-foreground">
                                                    📍 Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        variant="hero"
                                        className="w-full"
                                        disabled={isSubmitting || !reportType || !message}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4" />
                                                Submit Report
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ReportIssue;
