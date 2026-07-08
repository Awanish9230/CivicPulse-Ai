import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LazyLoad from '../components/common/LazyLoad';

// Phase 1 Components (Critical for FCP - Synchronous)
import HeroSection from '../components/home/HeroSection';
import TrustedStats from '../components/home/TrustedStats';
import HowItWorks from '../components/home/HowItWorks';
import KeyFeatures from '../components/home/KeyFeatures';

// Lazy Loaded Components (Deferred to avoid blocking main thread)
const ComplaintCategories = React.lazy(() => import('../components/home/ComplaintCategories'));
const LiveComplaintMap = React.lazy(() => import('../components/home/LiveComplaintMap'));
const RecentReports = React.lazy(() => import('../components/home/RecentReports'));
const AIFeatures = React.lazy(() => import('../components/home/AIFeatures'));
const AuthorityPerformance = React.lazy(() => import('../components/home/AuthorityPerformance'));
const LiveActivityFeed = React.lazy(() => import('../components/home/LiveActivityFeed'));

const SuccessStories = React.lazy(() => import('../components/home/SuccessStories'));
const Testimonials = React.lazy(() => import('../components/home/Testimonials'));
const PlatformScreenshots = React.lazy(() => import('../components/home/PlatformScreenshots'));
const MobileAppSection = React.lazy(() => import('../components/home/MobileAppSection'));
const SecurityPrivacy = React.lazy(() => import('../components/home/SecurityPrivacy'));
const PartnersSection = React.lazy(() => import('../components/home/PartnersSection'));
const AwardsRecognition = React.lazy(() => import('../components/home/AwardsRecognition'));

const FAQSection = React.lazy(() => import('../components/home/FAQSection'));
const CallToAction = React.lazy(() => import('../components/home/CallToAction'));
const Newsletter = React.lazy(() => import('../components/home/Newsletter'));
const FloatingButtons = React.lazy(() => import('../components/home/FloatingButtons'));

const Home = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('report') === 'true') {
            navigate('/complaints', { replace: true });
        }
    }, [location, navigate]);

    return (
        <div className="bg-white min-h-screen font-sans text-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Phase 1: Core (Loaded instantly) */}
                <HeroSection />
                <div className="hidden md:block"><TrustedStats /></div>
                <HowItWorks />
                <KeyFeatures />
                
                {/* Phase 2: Interactive Modules */}
                <LazyLoad height="300px">
                    <div className="hidden md:block"><ComplaintCategories /></div>
                </LazyLoad>
                <LazyLoad height="600px">
                    <LiveComplaintMap />
                </LazyLoad>
                <LazyLoad height="400px">
                    <RecentReports />
                </LazyLoad>
                <div className="hidden md:block">
                    <LazyLoad height="400px"><AIFeatures /></LazyLoad>
                    <LazyLoad height="400px"><AuthorityPerformance /></LazyLoad>
                    <LazyLoad height="300px"><LiveActivityFeed /></LazyLoad>
                </div>

                {/* Phase 3: Social Proof & Trust */}
                <div className="hidden md:block">
                    <LazyLoad height="300px"><SuccessStories /></LazyLoad>
                    <LazyLoad height="400px"><Testimonials /></LazyLoad>
                    <LazyLoad height="600px"><PlatformScreenshots /></LazyLoad>
                </div>
                <LazyLoad height="500px"><MobileAppSection /></LazyLoad>
                <div className="hidden md:block">
                    <LazyLoad height="400px"><SecurityPrivacy /></LazyLoad>
                    <LazyLoad height="200px"><PartnersSection /></LazyLoad>
                    <LazyLoad height="300px"><AwardsRecognition /></LazyLoad>
                </div>

                {/* Phase 4: Engagement */}
                <div className="hidden md:block">
                    <LazyLoad height="500px"><FAQSection /></LazyLoad>
                </div>
                <LazyLoad height="300px"><CallToAction /></LazyLoad>
                <div className="hidden md:block">
                    <LazyLoad height="200px"><Newsletter /></LazyLoad>
                </div>
            </div>

            {/* Floating Buttons */}
            <LazyLoad height="0px" rootMargin="0px">
                <FloatingButtons />
            </LazyLoad>
        </div>
    );
};

export default Home;
