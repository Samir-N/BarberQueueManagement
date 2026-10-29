import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';

const HomeScreen = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/user/services');
      const data = await response.json();
      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = (service) => {
    navigate('/booking', { state: { service } });
  };

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Header */}
      <header className="bg-surface-l2 border-b border-gold-functional border-opacity-20 drop-shadow-surface-l2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center mb-2">
            <h1 className="font-display text-h1 text-text-high">BarberQueue</h1>
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-gold-functional text-surface-base flex items-center justify-center font-semibold hover:scale-105 transition-transform"
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'G'}
            </button>
          </div>
          <p className="text-text-medium text-body">
            {user ? `Welcome, ${user.name}` : 'Discover Premium Grooming Services'}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <Card elevation="l2" className="mb-12 bg-gradient-to-br from-surface-l2 to-surface-l3">
          <div className="text-center py-8">
            <h2 className="font-display text-h2 text-text-high mb-4">
              Royal Grooming Experience
            </h2>
            <p className="text-text-medium text-body max-w-2xl mx-auto mb-6">
              Premium barbering services designed for the discerning gentleman. Book your appointment with expert barbers.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/services')}
            >
              Explore All Services
            </Button>
          </div>
        </Card>

        {/* Services Section */}
        <div>
          <h2 className="font-display text-h2 text-text-high mb-8">Available Services</h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-functional" />
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  onBook={() => handleBookingClick(service)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              headline="No Services Available"
              body="Services are being prepared. Check back soon for premium grooming options."
            />
          )}
        </div>

        {/* Your Bookings Section */}
        <div className="mt-16">
          <h2 className="font-display text-h2 text-text-high mb-8">Your Bookings</h2>
          <Button
            variant="secondary"
            onClick={() => navigate('/bookings')}
          >
            View All Bookings
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface-l2 border-t border-gold-functional border-opacity-20 drop-shadow-surface-l2">
        <div className="max-w-7xl mx-auto px-6 flex justify-around h-16">
          <NavItem
            label="Home"
            active={true}
            onClick={() => navigate('/home')}
          />
          <NavItem
            label="Services"
            onClick={() => navigate('/services')}
          />
          <NavItem
            label="Bookings"
            onClick={() => navigate('/bookings')}
          />
          <NavItem
            label="Profile"
            onClick={() => navigate('/profile')}
          />
        </div>
      </nav>

      {/* Add padding for bottom nav */}
      <div className="h-16" />
    </div>
  );
};

// Service Card Component
const ServiceCard = ({ service, onBook }) => {
  return (
    <Card
      elevation="l1"
      interactive
      className="cursor-pointer hover:border-gold-functional"
      onClick={onBook}
    >
      <div className="flex flex-col h-full">
        {/* Service Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-gold-functional to-gold-decorative rounded-lg flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-surface-base"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        {/* Service Info */}
        <h3 className="font-ui text-h3 text-text-high mb-2">
          {service.serviceName}
        </h3>

        <p className="text-text-medium text-body mb-4 flex-grow">
          {service.description}
        </p>

        {/* Service Meta */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-text-medium text-caption">Duration</span>
            <span className="text-gold-functional font-semibold">{service.duration} min</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-medium text-caption">Price</span>
            <span className="text-gold-functional text-h3">₹{service.price}</span>
          </div>
        </div>

        {/* CTA */}
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={onBook}
        >
          Book Now
        </Button>
      </div>
    </Card>
  );
};

// Navigation Item Component
const NavItem = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        py-2 px-4
        transition-all duration-250
        ${active
          ? 'text-gold-functional'
          : 'text-text-medium hover:text-text-high'
        }
      `}
    >
      <span className="text-caption font-ui font-semibold">{label}</span>
    </button>
  );
};

export default HomeScreen;
