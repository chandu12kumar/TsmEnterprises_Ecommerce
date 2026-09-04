import { Link } from 'react-router-dom'
import { FiTarget, FiEye, FiCheckCircle, FiPhone, FiMail, FiMapPin } from 'react-icons/fi'

const TRUST_FACTORS = [
  { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden charges. What you see is what you pay.' },
  { icon: '🏆', title: 'Quality Vehicles', desc: 'Every vehicle is checked before listing.' },
  { icon: '📋', title: 'Verified Information', desc: 'Accurate vehicle details and document status.' },
  { icon: '🎧', title: 'Customer Support', desc: 'We\'re with you from enquiry to purchase.' },
  { icon: '🚗', title: 'Wide Selection', desc: 'Auto, Cargo, Tractor, Pickup and more.' },
  { icon: '📞', title: 'Hassle-Free Enquiry', desc: 'Call, WhatsApp, or fill the form — we respond fast.' },
]

const TEAM = [
  { name: 'Mantu Kumar', role: 'Founder & Owner', initials: 'MK' },
  { name: 'Ramveer Yadav', role: 'Vehicle Expert', initials: 'RY' },
  { name: 'S. Priya', role: 'Customer Relations', initials: 'SP' },
]

export default function About() {
  return (
    <main className="pt-16">
      {/* Hero */}
      <section className="bg-tsm-navy-950 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1920&h=400&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative z-10 container-custom text-center">
          <span className="inline-block px-3 py-1 bg-tsm-red-600/20 text-tsm-red-400 text-sm font-semibold rounded-full mb-4 uppercase tracking-wide">About Us</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-display mb-4">About TSM Enterprises</h1>
          <div className="h-1 w-16 bg-tsm-red-600 rounded-full mx-auto mb-5" />
          <p className="text-tsm-navy-300 text-lg max-w-2xl mx-auto">
            Your trusted destination for quality second-hand commercial and agricultural vehicles in Tamil Nadu.
          </p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="section-badge">Our Story</span>
              <h2 className="section-title mb-4">Who We Are</h2>
              <div className="divider mb-5" />
              <div className="space-y-4 text-tsm-gray-600 leading-relaxed">
                <p>
                  <strong className="text-tsm-navy-900">TSM Enterprises</strong> is a trusted dealer specializing in buying and selling quality second-hand vehicles for individuals, businesses, farmers, and commercial users across Jharkhand and nearby states.
                </p>
                <p>
                  We stock a wide range of pre-owned vehicles including <strong>Auto Rickshaws, Cargo Autos, Tractors, Pickup Trucks, Mini Trucks, Three-Wheelers, Commercial Vehicles, and Agricultural Vehicles</strong>.
                </p>
                <p>
                  Our mission is simple — connect buyers with reliable, well-priced second-hand vehicles through a transparent and hassle-free process.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                {[
                  { num: '500+', label: 'Vehicles Sold' },
                  { num: '8+', label: 'Vehicle Types' },
                  { num: '5+', label: 'Years Experience' },
                ].map((s, i) => (
                  <div key={i} className="text-center bg-tsm-gray-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-tsm-navy-900 font-display">{s.num}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <img
                src="../src/assets/photo_tsm.png"
                alt="TSM Enterprises vehicle lot"
                className="rounded-2xl shadow-card-hover w-full object-cover h-80 lg:h-96"
              />
              <div className="absolute -bottom-4 -left-4 bg-tsm-red-600 text-white rounded-2xl p-4 shadow-lg">
                <p className="font-bold text-2xl font-display">500+</p>
                <p className="text-red-100 text-xs">Happy Customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section bg-tsm-gray-50">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-8">
              <div className="w-14 h-14 bg-tsm-red-50 rounded-2xl flex items-center justify-center mb-5">
                <FiTarget size={24} className="text-tsm-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-tsm-navy-900 font-display mb-3">Our Mission</h2>
              <div className="h-1 w-10 bg-tsm-red-600 rounded-full mb-4" />
              <p className="text-gray-600 leading-relaxed text-lg italic">
                "To make quality second-hand vehicles accessible at fair and transparent prices — empowering farmers, entrepreneurs, and businesses across Tamil Nadu."
              </p>
            </div>
            <div className="card p-8">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">
                <FiEye size={24} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-tsm-navy-900 font-display mb-3">Our Vision</h2>
              <div className="h-1 w-10 bg-blue-600 rounded-full mb-4" />
              <p className="text-gray-600 leading-relaxed text-lg italic">
                "To become the most trusted destination for second-hand commercial and agricultural vehicles in South India — known for honesty, quality, and reliability."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Trust Us */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="section-badge">Our Promise</span>
            <h2 className="section-title">Why Customers Trust TSM</h2>
            <div className="divider mt-3 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {TRUST_FACTORS.map((f, i) => (
              <div key={i} className="card card-hover p-5 flex items-start gap-4 group">
                <div className="w-12 h-12 bg-tsm-red-50 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl group-hover:bg-tsm-red-100 transition-colors">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-tsm-navy-900 text-sm mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section bg-tsm-navy-950">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 bg-tsm-red-600/20 text-tsm-red-400 text-sm font-semibold rounded-full mb-3 uppercase tracking-wide">Our Team</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white font-display">Meet the TSM Team</h2>
            <div className="h-1 w-16 bg-tsm-red-600 rounded-full mt-3 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {TEAM.map((m, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 bg-tsm-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold font-display">
                  {m.initials}
                </div>
                <h3 className="text-white font-bold font-display">{m.name}</h3>
                <p className="text-tsm-navy-400 text-sm mt-0.5">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="section bg-white">
        <div className="container-custom max-w-3xl">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-tsm-navy-900 font-display mb-6 text-center">Get in Touch</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: <FiPhone size={20} className="text-tsm-red-600" />, label: 'Phone', value: '+91 77590 54042', href: 'tel:+917759054042' },
                { icon: <FiMail size={20} className="text-tsm-red-600" />, label: 'Email', value: 'kamikimnekaku@gmail.com', href: 'mailto:kamikimnekaku@gmail.com' },
                { icon: <FiMapPin size={20} className="text-tsm-red-600" />, label: 'Address', value: 'near govt bus stand gayatri nagar khunti', href: null },
              ].map((c, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 bg-tsm-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    {c.icon}
                  </div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{c.label}</p>
                  {c.href ? (
                    <a href={c.href} className="text-tsm-navy-800 font-semibold text-sm hover:text-tsm-red-600 transition-colors">{c.value}</a>
                  ) : (
                    <p className="text-tsm-navy-800 font-semibold text-sm">{c.value}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link to="/contact" className="btn-primary">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
