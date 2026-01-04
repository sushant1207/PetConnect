import Link from "next/link";
import { Navbar } from "./components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-32 pb-20 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Connecting Pets to Care, Community, and Compassion
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Book vet appointments, manage pet health records, find lost pets, and support animal welfare—all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full border-2 border-primary px-8 py-4 text-lg font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              Register Your Pet
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="text-4xl mb-2">🐾</div>
              <h3 className="font-semibold mb-2">Digital Records</h3>
              <p className="text-sm text-muted-foreground">Secure pet health records</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="text-4xl mb-2">📅</div>
              <h3 className="font-semibold mb-2">Easy Booking</h3>
              <p className="text-sm text-muted-foreground">Book vet appointments instantly</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="text-4xl mb-2">❤️</div>
              <h3 className="font-semibold mb-2">Community Support</h3>
              <p className="text-sm text-muted-foreground">Help animals in need</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Pet Care Shouldn&apos;t Be This Hard</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We understand the challenges pet owners face every day
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🔍", title: "Difficulty Finding Vets", description: "Veterinary services are often difficult to find based on specialization and availability." },
              { icon: "📄", title: "Paper-Based Records", description: "Pet health records are fragmented, paper-based, or lost over time." },
              { icon: "🚨", title: "Emergency Access", description: "Emergency situations lack quick access to pet medical history." },
              { icon: "🐕", title: "Lost Pets", description: "Lost pets rely mostly on informal social media posts with no unified system." },
              { icon: "🏥", title: "Limited Donation Channels", description: "Animal shelters and welfare groups lack sustainable digital donation channels." },
              { icon: "🔗", title: "No Unified Platform", description: "There is no unified platform for pet-related services in Nepal." }
            ].map((problem, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{problem.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">PetConnect Solves It All</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive solution for modern pet care in Nepal
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: "🔗", title: "One Platform", description: "All pet care services in one unified platform" },
              { icon: "📱", title: "Digital Records & QR Access", description: "Secure digital health records with instant QR code access" },
              { icon: "📅", title: "Smart Appointment Booking", description: "Find and book vets by specialization, location, and availability" },
              { icon: "🤝", title: "Community-Driven Welfare", description: "Lost & found system and charity support for animal welfare" }
            ].map((solution, index) => (
              <div
                key={index}
                className="p-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-xl"
              >
                <div className="text-5xl mb-4">{solution.icon}</div>
                <h3 className="text-2xl font-semibold mb-3">{solution.title}</h3>
                <p className="text-muted-foreground text-lg">{solution.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to care for your pets and support animal welfare
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🐾", title: "Smart Pet Profiles", description: "Centralized digital record per pet with breed, age, vaccination history, medical reports, and allergies" },
              { icon: "📅", title: "Vet Appointment Booking", description: "Filter by vet specialization, location, availability. Online appointment confirmation" },
              { icon: "🔍", title: "Vet & Pharmacy Directory", description: "Comprehensive directory with contact info, specializations, and services" },
              { icon: "🆘", title: "Lost & Found System", description: "Report missing or found pets with images, location, and community interaction" },
              { icon: "❤️", title: "Charity & Donations", description: "Support shelters, rescues, NGOs with transparent donation tracking" },
              { icon: "📱", title: "QR-Based Digital Pet ID", description: "Unique QR code per pet for instant access to medical & owner info in emergencies" },
              { icon: "🔐", title: "Secure Payments", description: "Encrypted payments for appointments, consultations, medications, and donations" },
              { icon: "📊", title: "Personalized Dashboards", description: "Role-based dashboards for pet owners, veterinarians, shelters, and pharmacies" }
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-card border hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in five simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { number: "1", title: "Create an Account", description: "Sign up in seconds with your email or phone number" },
              { number: "2", title: "Register Your Pet", description: "Add your pet's details, medical history, and upload photos" },
              { number: "3", title: "Book Vets or Manage Records", description: "Find veterinarians, book appointments, and track health records" },
              { number: "4", title: "Scan QR in Emergencies", description: "Use your pet's QR code for instant access to medical info" },
              { number: "5", title: "Support Animal Welfare", description: "Report lost pets, donate to charities, and join the community" }
            ].map((step, index) => (
              <div
                key={index}
                className="relative text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {index < 4 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-primary/30 -z-10" style={{ width: 'calc(100% - 4rem)' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section id="who-its-for" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Who It&apos;s For</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              PetConnect serves everyone in the pet care ecosystem
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "👤", title: "Pet Owners", description: "Manage your pets, track health records, book appointments, and find lost pets" },
              { icon: "👨‍⚕️", title: "Veterinarians", description: "Manage bookings, patient records, and grow your practice" },
              { icon: "🏠", title: "Shelters & NGOs", description: "Post rescue cases, receive donations, and manage animal welfare initiatives" },
              { icon: "💊", title: "Pharmacies", description: "List medicines and services, connect with pet owners and vets" }
            ].map((user, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-card border hover:shadow-lg transition-all hover:-translate-y-1 text-center"
              >
                <div className="text-5xl mb-4">{user.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{user.title}</h3>
                <p className="text-sm text-muted-foreground">{user.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Making a Real Difference</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              PetConnect is transforming pet care in Nepal
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "⚡", title: "Faster Treatment", description: "Quick access to medical records enables faster emergency response" },
              { icon: "📈", title: "Better Health Tracking", description: "Digital records ensure comprehensive health history management" },
              { icon: "🔗", title: "More Reunited Pets", description: "Community-driven lost & found system increases success rates" },
              { icon: "💪", title: "Stronger Welfare Support", description: "Transparent donation system strengthens animal welfare ecosystem" }
            ].map((impact, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 text-center"
              >
                <div className="text-5xl mb-4">{impact.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{impact.title}</h3>
                <p className="text-sm text-muted-foreground">{impact.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Join the Pet Care Revolution in Nepal
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Be part of the movement that&apos;s transforming animal healthcare and welfare
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
            >
              Create Free Account
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full border-2 border-primary px-8 py-4 text-lg font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              Partner as a Veterinarian
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">PetConnect</h3>
              <p className="text-sm text-muted-foreground">
                Connecting pets to care, community, and compassion in Nepal.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
                <li><Link href="#how-it-works" className="text-muted-foreground hover:text-foreground">How It Works</Link></li>
                <li><Link href="#who-its-for" className="text-muted-foreground hover:text-foreground">Who It&apos;s For</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Get in Touch</Link></li>
                <li><Link href="/support" className="text-muted-foreground hover:text-foreground">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} PetConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
