import React, { Suspense } from 'react';
import { useInView } from 'react-intersection-observer';

const LazyLoad = ({ children, height = '400px', rootMargin = '200px 0px' }) => {
    const { ref, inView } = useInView({
        triggerOnce: true,
        rootMargin: rootMargin,
    });

    return (
        <div ref={ref} style={{ minHeight: inView ? 'auto' : height }}>
            {inView ? (
                <Suspense fallback={<div style={{ height }} className="animate-pulse bg-slate-50/50 rounded-3xl w-full flex items-center justify-center text-slate-400">Loading section...</div>}>
                    {children}
                </Suspense>
            ) : null}
        </div>
    );
};

export default LazyLoad;
