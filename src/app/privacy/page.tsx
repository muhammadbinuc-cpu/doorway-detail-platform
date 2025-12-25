import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-16">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-[#D4AF37] font-bold mb-8 inline-block hover:underline">
                    &larr; Back to Home
                </Link>
                <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
                <p className="text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-6 text-gray-300 leading-relaxed">
                    <p>
                        At Doorway Detail, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website or use our services.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">Information We Collect</h2>
                    <p>
                        We collect information you provide directly to us, such as your name, email address, phone number, and property address when you request a quote or contact us.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">How We Use Your Information</h2>
                    <p>
                        We use the information we collect to provide, maintain, and improve our services, communicate with you, and process your requests.
                    </p>

                    <h2 className="text-2xl font-bold text-white mt-8">Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at Doorwaydetail@gmail.com.
                    </p>
                </div>
            </div>
        </div>
    );
}
