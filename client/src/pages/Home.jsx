import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Phase 1 Components
import HeroSection from '../components/home/HeroSection';
import TrustedStats from '../components/home/TrustedStats';
import HowItWorks from '../components/home/HowItWorks';
import KeyFeatures from '../components/home/KeyFeatures';

// Phase 2 Components
import ComplaintCategories from '../components/home/ComplaintCategories';
import LiveComplaintMap from '../components/home/LiveComplaintMap';
import RecentReports from '../components/home/RecentReports';
import AIFeatures from '../components/home/AIFeatures';
import AuthorityPerformance from '../components/home/AuthorityPerformance';
import LiveActivityFeed from '../components/home/LiveActivityFeed';

// Phase 3 Components
import SuccessStories from '../components/home/SuccessStories';
import Testimonials from '../components/home/Testimonials';
import PlatformScreenshots from '../components/home/PlatformScreenshots';
import MobileAppSection from '../components/home/MobileAppSection';
import SecurityPrivacy from '../components/home/SecurityPrivacy';
import PartnersSection from '../components/home/PartnersSection';
import AwardsRecognition from '../components/home/AwardsRecognition';

// Phase 4 Components
import FAQSection from '../components/home/FAQSection';
import CallToAction from '../components/home/CallToAction';
import Newsletter from '../components/home/Newsletter';
import FloatingButtons from '../components/home/FloatingButtons';

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
                {/* Phase 1: Core */}
                <HeroSection />
                <TrustedStats />
                <HowItWorks />
                <KeyFeatures />
                
                {/* Phase 2: Interactive Modules */}
                <ComplaintCategories />
                <LiveComplaintMap />
                <RecentReports />
                <AIFeatures />
                <AuthorityPerformance />
                <LiveActivityFeed />

                {/* Phase 3: Social Proof & Trust */}
                <SuccessStories />
                <Testimonials />
                <PlatformScreenshots />
                <MobileAppSection />
                <SecurityPrivacy />
                <PartnersSection />
                <AwardsRecognition />

                {/* Phase 4: Engagement */}
                <FAQSection />
                <CallToAction />
                <Newsletter />
            </div>

            {/* Floating Buttons */}
            <FloatingButtons />
        </div>
    );
};

export default Home;
