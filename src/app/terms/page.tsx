import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-16">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-[#D4AF37] font-bold mb-8 inline-block hover:underline">
                    &larr; Back to Home
                </Link>
                <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
                <p className="text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-6 text-gray-300 leading-relaxed">
                    <p>
                        Welcome to Doorway Detail. By accessing or using our website and services, you agree to be bound by these Terms of Service.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">Services</h2>
                    <p>
                        Doorway Detail provides exterior cleaning services including window cleaning, gutter cleaning, and weed removal. We reserve the right to refuse service to anyone for any reason at any time.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">Pricing and Payment</h2>
                    <p>
                        Quotes provided are estimates based on the information you provide. Final pricing may vary based on on-site inspection. Payment is due upon completion of services unless otherwise agreed.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">Liability</h2>
                    <p>
                        While we take every precaution to protect your property, Doorway Detail is not liable for pre-existing damage or damage caused by unforeseen circumstances.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">Modifications</h2>
                    <p>
                        We reserve the right to modify these terms at any time. Please review this page periodically for changes.
                    </p>
                </div>
            </div>
        </div>
    );
}
