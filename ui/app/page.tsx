'use client';

import Link from 'next/link';
import { Button, Container, Card, CardBody } from '@/app/components';
import FAQItem from '@/app/components/FAQItem';
import Icon, { 
  faTruck, 
  faMapMarkerAlt, 
  faClock, 
  faShieldAlt, 
  faCheckCircle,
  faUsers,
  faBoxOpen,
  faStar,
  faArrowRight,
  faPhone,
  faEnvelope,
  faQuestionCircle,
  faChartLine,
  faHandshake,
  faGlobe,
  faCalendar
} from '@/app/components/Icon';

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-32 bg-[#0b66c2] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <Container className="relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-tight">
              Fast & Reliable
              <br />
              <span className="text-white drop-shadow-lg">Delivery Services</span>
            </h1>
            <p className="text-3xl md:text-4xl font-semibold text-white mb-12 leading-relaxed max-w-3xl mx-auto">
              Connect with multiple courier companies on one platform. 
              <br className="hidden md:block" />
              Track your packages in real-time and get instant pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/create-order">
                <Button size="lg" icon={faTruck} variant="secondary" className="text-lg px-8 py-4">
                  Create Order
                </Button>
              </Link>
              <Link href="/track">
                <Button variant="secondary" size="lg" icon={faMapMarkerAlt} className="bg-white/10 text-white border-2 border-white hover:bg-white/20 text-lg px-8 py-4">
                  Track Order
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardBody className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon icon={faTruck} className="text-primary" size="xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Multiple Operators</h3>
                <p className="text-lg font-medium text-gray-700">
                  Choose from various courier companies all in one place
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon icon={faClock} className="text-primary" size="xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Real-Time Tracking</h3>
                <p className="text-lg font-medium text-gray-700">
                  Track your packages from pickup to delivery in real-time
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon icon={faShieldAlt} className="text-primary" size="xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Secure & Safe</h3>
                <p className="text-lg font-medium text-gray-700">
                  Your packages are insured and protected throughout the journey
                </p>
              </CardBody>
            </Card>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="py-12 bg-gray-50">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl font-semibold text-gray-700 max-w-2xl mx-auto">
              Simple steps to get your package delivered quickly and safely
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Create Order', desc: 'Fill in pickup and delivery details', icon: faBoxOpen },
              { step: '2', title: 'Choose Operator', desc: 'Select from available courier companies', icon: faTruck },
              { step: '3', title: 'Track Delivery', desc: 'Monitor your package in real-time', icon: faMapMarkerAlt },
              { step: '4', title: 'Receive Package', desc: 'Get notified when delivery is complete', icon: faCheckCircle },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon={item.icon} className="text-white" size="xl" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-white text-base font-extrabold">{item.step}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-lg font-medium text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Service Types Section */}
      <section className="py-12 bg-white">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl font-semibold text-gray-700 max-w-2xl mx-auto">
              Comprehensive delivery solutions for all your needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Same Day Delivery', desc: 'Fast delivery within the same day', icon: faClock, color: 'bg-blue-100 text-blue-600' },
              { title: 'Express Delivery', desc: 'Priority handling for urgent packages', icon: faTruck, color: 'bg-green-100 text-green-600' },
              { title: 'Scheduled Delivery', desc: 'Plan your delivery for a specific time', icon: faCalendar, color: 'bg-purple-100 text-purple-600' },
              { title: 'Intercity Delivery', desc: 'Long-distance delivery across cities', icon: faGlobe, color: 'bg-orange-100 text-orange-600' },
              { title: 'Fragile Items', desc: 'Special handling for delicate packages', icon: faShieldAlt, color: 'bg-red-100 text-red-600' },
              { title: 'Bulk Delivery', desc: 'Cost-effective solutions for large shipments', icon: faBoxOpen, color: 'bg-indigo-100 text-indigo-600' },
            ].map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardBody>
                  <div className={`w-16 h-16 ${service.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon icon={service.icon} size="xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-lg font-medium text-gray-700">{service.desc}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Statistics Section */}
      <section className="py-12 bg-primary-600">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { number: '10K+', label: 'Deliveries Completed', icon: faBoxOpen },
              { number: '50+', label: 'Partner Operators', icon: faHandshake },
              { number: '98%', label: 'Satisfaction Rate', icon: faStar },
              { number: '24/7', label: 'Customer Support', icon: faPhone },
            ].map((stat, index) => (
              <div key={index}>
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon={stat.icon} size="xl" />
                </div>
                <div className="text-5xl md:text-6xl font-extrabold mb-3">{stat.number}</div>
                <div className="text-lg font-bold text-primary-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 bg-gray-50">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl font-semibold text-gray-700 max-w-2xl mx-auto">
              Trusted by thousands of satisfied customers across Rwanda
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Jean Baptiste', role: 'Business Owner', text: 'TumaNow has transformed how we handle deliveries. Fast, reliable, and affordable!', rating: 5 },
              { name: 'Marie Claire', role: 'E-commerce Seller', text: 'The real-time tracking feature is amazing. I always know where my packages are.', rating: 5 },
              { name: 'Paul Mwiza', role: 'Individual User', text: 'Best delivery service in Rwanda. Multiple operators to choose from makes it convenient.', rating: 5 },
            ].map((testimonial, index) => (
              <Card key={index}>
                <CardBody>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Icon key={i} icon={faStar} className="text-yellow-400" size="lg" />
                    ))}
                  </div>
                  <p className="text-lg font-medium text-gray-800 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <div className="text-xl font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-base font-semibold text-gray-600">{testimonial.role}</div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-white">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl font-semibold text-gray-700 max-w-2xl mx-auto">
              Find answers to common questions about our services
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: 'How do I create a delivery order?', a: 'Simply click on "Create Order" and fill in the pickup and delivery details. You can then choose from available courier operators and track your package in real-time.' },
              { q: 'What payment methods do you accept?', a: 'We accept mobile money (MTN, Airtel), bank transfers, and cash on delivery. All payment methods are secure and encrypted.' },
              { q: 'How long does delivery take?', a: 'Delivery time depends on the service type you choose. Same-day delivery is available in major cities, while standard delivery takes 1-3 business days.' },
              { q: 'Can I track my package?', a: 'Yes! You can track your package in real-time using the order number. You\'ll receive updates at every stage of the delivery process.' },
              { q: 'What if my package is damaged?', a: 'All packages are insured. If your package arrives damaged, contact our support team immediately and we\'ll process a claim for you.' },
            ].map((faq, index) => (
              <FAQItem key={index} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-primary-600">
        <Container>
          <div className="text-center text-white">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Ready to Send a Package?</h2>
            <p className="text-2xl font-bold text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers. Create your first order and experience fast, reliable delivery today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-order">
                <Button variant="secondary" size="lg" icon={faTruck}>
                  Get Started
                </Button>
              </Link>
              <Link href="/track">
                <Button variant="outline" size="lg" icon={faMapMarkerAlt} className="border-white text-white hover:bg-white/10">
                  Track Order
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

